<?php

namespace Tests\Feature\Marketplace;

use App\Enums\PropertyType;
use App\Enums\PublicationStatus;
use App\Models\Property;
use App\Models\PropertyImage;

class PropertyIndexTest extends MarketplaceTestCase
{
    // ---- visibility -------------------------------------------------------

    public function test_published_properties_appear(): void
    {
        $property = $this->property(['title' => 'Sunny Flat']);

        $this->getJson('/api/properties')
            ->assertOk()
            ->assertJsonPath('data.0.slug', $property->slug)
            ->assertJsonPath('data.0.title', 'Sunny Flat')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_draft_pending_and_archived_properties_are_hidden(): void
    {
        $this->property(['publication_status' => PublicationStatus::Draft]);
        $this->property(['publication_status' => PublicationStatus::PendingReview]);
        $this->property(['publication_status' => PublicationStatus::Archived]);
        $visible = $this->property();

        $response = $this->getJson('/api/properties')->assertOk();

        $this->assertSame([$visible->slug], $this->slugs($response));
    }

    public function test_soft_deleted_properties_are_hidden(): void
    {
        $gone = $this->property();
        $gone->delete();

        $this->getJson('/api/properties')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_rented_properties_are_visible_by_default(): void
    {
        $rented = $this->property(['availability_status' => 'rented']);

        $this->assertSame([$rented->slug], $this->slugs($this->getJson('/api/properties')->assertOk()));
    }

    // ---- shape ------------------------------------------------------------

    public function test_response_uses_the_existing_pagination_envelope(): void
    {
        $this->property();

        $this->getJson('/api/properties')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'slug', 'title', 'monthly_rent', 'property_type', 'location', 'cover_image']],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'from', 'last_page', 'per_page', 'to', 'total'],
            ]);
    }

    public function test_list_items_are_card_sized_and_never_expose_contact_details(): void
    {
        $owner = $this->owner();
        $property = $this->property(['owner_id' => $owner->id]);
        PropertyImage::factory()->create(['property_id' => $property->id, 'path' => 'properties/a', 'position' => 0]);

        $response = $this->getJson('/api/properties')->assertOk();
        $item = $response->json('data.0');

        foreach (['description', 'amenities', 'images', 'owner', 'nearby'] as $heavy) {
            $this->assertArrayNotHasKey($heavy, $item, "list items should not include {$heavy}");
        }

        $this->assertTrue($item['verified']);
        $this->assertStringContainsString('properties/a-sm.jpg', $item['cover_image']['thumb_url']);
        $this->assertStringNotContainsString($owner->phone, $response->getContent());
        $this->assertStringNotContainsString($owner->whatsapp, $response->getContent());
    }

    public function test_list_items_carry_the_location_path_from_the_top_down(): void
    {
        $region = $this->city('Coastal');
        $city = $this->city('Dar es Salaam', $region);
        $area = $this->area($city, 'Mikocheni');
        $this->property([], $area);

        $this->getJson('/api/properties')
            ->assertOk()
            ->assertJsonPath('data.0.location.slug', 'mikocheni')
            ->assertJsonPath('data.0.location_path.0.slug', 'coastal')
            ->assertJsonPath('data.0.location_path.1.slug', 'dar-es-salaam')
            ->assertJsonPath('data.0.location_path.2.slug', 'mikocheni');
    }

    // ---- pagination -------------------------------------------------------

    public function test_pagination_defaults_to_twelve_per_page(): void
    {
        Property::factory()->count(15)->create();

        $this->getJson('/api/properties')
            ->assertOk()
            ->assertJsonCount(12, 'data')
            ->assertJsonPath('meta.per_page', 12)
            ->assertJsonPath('meta.total', 15)
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/properties?page=2')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_per_page_is_honoured_and_capped_at_fifty(): void
    {
        Property::factory()->count(5)->create();

        $this->getJson('/api/properties?per_page=2')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/properties?per_page=50')->assertOk();
        $this->getJson('/api/properties?per_page=51')->assertStatus(422)->assertJsonValidationErrors('per_page');
    }

    public function test_pagination_links_preserve_the_active_filters(): void
    {
        Property::factory()->count(4)->rent(300000)->create();

        $next = $this->getJson('/api/properties?per_page=2&max_price=500000')->json('links.next');

        $this->assertStringContainsString('max_price=500000', $next);
        $this->assertStringContainsString('per_page=2', $next);
    }

    // ---- filters ----------------------------------------------------------

    public function test_filter_by_location_slug(): void
    {
        $city = $this->city();
        $mikocheni = $this->area($city, 'Mikocheni');
        $sinza = $this->area($city, 'Sinza');
        $inMikocheni = $this->property([], $mikocheni);
        $this->property([], $sinza);

        $response = $this->getJson('/api/properties?location=mikocheni')->assertOk();

        $this->assertSame([$inMikocheni->slug], $this->slugs($response));
    }

    public function test_filtering_by_a_city_includes_its_child_areas(): void
    {
        $dar = $this->city('Dar es Salaam');
        $arusha = $this->city('Arusha');
        $a = $this->property([], $this->area($dar, 'Mikocheni'));
        $b = $this->property([], $this->area($dar, 'Sinza'));
        $c = $this->property([], $dar); // listed directly on the city
        $this->property([], $this->area($arusha, 'Njiro'));

        $slugs = $this->slugs($this->getJson('/api/properties?location=dar-es-salaam')->assertOk());

        $this->assertEqualsCanonicalizing([$a->slug, $b->slug, $c->slug], $slugs);
    }

    public function test_filtering_walks_a_deeper_hierarchy(): void
    {
        $region = $this->city('Coastal Region');
        $city = $this->city('Dar es Salaam', $region);
        $district = $this->city('Kinondoni District', $city);
        $area = $this->area($district, 'Mikocheni');
        $deep = $this->property([], $area);
        $this->property([], $this->area($this->city('Arusha'), 'Njiro'));

        $this->assertSame([$deep->slug], $this->slugs($this->getJson('/api/properties?location=coastal-region')->assertOk()));
    }

    public function test_unknown_location_slug_is_rejected(): void
    {
        $this->getJson('/api/properties?location=atlantis')->assertStatus(422)->assertJsonValidationErrors('location');
    }

    public function test_minimum_price(): void
    {
        $this->property(['monthly_rent' => 200000]);
        $mid = $this->property(['monthly_rent' => 500000]);
        $high = $this->property(['monthly_rent' => 900000]);

        $this->assertEqualsCanonicalizing(
            [$mid->slug, $high->slug],
            $this->slugs($this->getJson('/api/properties?min_price=500000')->assertOk())
        );
    }

    public function test_maximum_price(): void
    {
        $low = $this->property(['monthly_rent' => 200000]);
        $mid = $this->property(['monthly_rent' => 500000]);
        $this->property(['monthly_rent' => 900000]);

        $this->assertEqualsCanonicalizing(
            [$low->slug, $mid->slug],
            $this->slugs($this->getJson('/api/properties?max_price=500000')->assertOk())
        );
    }

    public function test_minimum_bedrooms(): void
    {
        $this->property(['bedrooms' => 0, 'property_type' => PropertyType::Studio]);
        $this->property(['bedrooms' => 1]);
        $two = $this->property(['bedrooms' => 2]);
        $four = $this->property(['bedrooms' => 4]);

        $this->assertEqualsCanonicalizing(
            [$two->slug, $four->slug],
            $this->slugs($this->getJson('/api/properties?bedrooms=2')->assertOk())
        );
    }

    public function test_property_type_accepts_a_single_value_a_csv_and_an_array(): void
    {
        $apartment = $this->property(['property_type' => PropertyType::Apartment]);
        $house = $this->property(['property_type' => PropertyType::House]);
        $room = $this->property(['property_type' => PropertyType::Room]);

        $this->assertSame([$house->slug], $this->slugs($this->getJson('/api/properties?property_type=house')->assertOk()));
        $this->assertEqualsCanonicalizing(
            [$apartment->slug, $room->slug],
            $this->slugs($this->getJson('/api/properties?property_type=apartment,room')->assertOk())
        );
        $this->assertEqualsCanonicalizing(
            [$apartment->slug, $house->slug],
            $this->slugs($this->getJson('/api/properties?property_type[]=apartment&property_type[]=house')->assertOk())
        );
        $this->getJson('/api/properties?property_type=castle')->assertStatus(422)->assertJsonValidationErrors('property_type.0');
    }

    public function test_availability_filter(): void
    {
        $available = $this->property();
        $reserved = $this->property(['availability_status' => 'reserved']);
        $rented = $this->property(['availability_status' => 'rented']);

        $this->assertSame([$available->slug], $this->slugs($this->getJson('/api/properties?availability=available')->assertOk()));
        $this->assertSame([$reserved->slug], $this->slugs($this->getJson('/api/properties?availability=reserved')->assertOk()));
        $this->assertSame([$rented->slug], $this->slugs($this->getJson('/api/properties?availability=rented')->assertOk()));
        $this->getJson('/api/properties?availability=sold')->assertStatus(422)->assertJsonValidationErrors('availability');
    }

    public function test_multiple_filters_combine_with_and(): void
    {
        $dar = $this->city('Dar es Salaam');
        $arusha = $this->city('Arusha');

        $match = $this->property(['property_type' => PropertyType::House, 'monthly_rent' => 500000, 'bedrooms' => 3], $this->area($dar, 'Sinza'));
        $this->property(['property_type' => PropertyType::Apartment, 'monthly_rent' => 500000, 'bedrooms' => 3], $this->area($dar, 'Mikocheni')); // wrong type
        $this->property(['property_type' => PropertyType::House, 'monthly_rent' => 900000, 'bedrooms' => 3], $dar);                                // too expensive
        $this->property(['property_type' => PropertyType::House, 'monthly_rent' => 500000, 'bedrooms' => 1], $dar);                                // too few beds
        $this->property(['property_type' => PropertyType::House, 'monthly_rent' => 500000, 'bedrooms' => 3], $this->area($arusha, 'Njiro'));       // wrong city
        $this->property(['property_type' => PropertyType::House, 'monthly_rent' => 500000, 'bedrooms' => 3, 'availability_status' => 'rented'], $dar); // not available

        $response = $this->getJson('/api/properties?location=dar-es-salaam&property_type=house&min_price=400000&max_price=600000&bedrooms=3&availability=available')->assertOk();

        $this->assertSame([$match->slug], $this->slugs($response));
    }

    public function test_featured_filter(): void
    {
        $featured = $this->property(['featured' => true]);
        $plain = $this->property(['featured' => false]);

        $this->assertSame([$featured->slug], $this->slugs($this->getJson('/api/properties?featured=1')->assertOk()));
        $this->assertSame([$featured->slug], $this->slugs($this->getJson('/api/properties?featured=true')->assertOk()));
        $this->assertSame([$plain->slug], $this->slugs($this->getJson('/api/properties?featured=0')->assertOk()));
        $this->getJson('/api/properties?featured=maybe')->assertStatus(422)->assertJsonValidationErrors('featured');
    }

    public function test_slugs_filter_returns_only_the_requested_listings(): void
    {
        $a = $this->property();
        $b = $this->property();
        $this->property();

        $this->assertEqualsCanonicalizing(
            [$a->slug, $b->slug],
            $this->slugs($this->getJson("/api/properties?slugs={$a->slug},{$b->slug},not-a-real-slug")->assertOk())
        );
    }

    public function test_slugs_are_limited_to_fifty(): void
    {
        $slugs = implode(',', array_map(fn ($i) => "slug-{$i}", range(1, 51)));

        $this->getJson("/api/properties?slugs={$slugs}")->assertStatus(422)->assertJsonValidationErrors('slugs');
    }

    public function test_exclude_removes_listings(): void
    {
        $keep = $this->property();
        $drop = $this->property();

        $response = $this->getJson("/api/properties?exclude={$drop->slug}")->assertOk();

        $this->assertSame([$keep->slug], $this->slugs($response));
    }

    // ---- search (q) -------------------------------------------------------

    public function test_search_matches_title_address_and_location_names(): void
    {
        $city = $this->city('Dar es Salaam');
        $area = $this->area($city, 'Mikocheni');

        $byTitle = $this->property(['title' => 'Bright Garden Flat', 'address_line' => 'Plot 1'], $this->area($city, 'Sinza'));
        $byAddress = $this->property(['title' => 'Plain One', 'address_line' => 'Near Regent Estate'], $this->area($city, 'Ubungo'));
        $byArea = $this->property(['title' => 'Plain Two', 'address_line' => 'Plot 9'], $area);
        $this->property(['title' => 'Unrelated', 'address_line' => 'Somewhere'], $this->area($this->city('Arusha'), 'Njiro'));

        $this->assertSame([$byTitle->slug], $this->slugs($this->getJson('/api/properties?q=garden')->assertOk()));
        $this->assertSame([$byAddress->slug], $this->slugs($this->getJson('/api/properties?q=regent')->assertOk()));
        $this->assertSame([$byArea->slug], $this->slugs($this->getJson('/api/properties?q=mikocheni')->assertOk()));
    }

    public function test_searching_a_city_name_finds_homes_in_its_areas(): void
    {
        $dar = $this->city('Dar es Salaam');
        $a = $this->property([], $this->area($dar, 'Mikocheni'));
        $b = $this->property([], $this->area($dar, 'Sinza'));
        $this->property([], $this->area($this->city('Arusha'), 'Njiro'));

        $slugs = $this->slugs($this->getJson('/api/properties?q='.urlencode('Dar es Salaam'))->assertOk());

        $this->assertEqualsCanonicalizing([$a->slug, $b->slug], $slugs);
    }

    public function test_every_search_word_must_match(): void
    {
        $dar = $this->city('Dar es Salaam');
        $match = $this->property(['title' => 'Modern Studio'], $this->area($dar, 'Ubungo'));
        $this->property(['title' => 'Modern Studio'], $this->area($this->city('Arusha'), 'Njiro'));

        $this->assertSame([$match->slug], $this->slugs($this->getJson('/api/properties?q='.urlencode('studio ubungo'))->assertOk()));
    }

    public function test_search_treats_wildcards_literally(): void
    {
        $this->property(['title' => 'Rent 100% Guaranteed']);
        $this->property(['title' => 'Plain Home']);

        // A bare "%" must match only titles that contain a literal percent sign, not everything.
        $this->assertCount(1, $this->slugs($this->getJson('/api/properties?q='.urlencode('100%'))->assertOk()));
        $this->assertCount(1, $this->slugs($this->getJson('/api/properties?q='.urlencode('%'))->assertOk()));
        // Likewise "_" is a literal underscore, not "any single character".
        $this->assertCount(0, $this->slugs($this->getJson('/api/properties?q='.urlencode('_____'))->assertOk()));
    }

    // ---- sorting ----------------------------------------------------------

    public function test_default_sort_is_featured_then_available_then_newest(): void
    {
        $oldAvailable = $this->property(['published_at' => now()->subDays(10)]);
        $newAvailable = $this->property(['published_at' => now()->subDays(1)]);
        $newRented = $this->property(['published_at' => now(), 'availability_status' => 'rented']);
        $featuredRented = $this->property(['published_at' => now()->subDays(20), 'featured' => true, 'availability_status' => 'rented']);
        $featuredAvailable = $this->property(['published_at' => now()->subDays(30), 'featured' => true]);

        $this->assertSame(
            [$featuredAvailable->slug, $featuredRented->slug, $newAvailable->slug, $oldAvailable->slug, $newRented->slug],
            $this->slugs($this->getJson('/api/properties')->assertOk())
        );
    }

    public function test_sort_newest(): void
    {
        $old = $this->property(['published_at' => now()->subDays(5)]);
        $new = $this->property(['published_at' => now()->subDay()]);

        $this->assertSame([$new->slug, $old->slug], $this->slugs($this->getJson('/api/properties?sort=newest')->assertOk()));
    }

    public function test_sort_by_price(): void
    {
        $cheap = $this->property(['monthly_rent' => 200000]);
        $mid = $this->property(['monthly_rent' => 500000]);
        $dear = $this->property(['monthly_rent' => 900000]);

        $this->assertSame([$cheap->slug, $mid->slug, $dear->slug], $this->slugs($this->getJson('/api/properties?sort=price_asc')->assertOk()));
        $this->assertSame([$dear->slug, $mid->slug, $cheap->slug], $this->slugs($this->getJson('/api/properties?sort=price_desc')->assertOk()));
    }

    public function test_unknown_sort_is_rejected(): void
    {
        $this->getJson('/api/properties?sort=random')->assertStatus(422)->assertJsonValidationErrors('sort');
    }

    // ---- validation & errors ---------------------------------------------

    public function test_invalid_parameters_return_422_with_field_errors(): void
    {
        $this->getJson('/api/properties?min_price=abc&bedrooms=-1&page=0')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['min_price', 'bedrooms', 'page']);
    }

    public function test_api_answers_json_even_without_an_accept_header(): void
    {
        $this->get('/api/properties?per_page=999')
            ->assertStatus(422)
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonValidationErrors('per_page');
    }

    public function test_the_public_list_does_not_need_authentication(): void
    {
        $this->property();

        $this->getJson('/api/properties')->assertOk();
    }
}
