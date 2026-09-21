<?php

namespace Tests\Feature\Marketplace;

use App\Enums\AvailabilityStatus;
use App\Enums\Furnishing;
use App\Enums\PropertyType;
use App\Enums\PublicationStatus;
use App\Models\Amenity;
use App\Models\Location;
use App\Models\Owner;
use App\Models\Property;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MarketplaceSchemaTest extends MarketplaceTestCase
{
    public function test_marketplace_tables_and_columns_exist(): void
    {
        $expected = [
            'locations' => ['id', 'parent_id', 'type', 'name', 'slug', 'latitude', 'longitude', 'created_at', 'updated_at'],
            'owners' => ['id', 'user_id', 'name', 'type', 'phone', 'whatsapp', 'languages', 'response_time', 'verified_at', 'verified_by', 'is_demo', 'created_at', 'updated_at'],
            'properties' => [
                'id', 'owner_id', 'location_id', 'slug', 'title', 'summary', 'description', 'property_type', 'monthly_rent', 'currency',
                'rent_advance_months', 'bedrooms', 'bathrooms', 'size_sqm', 'furnishing', 'address_line', 'latitude', 'longitude',
                'water_details', 'power_details', 'water_included', 'power_included', 'nearby', 'availability_status', 'available_from',
                'publication_status', 'featured', 'is_demo', 'published_at', 'created_at', 'updated_at', 'deleted_at',
            ],
            'property_images' => ['id', 'property_id', 'disk', 'path', 'alt_text', 'position', 'width', 'height', 'mime', 'size_bytes', 'uploaded_by', 'created_at', 'updated_at'],
            'amenities' => ['id', 'slug', 'label', 'category', 'sort_order', 'created_at', 'updated_at'],
            'amenity_property' => ['property_id', 'amenity_id', 'note'],
        ];

        foreach ($expected as $table => $columns) {
            $this->assertTrue(Schema::hasTable($table), "missing table {$table}");
            $this->assertTrue(Schema::hasColumns($table, $columns), "{$table} is missing columns: ".implode(', ', array_diff($columns, Schema::getColumnListing($table))));
        }
    }

    public function test_favorites_and_reports_tables_exist(): void
    {
        $this->assertTrue(Schema::hasColumns('favorites', ['id', 'user_id', 'property_id', 'created_at']));
        $this->assertTrue(Schema::hasColumns('listing_reports', [
            'id', 'property_id', 'user_id', 'reason', 'details', 'contact', 'status', 'reporter_hash', 'handled_by', 'handled_at',
        ]));
        $this->assertTrue(Schema::hasColumns('properties', ['submitted_at', 'reviewed_by', 'reviewed_at', 'moderation_note']));
    }

    public function test_existing_tables_were_not_altered(): void
    {
        $this->assertEqualsCanonicalizing(
            ['id', 'name', 'email', 'email_verified_at', 'password', 'remember_token', 'created_at', 'updated_at', 'role', 'phone', 'national_id', 'address'],
            Schema::getColumnListing('users')
        );
        $this->assertEqualsCanonicalizing(
            ['id', 'housing_project_id', 'unit_number', 'block', 'floor', 'bedrooms', 'size_sqm', 'ownership_type', 'price', 'status', 'created_at', 'updated_at'],
            Schema::getColumnListing('units')
        );
        $this->assertEqualsCanonicalizing(
            ['id', 'name', 'description', 'address', 'ward', 'district', 'total_units', 'status', 'created_at', 'updated_at'],
            Schema::getColumnListing('housing_projects')
        );
        $this->assertFalse(Schema::hasColumn('units', 'slug'), 'units must stay independent of the marketplace');
    }

    public function test_slug_is_unique_at_the_database_level(): void
    {
        Property::factory()->create(['slug' => 'same-slug']);

        $this->expectException(QueryException::class);

        Property::factory()->create(['slug' => 'same-slug']);
    }

    public function test_location_slug_is_unique(): void
    {
        Location::factory()->create(['slug' => 'dupe']);

        $this->expectException(QueryException::class);

        Location::factory()->create(['slug' => 'dupe']);
    }

    public function test_an_amenity_can_only_be_attached_to_a_property_once(): void
    {
        $property = Property::factory()->create();
        $amenity = Amenity::factory()->create();
        $property->amenities()->attach($amenity->id);

        $this->expectException(QueryException::class);

        DB::table('amenity_property')->insert(['property_id' => $property->id, 'amenity_id' => $amenity->id]);
    }

    public function test_an_owner_with_properties_cannot_be_deleted(): void
    {
        $property = Property::factory()->create();

        $this->expectException(QueryException::class);

        $property->owner->delete();
    }

    public function test_a_location_with_children_or_properties_cannot_be_deleted(): void
    {
        $city = $this->city();
        $this->area($city);

        $this->expectException(QueryException::class);

        $city->delete();
    }

    public function test_deleting_a_property_for_good_removes_its_images_and_amenity_links(): void
    {
        $property = Property::factory()->create();
        $property->images()->create(['disk' => 'demo', 'path' => 'properties/x', 'position' => 0]);
        $property->amenities()->attach(Amenity::factory()->create()->id);

        $property->forceDelete();

        $this->assertSame(0, DB::table('property_images')->count());
        $this->assertSame(0, DB::table('amenity_property')->count());
    }

    public function test_deleting_a_user_keeps_the_owner_profile(): void
    {
        $user = User::factory()->create();
        $owner = Owner::factory()->create(['user_id' => $user->id]);

        $user->delete();

        $this->assertNull($owner->fresh()->user_id);
        $this->assertNotNull($owner->fresh());
    }

    public function test_an_owner_needs_no_user_account(): void
    {
        $owner = Owner::factory()->create(['user_id' => null]);

        $this->assertNull($owner->user);
        $this->assertNull($owner->fresh()->user_id);
    }

    public function test_enum_and_json_casts(): void
    {
        $property = Property::factory()->create(['nearby' => [['kind' => 'market', 'text' => 'Local market']], 'water_included' => true]);
        $fresh = $property->fresh();

        $this->assertInstanceOf(PropertyType::class, $fresh->property_type);
        $this->assertInstanceOf(AvailabilityStatus::class, $fresh->availability_status);
        $this->assertInstanceOf(PublicationStatus::class, $fresh->publication_status);
        $this->assertInstanceOf(Furnishing::class, $fresh->furnishing);
        $this->assertSame([['kind' => 'market', 'text' => 'Local market']], $fresh->nearby);
        $this->assertTrue($fresh->water_included);
        $this->assertIsInt($fresh->monthly_rent);
        $this->assertInstanceOf(CarbonInterface::class, $fresh->available_from);
    }

    public function test_relationships_are_wired_both_ways(): void
    {
        $city = $this->city();
        $area = $this->area($city);
        $owner = Owner::factory()->create();
        $property = Property::factory()->ownedBy($owner)->in($area)->create();

        $this->assertTrue($owner->properties->first()->is($property));
        $this->assertTrue($property->owner->is($owner));
        $this->assertTrue($property->location->is($area));
        $this->assertTrue($area->parent->is($city));
        $this->assertTrue($city->children->first()->is($area));
        $this->assertTrue($area->properties->first()->is($property));
    }
}
