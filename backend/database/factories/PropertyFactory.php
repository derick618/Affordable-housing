<?php

namespace Database\Factories;

use App\Enums\AvailabilityStatus;
use App\Enums\Furnishing;
use App\Enums\PropertyType;
use App\Enums\PublicationStatus;
use App\Models\Location;
use App\Models\Owner;
use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    /**
     * Published, available, unfurnished 2-bed apartment at TZS 400,000 unless a state says otherwise.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::title(fake()->unique()->words(3, true));

        return [
            'owner_id' => Owner::factory(),
            'location_id' => Location::factory(),
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'title' => $title,
            'summary' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'property_type' => PropertyType::Apartment,
            'monthly_rent' => 400000,
            'currency' => 'TZS',
            'rent_advance_months' => 3,
            'bedrooms' => 2,
            'bathrooms' => 1,
            'size_sqm' => 70,
            'furnishing' => Furnishing::Unfurnished,
            'address_line' => fake()->streetAddress(),
            'water_details' => 'Mains water with a storage tank',
            'power_details' => 'Own prepaid LUKU meter',
            'water_included' => false,
            'power_included' => false,
            'nearby' => [['kind' => 'transport', 'text' => 'Daladala stop, 5 min walk']],
            'availability_status' => AvailabilityStatus::Available,
            'available_from' => now()->toDateString(),
            'publication_status' => PublicationStatus::Published,
            'featured' => false,
            'is_demo' => false,
            'published_at' => now(),
        ];
    }

    public function status(PublicationStatus $status): static
    {
        return $this->state(['publication_status' => $status]);
    }

    public function draft(): static
    {
        return $this->status(PublicationStatus::Draft)->state(['published_at' => null]);
    }

    public function archived(): static
    {
        return $this->status(PublicationStatus::Archived);
    }

    public function availability(AvailabilityStatus $status): static
    {
        return $this->state(['availability_status' => $status]);
    }

    public function reserved(): static
    {
        return $this->availability(AvailabilityStatus::Reserved);
    }

    public function rented(): static
    {
        return $this->availability(AvailabilityStatus::Rented);
    }

    public function featured(): static
    {
        return $this->state(['featured' => true]);
    }

    public function ofType(PropertyType $type): static
    {
        return $this->state(['property_type' => $type]);
    }

    public function rent(int $amount): static
    {
        return $this->state(['monthly_rent' => $amount]);
    }

    public function bedrooms(int $count): static
    {
        return $this->state(['bedrooms' => $count]);
    }

    public function in(Location $location): static
    {
        return $this->state(['location_id' => $location->id]);
    }

    public function ownedBy(Owner $owner): static
    {
        return $this->state(['owner_id' => $owner->id]);
    }
}
