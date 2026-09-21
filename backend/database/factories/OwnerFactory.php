<?php

namespace Database\Factories;

use App\Enums\OwnerType;
use App\Models\Owner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Owner>
 */
class OwnerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'name' => fake()->name(),
            'type' => OwnerType::Landlord,
            // Recognisable, obviously fake numbers so tests can assert they never leak.
            'phone' => '+2557'.fake()->unique()->numerify('########'),
            'whatsapp' => '+2556'.fake()->unique()->numerify('########'),
            'languages' => 'Kiswahili, English',
            'response_time' => 'within a day',
            'verified_at' => null,
            'is_demo' => false,
        ];
    }

    public function verified(): static
    {
        return $this->state(['verified_at' => now()]);
    }

    public function agent(): static
    {
        return $this->state(['type' => OwnerType::Agent]);
    }
}
