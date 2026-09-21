<?php

namespace Database\Factories;

use App\Models\Amenity;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Amenity>
 */
class AmenityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = Str::title(fake()->unique()->words(2, true));

        return [
            'slug' => Str::slug($label).'-'.Str::lower(Str::random(4)),
            'label' => $label,
            'category' => 'comfort',
            'sort_order' => 0,
        ];
    }
}
