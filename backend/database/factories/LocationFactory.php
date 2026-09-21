<?php

namespace Database\Factories;

use App\Enums\LocationType;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->city();

        return [
            'parent_id' => null,
            'type' => LocationType::Area,
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
        ];
    }

    public function ofType(LocationType $type): static
    {
        return $this->state(['type' => $type]);
    }

    public function city(): static
    {
        return $this->ofType(LocationType::City);
    }

    public function region(): static
    {
        return $this->ofType(LocationType::Region);
    }

    public function district(): static
    {
        return $this->ofType(LocationType::District);
    }

    public function within(Location $parent): static
    {
        return $this->state(['parent_id' => $parent->id]);
    }
}
