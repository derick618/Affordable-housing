<?php

namespace Tests\Feature\Marketplace;

use App\Models\Amenity;
use App\Models\Location;
use App\Models\Owner;
use App\Models\Property;
use App\Models\PropertyImage;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoMarketplaceSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DemoMarketplaceSeederTest extends MarketplaceTestCase
{
    /** @return array<string, mixed> */
    private function fixture(): array
    {
        return json_decode(File::get(database_path('seeders/data/demo_properties.json')), true, flags: JSON_THROW_ON_ERROR);
    }

    /** @return array<string, int> */
    private function counts(): array
    {
        return [
            'locations' => Location::count(),
            'owners' => Owner::count(),
            'properties' => Property::withTrashed()->count(),
            'images' => PropertyImage::count(),
            'amenities' => Amenity::count(),
            'amenity_links' => DB::table('amenity_property')->count(),
        ];
    }

    public function test_it_creates_the_twelve_demo_properties_and_their_related_records(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);

        $this->assertSame(12, Property::count());
        $this->assertSame(8, Owner::count());
        $this->assertSame(17, Location::count());   // 5 cities + 12 areas
        $this->assertSame(44, PropertyImage::count());
        $this->assertSame(31, Amenity::count());

        $this->assertSame(0, Property::where('is_demo', false)->count());
        $this->assertSame(0, Owner::where('is_demo', false)->count());
        $this->assertSame(12, Property::where('publication_status', 'published')->count());
    }

    public function test_all_twelve_demo_properties_can_be_retrieved_through_the_api(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);

        $slugs = collect($this->fixture()['properties'])->pluck('slug');
        $this->assertCount(12, $slugs);

        foreach ($slugs as $slug) {
            $this->getJson("/api/properties/{$slug}")
                ->assertOk()
                ->assertJsonPath('data.slug', $slug)
                ->assertJsonPath('data.is_demo', true);
        }

        $this->getJson('/api/properties?per_page=50')->assertOk()->assertJsonPath('meta.total', 12);
    }

    public function test_api_output_matches_the_exported_frontend_data(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);

        foreach ($this->fixture()['properties'] as $expected) {
            $data = $this->getJson("/api/properties/{$expected['slug']}")->assertOk()->json('data');

            foreach (['title', 'summary', 'description', 'property_type', 'monthly_rent', 'currency', 'rent_advance_months',
                'bedrooms', 'bathrooms', 'size_sqm', 'furnishing', 'address_line', 'water_details', 'power_details',
                'water_included', 'power_included', 'nearby', 'featured'] as $field) {
                $this->assertSame($expected[$field], $data[$field], "{$expected['slug']}.{$field}");
            }

            $this->assertSame($expected['availability_status'], $data['availability_status'], "{$expected['slug']} availability");
            $this->assertSame($expected['location'], $data['location']['slug'], "{$expected['slug']} location");

            // Images keep their order, and position 0 is the cover.
            $this->assertSame(array_column($expected['images'], 'position'), array_column($data['images'], 'position'));
            $this->assertSame(0, $data['images'][0]['position']);
            foreach ($expected['images'] as $i => $image) {
                $this->assertStringEndsWith('/'.$image['path'].'.jpg', $data['images'][$i]['url']);
                $this->assertStringEndsWith('/'.$image['path'].'-sm.jpg', $data['images'][$i]['thumb_url']);
            }

            // Every amenity keeps its slug and its note wording.
            $actual = collect($data['amenities'])->mapWithKeys(fn ($a) => [$a['slug'] => $a['note']])->all();
            $wanted = collect($expected['amenities'])->mapWithKeys(fn ($a) => [$a['slug'] => $a['note']])->all();
            $this->assertEquals($wanted, $actual, "{$expected['slug']} amenities");
        }
    }

    public function test_the_wording_of_every_frontend_amenity_survives_as_a_label_or_a_note(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);

        $parking = $this->getJson('/api/properties/affordable-family-house-sinza')->json('data.amenities');
        $notes = collect($parking)->pluck('note', 'slug');

        $this->assertSame('Parking for 2 cars', $notes['parking']);
        $this->assertSame('Own prepaid LUKU meter', $notes['prepaid-electricity']);
    }

    public function test_running_the_seeder_twice_does_not_duplicate_anything(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);
        $first = $this->counts();

        $this->seed(DemoMarketplaceSeeder::class);
        $this->seed(DemoMarketplaceSeeder::class);

        $this->assertSame($first, $this->counts());
        $this->assertSame(12, Property::count());
    }

    public function test_rerunning_refreshes_edited_demo_data_instead_of_duplicating_it(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);
        $slug = 'affordable-studio-ubungo';

        Property::where('slug', $slug)->update(['title' => 'Vandalised', 'monthly_rent' => 1]);
        PropertyImage::where('property_id', Property::where('slug', $slug)->value('id'))->where('position', 2)->delete();

        $this->seed(DemoMarketplaceSeeder::class);

        $this->assertSame('Affordable Studio', Property::where('slug', $slug)->value('title'));
        $this->assertSame(250000, Property::where('slug', $slug)->value('monthly_rent'));
        $this->assertSame(3, PropertyImage::where('property_id', Property::where('slug', $slug)->value('id'))->count());
    }

    public function test_a_soft_deleted_demo_property_is_restored(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);
        Property::where('slug', 'affordable-studio-ubungo')->first()->delete();

        $this->seed(DemoMarketplaceSeeder::class);

        $this->assertNotNull(Property::where('slug', 'affordable-studio-ubungo')->first());
        $this->assertSame(12, Property::count());
    }

    public function test_it_leaves_unrelated_data_untouched(): void
    {
        $city = Location::factory()->city()->create(['name' => 'Real Dar', 'slug' => 'dar-es-salaam']);
        $mine = Property::factory()->in($city)->create(['title' => 'My Real Listing', 'slug' => 'my-real-listing']);
        $myOwner = Owner::factory()->create(['name' => 'Real Owner']);
        $amenity = Amenity::factory()->create(['slug' => 'parking', 'label' => 'My Own Parking Label']);

        $this->seed(DemoMarketplaceSeeder::class);

        $this->assertSame('My Real Listing', $mine->fresh()->title);
        $this->assertFalse($mine->fresh()->is_demo);
        $this->assertSame('Real Owner', $myOwner->fresh()->name);
        $this->assertSame('Real Dar', $city->fresh()->name, 'an existing location must be reused, not renamed');
        $this->assertSame('My Own Parking Label', $amenity->fresh()->label, 'an existing amenity must not be overwritten');
        $this->assertSame(13, Property::count());
        $this->assertSame(1, Location::where('slug', 'dar-es-salaam')->count());
        $this->assertSame(1, Amenity::where('slug', 'parking')->count());
    }

    public function test_a_real_property_with_a_demo_slug_is_never_overwritten(): void
    {
        $real = Property::factory()->create(['slug' => 'affordable-studio-ubungo', 'title' => 'A Real Studio', 'monthly_rent' => 123456]);

        $this->seed(DemoMarketplaceSeeder::class);

        $this->assertSame('A Real Studio', $real->fresh()->title);
        $this->assertSame(123456, $real->fresh()->monthly_rent);
        $this->assertSame(1, Property::where('slug', 'affordable-studio-ubungo')->count());
        $this->assertSame(12, Property::count());   // 11 demo + the real one
    }

    public function test_the_default_database_seeder_does_not_load_demo_marketplace_data(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(0, Property::count());
        $this->assertSame(0, Owner::count());
        $this->assertSame(0, Location::count());
    }

    public function test_demo_dates_are_anchored_to_now(): void
    {
        $this->seed(DemoMarketplaceSeeder::class);

        $property = Property::where('slug', 'modern-2-bedroom-apartment-mikocheni')->first();

        $this->assertTrue($property->published_at->isBetween(now()->subDays(4), now()->subDays(2)));
        $this->assertTrue($property->updated_at->lessThan(now()));
        $this->assertNotNull(Owner::where('is_demo', true)->first()->created_at);
    }
}
