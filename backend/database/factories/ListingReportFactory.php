<?php

namespace Database\Factories;

use App\Enums\ListingReportReason;
use App\Enums\ListingReportStatus;
use App\Models\ListingReport;
use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ListingReport>
 */
class ListingReportFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'user_id' => null,
            'reason' => ListingReportReason::Scam,
            'details' => fake()->sentence(),
            'contact' => null,
            'status' => ListingReportStatus::Open,
            'reporter_hash' => hash('sha256', fake()->unique()->ipv4()),
        ];
    }
}
