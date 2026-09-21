<?php

namespace Database\Factories;

use App\Enums\InquiryStatus;
use App\Models\Inquiry;
use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Inquiry>
 */
class InquiryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'user_id' => null,
            'name' => fake()->name(),
            'phone' => '+2557'.fake()->numerify('########'),
            'email' => null,
            'preferred_contact' => 'phone',
            'message' => fake()->sentence(12),
            'status' => InquiryStatus::New,
            'sender_hash' => hash('sha256', fake()->unique()->ipv4()),
        ];
    }
}
