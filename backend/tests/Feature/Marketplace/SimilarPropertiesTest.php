<?php

namespace Tests\Feature\Marketplace;

use App\Enums\PropertyType;
use App\Models\Location;

class SimilarPropertiesTest extends MarketplaceTestCase
{
    public function test_similar_excludes_the_current_property(): void
    {
        $city = $this->city();
        $source = $this->property([], $this->area($city, 'Mikocheni'));
        $other = $this->property([], $this->area($city, 'Sinza'));

        $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

        $this->assertSame([$other->slug], $slugs);
        $this->assertNotContains($source->slug, $slugs);
    }

    public function test_similar_defaults_to_three_and_respects_the_limit(): void
    {
        $city = $this->city();
        $source = $this->property([], $this->area($city, 'Mikocheni'));
        $this->property([], $city);
        $this->property([], $city);
        $this->property([], $city);
        $this->property([], $city);

        $this->getJson("/api/properties/{$source->slug}/similar")->assertOk()->assertJsonCount(3, 'data');
        $this->getJson("/api/properties/{$source->slug}/similar?limit=1")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/properties/{$source->slug}/similar?limit=5")->assertOk()->assertJsonCount(4, 'data');
        $this->getJson("/api/properties/{$source->slug}/similar?limit=0")->assertStatus(422)->assertJsonValidationErrors('limit');
        $this->getJson("/api/properties/{$source->slug}/similar?limit=13")->assertStatus(422)->assertJsonValidationErrors('limit');
    }

    public function test_same_city_ranks_above_a_different_city(): void
    {
        $dar = $this->city('Dar es Salaam');
        $arusha = $this->city('Arusha');
        $source = $this->property([], $this->area($dar, 'Mikocheni'));
        $sameCity = $this->property([], $this->area($dar, 'Sinza'));
        $otherCity = $this->property([], $this->area($arusha, 'Njiro'));

        $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

        $this->assertSame([$sameCity->slug, $otherCity->slug], $slugs);
    }

    public function test_same_type_ranks_above_a_different_type(): void
    {
        $city = $this->city();
        $source = $this->property(['property_type' => PropertyType::House], $this->area($city, 'A'));
        $otherType = $this->property(['property_type' => PropertyType::Apartment], $this->area($city, 'B'));
        $sameType = $this->property(['property_type' => PropertyType::House], $this->area($city, 'C'));

        $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

        $this->assertSame([$sameType->slug, $otherType->slug], $slugs);
    }

    public function test_price_within_thirty_five_percent_ranks_above_a_far_price(): void
    {
        $city = $this->city();
        $source = $this->property(['monthly_rent' => 500000], $this->area($city, 'A'));
        $far = $this->property(['monthly_rent' => 900000], $this->area($city, 'B'));    // +80%
        $near = $this->property(['monthly_rent' => 650000], $this->area($city, 'C'));   // +30%

        $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

        $this->assertSame([$near->slug, $far->slug], $slugs);
    }

    public function test_the_price_band_edges_are_inclusive(): void
    {
        $city = $this->city();
        $source = $this->property(['monthly_rent' => 400000], $this->area($city, 'A'));
        $justOver = $this->property(['monthly_rent' => 540001], $this->area($city, 'B'));  // just above +35% (540,000)
        $onEdge = $this->property(['monthly_rent' => 540000], $this->area($city, 'C'));    // exactly +35%

        $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

        $this->assertSame([$onEdge->slug, $justOver->slug], $slugs);
    }

    public function test_available_homes_are_preferred(): void
    {
        $city = $this->city();
        $source = $this->property([], $this->area($city, 'A'));
        $rented = $this->property(['availability_status' => 'rented'], $this->area($city, 'B'));
        $available = $this->property([], $this->area($city, 'C'));

        $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

        $this->assertSame([$available->slug, $rented->slug], $slugs);
    }

    public function test_only_available_homes_are_suggested_for_a_reserved_or_rented_source(): void
    {
        $city = $this->city();
        $available = $this->property([], $this->area($city, 'A'));
        $this->property(['availability_status' => 'rented'], $this->area($city, 'B'));
        $this->property(['availability_status' => 'reserved'], $this->area($city, 'C'));

        foreach (['rented', 'reserved'] as $status) {
            $source = $this->property(['availability_status' => $status], $this->area($city, "Source {$status}"));

            $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

            $this->assertContains($available->slug, $slugs);
            $this->assertCount(1, $slugs, "a {$status} source should only get available suggestions");
        }
    }

    public function test_unpublished_properties_are_never_suggested(): void
    {
        $city = $this->city();
        $source = $this->property([], $this->area($city, 'A'));
        $this->property(['publication_status' => 'draft'], $this->area($city, 'B'));
        $this->property(['publication_status' => 'archived'], $this->area($city, 'C'));
        $visible = $this->property([], $this->area($city, 'D'));

        $this->assertSame([$visible->slug], $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk()));
    }

    public function test_with_no_city_it_falls_back_to_sibling_areas(): void
    {
        // Districts with no city above them: "the same place" falls back to the shared parent.
        $district = Location::factory()->district()->create(['name' => 'Some District', 'slug' => 'some-district']);
        $other = Location::factory()->district()->create(['name' => 'Faraway District', 'slug' => 'faraway-district']);
        $source = $this->property([], $this->area($district, 'A'));
        $sibling = $this->property([], $this->area($district, 'B'));
        $stranger = $this->property([], $this->area($other, 'C'));

        $slugs = $this->slugs($this->getJson("/api/properties/{$source->slug}/similar")->assertOk());

        $this->assertSame([$sibling->slug, $stranger->slug], $slugs);
    }

    public function test_similar_items_are_card_sized(): void
    {
        $city = $this->city();
        $source = $this->property([], $city);
        $this->property([], $city);

        $item = $this->getJson("/api/properties/{$source->slug}/similar")->assertOk()->json('data.0');

        $this->assertArrayNotHasKey('description', $item);
        $this->assertArrayHasKey('cover_image', $item);
    }
}
