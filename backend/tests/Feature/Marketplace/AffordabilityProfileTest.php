<?php

namespace Tests\Feature\Marketplace;

use App\Models\AffordabilityProfile;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class AffordabilityProfileTest extends MarketplaceTestCase
{
    private function signIn(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/profile/affordability')->assertUnauthorized();
        $this->putJson('/api/profile/affordability', ['monthly_budget' => 500000])->assertUnauthorized();
        $this->deleteJson('/api/profile/affordability')->assertUnauthorized();
    }

    public function test_it_is_null_until_saved(): void
    {
        $this->signIn();

        $this->getJson('/api/profile/affordability')->assertOk()->assertExactJson(['data' => null]);
    }

    public function test_saving_and_reading_a_profile(): void
    {
        $this->signIn();
        $area = $this->area($this->city('Dar es Salaam'), 'Mikocheni');

        $this->putJson('/api/profile/affordability', [
            'monthly_budget' => 600000,
            'household_size' => 3,
            'min_bedrooms' => 2,
            'location' => $area->slug,
            'property_types' => ['apartment', 'house'],
        ])->assertCreated()
            ->assertJsonPath('data.monthly_budget', 600000)
            ->assertJsonPath('data.household_size', 3)
            ->assertJsonPath('data.min_bedrooms', 2)
            ->assertJsonPath('data.location.slug', $area->slug)
            ->assertJsonPath('data.property_types', ['apartment', 'house']);

        $this->getJson('/api/profile/affordability')->assertJsonPath('data.monthly_budget', 600000);
    }

    public function test_saving_again_replaces_it_and_leaves_one_row(): void
    {
        $user = $this->signIn();

        $this->putJson('/api/profile/affordability', ['monthly_budget' => 600000, 'household_size' => 4])->assertCreated();
        $this->putJson('/api/profile/affordability', ['monthly_budget' => 450000])->assertOk()
            ->assertJsonPath('data.monthly_budget', 450000)
            ->assertJsonPath('data.household_size', null)
            ->assertJsonPath('data.property_types', []);

        $this->assertSame(1, AffordabilityProfile::where('user_id', $user->id)->count());
    }

    public function test_every_field_is_optional(): void
    {
        $this->signIn();

        $this->putJson('/api/profile/affordability', [])->assertCreated()->assertJsonPath('data.monthly_budget', null);
    }

    public function test_validation(): void
    {
        $this->signIn();

        $this->putJson('/api/profile/affordability', [
            'monthly_budget' => 5,
            'household_size' => 0,
            'min_bedrooms' => 50,
            'location' => 'atlantis',
            'property_types' => ['castle', 'castle'],
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'monthly_budget', 'household_size', 'min_bedrooms', 'location', 'property_types.0',
        ]);
    }

    public function test_it_can_be_deleted(): void
    {
        $user = $this->signIn();
        $this->putJson('/api/profile/affordability', ['monthly_budget' => 600000])->assertCreated();

        $this->deleteJson('/api/profile/affordability')->assertNoContent();

        $this->assertDatabaseCount('affordability_profiles', 0);
        $this->getJson('/api/profile/affordability')->assertExactJson(['data' => null]);
        $this->deleteJson('/api/profile/affordability')->assertNoContent();
        $this->assertNotNull($user->fresh());
    }

    public function test_profiles_are_private_to_their_user(): void
    {
        $other = User::factory()->create();
        AffordabilityProfile::create(['user_id' => $other->id, 'monthly_budget' => 999000]);

        $this->signIn();

        $this->getJson('/api/profile/affordability')->assertExactJson(['data' => null]);
        $this->deleteJson('/api/profile/affordability')->assertNoContent();

        $this->assertSame(999000, AffordabilityProfile::where('user_id', $other->id)->value('monthly_budget'));
    }

    public function test_the_profile_does_not_change_public_listings(): void
    {
        $cheap = $this->property(['monthly_rent' => 200000]);
        $pricey = $this->property(['monthly_rent' => 900000]);
        $this->signIn();
        $this->putJson('/api/profile/affordability', ['monthly_budget' => 300000])->assertCreated();

        $this->assertEqualsCanonicalizing(
            [$cheap->slug, $pricey->slug],
            $this->slugs($this->getJson('/api/properties')->assertOk())
        );
    }
}
