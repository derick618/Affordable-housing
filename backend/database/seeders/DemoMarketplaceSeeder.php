<?php

namespace Database\Seeders;

use App\Enums\PublicationStatus;
use App\Models\Amenity;
use App\Models\Location;
use App\Models\Owner;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Loads the 12 demo listings from database/seeders/data/demo_properties.json.
 *
 * Run it explicitly (it is NOT part of DatabaseSeeder):
 *
 *   php artisan db:seed --class=DemoMarketplaceSeeder
 *
 * Safe to run repeatedly:
 *  - properties are matched by slug, owners by phone + is_demo, images by property + position;
 *  - locations and amenities are matched by slug and reused as they are, never modified;
 *  - only records flagged is_demo are ever updated, and a non-demo property that happens to
 *    share a slug is left alone (with a warning);
 *  - nothing is deleted except a demo property's surplus images.
 *
 * Dates in the JSON are offsets ("listed 3 days ago"), so each run re-anchors the demo
 * data to "now" and the listings stay fresh.
 */
class DemoMarketplaceSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(
            File::get(database_path('seeders/data/demo_properties.json')),
            true,
            flags: JSON_THROW_ON_ERROR
        );

        DB::transaction(function () use ($data) {
            $locations = $this->seedLocations($data['locations']);
            $amenities = $this->seedAmenities($data['amenities']);
            $owners = $this->seedOwners($data['owners']);

            $seeded = 0;

            foreach ($data['properties'] as $row) {
                $seeded += $this->seedProperty($row, $locations, $owners, $amenities) ? 1 : 0;
            }

            $this->command?->info("Demo marketplace: {$seeded} of ".count($data['properties']).' properties seeded.');
        });
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, Location> keyed by slug
     */
    private function seedLocations(array $rows): array
    {
        $bySlug = [];

        // Parents first, so children can find them.
        usort($rows, fn ($a, $b) => ($a['parent'] !== null) <=> ($b['parent'] !== null));

        foreach ($rows as $row) {
            $bySlug[$row['slug']] = Location::query()->firstOrCreate(
                ['slug' => $row['slug']],
                [
                    'name' => $row['name'],
                    'type' => $row['type'],
                    'parent_id' => $row['parent'] ? $bySlug[$row['parent']]->id : null,
                ]
            );
        }

        return $bySlug;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, Amenity> keyed by slug
     */
    private function seedAmenities(array $rows): array
    {
        $bySlug = [];

        foreach ($rows as $row) {
            $bySlug[$row['slug']] = Amenity::query()->firstOrCreate(
                ['slug' => $row['slug']],
                ['label' => $row['label'], 'category' => $row['category'], 'sort_order' => $row['sort_order']]
            );
        }

        return $bySlug;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, Owner> keyed by phone
     */
    private function seedOwners(array $rows): array
    {
        $byPhone = [];

        foreach ($rows as $row) {
            $owner = Owner::query()->firstOrNew(['phone' => $row['phone'], 'is_demo' => true]);

            $owner->forceFill([
                'name' => $row['name'],
                'type' => $row['type'],
                'whatsapp' => null,
                'languages' => $row['languages'],
                'response_time' => $row['response_time'],
                'verified_at' => $row['verified'] ? ($owner->verified_at ?? now()) : null,
            ]);

            if (! $owner->exists) {
                // "Member since" is the year the owner record was created.
                $owner->created_at = now()->setDate($row['member_since'], 1, 1)->startOfDay();
            }

            $owner->save();
            $byPhone[$row['phone']] = $owner;
        }

        return $byPhone;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array<string, Location>  $locations
     * @param  array<string, Owner>  $owners
     * @param  array<string, Amenity>  $amenities
     */
    private function seedProperty(array $row, array $locations, array $owners, array $amenities): bool
    {
        $property = Property::withTrashed()->where('slug', $row['slug'])->first();

        if ($property && ! $property->is_demo) {
            $this->command?->warn("Skipped \"{$row['slug']}\": a non-demo property already uses this slug.");

            return false;
        }

        $property ??= new Property;

        if ($property->exists && $property->trashed()) {
            $property->restore();
        }

        $publishedAt = now()->subDays($row['published_days_ago']);

        $property->forceFill([
            'owner_id' => $owners[$row['owner']]->id,
            'location_id' => $locations[$row['location']]->id,
            'slug' => $row['slug'],
            'title' => $row['title'],
            'summary' => $row['summary'],
            'description' => $row['description'],
            'property_type' => $row['property_type'],
            'monthly_rent' => $row['monthly_rent'],
            'currency' => $row['currency'],
            'rent_advance_months' => $row['rent_advance_months'],
            'bedrooms' => $row['bedrooms'],
            'bathrooms' => $row['bathrooms'],
            'size_sqm' => $row['size_sqm'],
            'furnishing' => $row['furnishing'],
            'address_line' => $row['address_line'],
            'latitude' => $row['latitude'],
            'longitude' => $row['longitude'],
            'water_details' => $row['water_details'],
            'power_details' => $row['power_details'],
            'water_included' => $row['water_included'],
            'power_included' => $row['power_included'],
            'nearby' => $row['nearby'],
            'availability_status' => $row['availability_status'],
            'available_from' => now()->addDays($row['available_from_offset_days'])->toDateString(),
            'publication_status' => PublicationStatus::Published,
            'featured' => $row['featured'],
            'is_demo' => true,
            'published_at' => $publishedAt,
            'updated_at' => now()->subDays($row['updated_days_ago']),
        ]);

        if (! $property->exists) {
            $property->created_at = $publishedAt;
        }

        $property->save();

        $this->seedImages($property, $row['images']);
        $this->seedAmenityLinks($property, $row['amenities'], $amenities);

        return true;
    }

    /** @param  list<array<string, mixed>>  $images */
    private function seedImages(Property $property, array $images): void
    {
        foreach ($images as $image) {
            PropertyImage::query()->updateOrCreate(
                ['property_id' => $property->id, 'position' => $image['position']],
                [
                    'disk' => PropertyImage::DEMO_DISK,
                    'path' => $image['path'],
                    'alt_text' => null,
                    'width' => $image['width'],
                    'height' => $image['height'],
                    'mime' => $image['mime'],
                    'size_bytes' => $image['size_bytes'],
                ]
            );
        }

        PropertyImage::query()
            ->where('property_id', $property->id)
            ->where('position', '>', max(array_column($images, 'position')))
            ->delete();
    }

    /**
     * @param  list<array{slug: string, note: string|null}>  $links
     * @param  array<string, Amenity>  $amenities
     */
    private function seedAmenityLinks(Property $property, array $links, array $amenities): void
    {
        $sync = [];

        foreach ($links as $link) {
            $sync[$amenities[$link['slug']]->id] = ['note' => $link['note']];
        }

        $property->amenities()->sync($sync);
    }
}
