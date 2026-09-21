<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PropertyImage>
 */
class PropertyImageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'disk' => PropertyImage::DEMO_DISK,
            'path' => 'properties/'.fake()->unique()->slug(2),
            'alt_text' => null,
            'position' => 0,
            'mime' => 'image/jpeg',
        ];
    }

    public function position(int $position): static
    {
        return $this->state(['position' => $position]);
    }
}
