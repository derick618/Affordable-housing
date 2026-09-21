<?php

namespace Tests\Feature\Marketplace;

use App\Models\Location;
use App\Models\Property;

class LocationApiTest extends MarketplaceTestCase
{
    public function test_lists_locations_publicly_with_their_type_and_parent(): void
    {
        $dar = $this->city('Dar es Salaam');
        $this->area($dar, 'Mikocheni');

        $this->getJson('/api/locations')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['slug' => 'dar-es-salaam', 'type' => 'city', 'parent_slug' => null])
            ->assertJsonFragment(['slug' => 'mikocheni', 'type' => 'area', 'parent_slug' => 'dar-es-salaam']);
    }

    public function test_filter_by_type(): void
    {
        $dar = $this->city('Dar es Salaam');
        $this->area($dar, 'Mikocheni');

        $cities = $this->getJson('/api/locations?type=city')->assertOk();
        $areas = $this->getJson('/api/locations?type=area')->assertOk();

        $this->assertSame(['dar-es-salaam'], $cities->json('data.*.slug'));
        $this->assertSame(['mikocheni'], $areas->json('data.*.slug'));
        $this->getJson('/api/locations?type=street')->assertStatus(422)->assertJsonValidationErrors('type');
    }

    public function test_supports_the_full_hierarchy_of_types(): void
    {
        Location::factory()->region()->create(['slug' => 'r']);
        Location::factory()->city()->create(['slug' => 'c']);
        Location::factory()->district()->create(['slug' => 'd']);
        Location::factory()->create(['slug' => 'a']);

        foreach (['region' => 'r', 'city' => 'c', 'district' => 'd', 'area' => 'a'] as $type => $slug) {
            $this->assertSame([$slug], $this->getJson("/api/locations?type={$type}")->assertOk()->json('data.*.slug'));
        }
    }

    public function test_filter_by_parent_returns_direct_children_only(): void
    {
        $dar = $this->city('Dar es Salaam');
        $arusha = $this->city('Arusha');
        $district = Location::factory()->district()->within($dar)->create(['slug' => 'kinondoni-district', 'name' => 'Kinondoni District']);
        $this->area($district, 'Mikocheni');
        $this->area($arusha, 'Njiro');

        $this->assertSame(['kinondoni-district'], $this->getJson('/api/locations?parent=dar-es-salaam')->assertOk()->json('data.*.slug'));
        $this->assertSame(['mikocheni'], $this->getJson('/api/locations?parent=kinondoni-district')->assertOk()->json('data.*.slug'));
        $this->getJson('/api/locations?parent=atlantis')->assertStatus(422)->assertJsonValidationErrors('parent');
    }

    public function test_counts_are_omitted_unless_requested(): void
    {
        $this->property([], $this->city());

        $this->assertArrayNotHasKey('properties_count', $this->getJson('/api/locations')->assertOk()->json('data.0'));
    }

    public function test_with_counts_counts_only_published_properties_and_includes_child_areas(): void
    {
        $dar = $this->city('Dar es Salaam');
        $arusha = $this->city('Arusha');
        $mikocheni = $this->area($dar, 'Mikocheni');
        $sinza = $this->area($dar, 'Sinza');
        $empty = $this->area($arusha, 'Njiro');

        $this->property([], $mikocheni);
        $this->property([], $mikocheni);
        $this->property([], $sinza);
        $this->property([], $dar);                                    // directly on the city
        $this->property(['publication_status' => 'draft'], $mikocheni);
        $this->property(['publication_status' => 'archived'], $sinza);
        $this->property(['publication_status' => 'pending_review'], $empty);
        $this->property([], $mikocheni)->delete();                    // soft-deleted
        $this->property(['availability_status' => 'rented'], $sinza); // rented still counts (visible by default)

        $counts = collect($this->getJson('/api/locations?with_counts=1')->assertOk()->json('data'))->pluck('properties_count', 'slug');

        $this->assertSame(2, $counts['mikocheni']);
        $this->assertSame(2, $counts['sinza']);
        $this->assertSame(5, $counts['dar-es-salaam']);   // 2 + 2 + 1 direct
        $this->assertSame(0, $counts['njiro']);
        $this->assertSame(0, $counts['arusha']);
    }

    public function test_counts_match_what_the_property_list_returns(): void
    {
        $dar = $this->city('Dar es Salaam');
        $this->property([], $this->area($dar, 'Mikocheni'));
        $this->property([], $this->area($dar, 'Sinza'));
        $this->property(['publication_status' => 'draft'], $dar);

        $count = collect($this->getJson('/api/locations?type=city&with_counts=true')->json('data'))->firstWhere('slug', 'dar-es-salaam')['properties_count'];
        $total = $this->getJson('/api/properties?location=dar-es-salaam')->json('meta.total');

        $this->assertSame($total, $count);
    }

    public function test_with_counts_accepts_only_boolean_values(): void
    {
        $this->getJson('/api/locations?with_counts=banana')->assertStatus(422)->assertJsonValidationErrors('with_counts');
    }

    public function test_locations_do_not_need_authentication(): void
    {
        Property::factory()->create();

        $this->getJson('/api/locations')->assertOk();
    }
}
