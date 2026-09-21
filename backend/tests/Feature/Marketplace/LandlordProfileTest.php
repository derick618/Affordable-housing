<?php

namespace Tests\Feature\Marketplace;

use App\Models\Owner;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class LandlordProfileTest extends LandlordTestCase
{
    private function profile(array $overrides = []): array
    {
        return [
            'name' => 'Amina Mwakasege',
            'type' => 'landlord',
            'phone' => '+255 712 345 678',
            'whatsapp' => '+255712345678',
            'languages' => 'Kiswahili, English',
            'response_time' => 'within a day',
            ...$overrides,
        ];
    }

    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/landlord/profile')->assertUnauthorized();
        $this->putJson('/api/landlord/profile', $this->profile())->assertUnauthorized();
    }

    public function test_the_profile_is_null_until_created(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/landlord/profile')->assertOk()->assertExactJson(['data' => null]);
    }

    public function test_a_user_can_become_a_landlord_without_changing_their_role(): void
    {
        $user = User::factory()->create(['role' => 'applicant']);
        Sanctum::actingAs($user);

        $this->putJson('/api/landlord/profile', $this->profile())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Amina Mwakasege')
            ->assertJsonPath('data.phone', '+255 712 345 678')
            ->assertJsonPath('data.verified', false);

        $this->assertSame($user->id, Owner::first()->user_id);
        $this->assertSame('applicant', $user->fresh()->role);
        $this->getJson('/api/landlord/profile')->assertJsonPath('data.name', 'Amina Mwakasege');
    }

    public function test_updating_the_profile_does_not_create_a_second_one(): void
    {
        $this->landlord();

        $this->putJson('/api/landlord/profile', $this->profile(['name' => 'New Name']))->assertOk();

        $this->assertDatabaseCount('owners', 1);
        $this->assertSame('New Name', Owner::first()->name);
    }

    public function test_verification_cannot_be_set_by_the_user(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/landlord/profile', $this->profile(['verified_at' => now()->toDateTimeString(), 'verified' => true, 'user_id' => 999]))
            ->assertCreated()
            ->assertJsonPath('data.verified', false);

        $this->assertNull(Owner::first()->verified_at);
    }

    public function test_changing_name_or_phone_removes_verification_but_other_edits_keep_it(): void
    {
        $this->landlord(['name' => 'Amina Mwakasege', 'phone' => '+255712345678', 'verified_at' => now()]);

        $this->putJson('/api/landlord/profile', $this->profile(['phone' => '+255712345678', 'languages' => 'English']))
            ->assertOk()->assertJsonPath('data.verified', true);

        $this->putJson('/api/landlord/profile', $this->profile(['phone' => '+255700000009']))
            ->assertOk()->assertJsonPath('data.verified', false);
    }

    public function test_validation(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/landlord/profile', [])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'type', 'phone']);
        $this->putJson('/api/landlord/profile', $this->profile(['phone' => 'call me']))
            ->assertUnprocessable()->assertJsonValidationErrors('phone');
        $this->putJson('/api/landlord/profile', $this->profile(['type' => 'wizard']))
            ->assertUnprocessable()->assertJsonValidationErrors('type');
    }

    public function test_the_public_api_still_never_shows_the_phone_of_a_real_landlord(): void
    {
        $user = $this->landlord(['phone' => '+255711111111', 'whatsapp' => '+255722222222']);
        $property = $this->property(['owner_id' => $user->owner->id]);

        $body = $this->getJson("/api/properties/{$property->slug}")->assertOk()->getContent();

        $this->assertStringNotContainsString('255711111111', $body);
        $this->assertStringNotContainsString('255722222222', $body);
    }
}
