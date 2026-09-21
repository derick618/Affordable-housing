<?php

namespace Tests\Feature\Marketplace;

use App\Models\Amenity;
use App\Models\Location;
use App\Models\Owner;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/** Builders shared by the landlord and moderation tests. */
abstract class LandlordTestCase extends MarketplaceTestCase
{
    protected Location $area;

    protected function setUp(): void
    {
        parent::setUp();

        $this->area = $this->area($this->city('Dar es Salaam'), 'Mikocheni');
    }

    /** A signed-in user with an owner profile. */
    protected function landlord(array $owner = [], string $role = 'applicant'): User
    {
        $user = User::factory()->create(['role' => $role]);
        Owner::factory()->create(['user_id' => $user->id, ...$owner]);
        Sanctum::actingAs($user);

        return $user->fresh();
    }

    protected function staff(string $role = 'housing_officer'): User
    {
        $user = User::factory()->create(['role' => $role]);
        Sanctum::actingAs($user);

        return $user;
    }

    /** @param  array<string, mixed>  $overrides */
    protected function listingPayload(array $overrides = []): array
    {
        return [
            'title' => 'Bright 2 Bedroom Apartment',
            'summary' => 'Quiet, close to the main road.',
            'description' => 'A bright second-floor flat with a balcony, tiled floors and a fenced compound.',
            'property_type' => 'apartment',
            'monthly_rent' => 650000,
            'rent_advance_months' => 3,
            'bedrooms' => 2,
            'bathrooms' => 1,
            'size_sqm' => 80,
            'furnishing' => 'semi_furnished',
            'location' => $this->area->slug,
            'address_line' => 'Plot 12, Mikocheni B',
            'water_details' => 'DAWASA mains with a storage tank',
            'power_details' => 'Own prepaid LUKU meter',
            'nearby' => [['kind' => 'transport', 'text' => 'Daladala stop, 5 min walk']],
            'availability_status' => 'available',
            ...$overrides,
        ];
    }

    protected function amenity(string $slug, string $label): Amenity
    {
        return Amenity::factory()->create(['slug' => $slug, 'label' => $label]);
    }
}
