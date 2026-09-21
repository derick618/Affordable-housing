<?php

namespace Tests\Feature\Marketplace;

use App\Enums\PublicationStatus;
use App\Models\Owner;
use App\Models\Property;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class ModerationTest extends LandlordTestCase
{
    private function pending(array $attributes = []): Property
    {
        return $this->property([
            'publication_status' => 'pending_review',
            'published_at' => null,
            'submitted_at' => now(),
            ...$attributes,
        ]);
    }

    public function test_landlords_and_guests_cannot_reach_moderation(): void
    {
        $property = $this->pending();

        $this->getJson('/api/moderation/properties')->assertUnauthorized();
        $this->postJson("/api/moderation/properties/{$property->slug}/approve")->assertUnauthorized();

        $this->landlord();
        $this->getJson('/api/moderation/properties')->assertForbidden();
        $this->postJson("/api/moderation/properties/{$property->slug}/approve")->assertForbidden();
        $this->getJson('/api/moderation/owners')->assertForbidden();
        $this->assertSame(PublicationStatus::PendingReview, $property->fresh()->publication_status);
    }

    public function test_the_queue_lists_listings_waiting_for_review_oldest_first(): void
    {
        $newer = $this->pending(['submitted_at' => now()]);
        $older = $this->pending(['submitted_at' => now()->subDay()]);
        $this->property(); // published, not in the queue
        $this->property(['publication_status' => 'draft']);
        $this->staff();

        $this->assertSame([$older->slug, $newer->slug], $this->slugs($this->getJson('/api/moderation/properties')->assertOk()));
    }

    public function test_the_queue_never_contains_demo_listings(): void
    {
        $this->pending(['is_demo' => true]);
        $this->staff();

        $this->getJson('/api/moderation/properties')->assertJsonCount(0, 'data');
    }

    public function test_approving_publishes_the_listing_and_records_the_reviewer(): void
    {
        $property = $this->pending(['moderation_note' => 'old note']);
        $officer = $this->staff('housing_officer');

        $this->postJson("/api/moderation/properties/{$property->slug}/approve")
            ->assertOk()->assertJsonPath('data.publication_status', 'published');

        $fresh = $property->fresh();
        $this->assertNotNull($fresh->published_at);
        $this->assertSame($officer->id, $fresh->reviewed_by);
        $this->assertNull($fresh->moderation_note);
        $this->getJson("/api/properties/{$property->slug}")->assertOk();
    }

    public function test_rejecting_returns_a_draft_with_the_reason(): void
    {
        $property = $this->pending();
        $this->staff('super_admin');

        $this->postJson("/api/moderation/properties/{$property->slug}/reject", ['note' => 'Photos do not show the home.'])
            ->assertOk()
            ->assertJsonPath('data.publication_status', 'draft')
            ->assertJsonPath('data.moderation_note', 'Photos do not show the home.');

        $this->getJson("/api/properties/{$property->slug}")->assertNotFound();
    }

    public function test_the_landlord_sees_the_reason_and_can_fix_and_resubmit(): void
    {
        $landlord = $this->landlord();
        $property = $this->pending(['owner_id' => $landlord->owner->id]);
        $property->images()->create(['disk' => 'demo', 'path' => 'properties/x', 'position' => 0]);
        $property->forceFill(['publication_status' => 'draft', 'moderation_note' => 'Add a clearer photo.'])->save();

        $this->getJson("/api/landlord/properties/{$property->slug}")->assertJsonPath('data.moderation_note', 'Add a clearer photo.');

        $this->postJson("/api/landlord/properties/{$property->slug}/submit")->assertOk();
        $this->assertNull($property->fresh()->moderation_note, 'a new submission clears the old note');
    }

    public function test_rejecting_requires_a_reason(): void
    {
        $property = $this->pending();
        $this->staff();

        $this->postJson("/api/moderation/properties/{$property->slug}/reject", [])
            ->assertUnprocessable()->assertJsonValidationErrors('note');
    }

    public function test_only_listings_in_review_can_be_approved_or_rejected(): void
    {
        $published = $this->property();
        $draft = $this->property(['publication_status' => 'draft']);
        $this->staff();

        $this->postJson("/api/moderation/properties/{$published->slug}/approve")->assertUnprocessable();
        $this->postJson("/api/moderation/properties/{$draft->slug}/approve")->assertUnprocessable();
        $this->postJson("/api/moderation/properties/{$draft->slug}/reject", ['note' => 'nope nope'])->assertUnprocessable();
    }

    public function test_auditors_can_look_but_not_decide(): void
    {
        $property = $this->pending();
        $this->staff('auditor');

        $this->getJson('/api/moderation/properties')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/moderation/properties/{$property->slug}")->assertOk();
        $this->postJson("/api/moderation/properties/{$property->slug}/approve")->assertForbidden();
        $this->postJson("/api/moderation/properties/{$property->slug}/reject", ['note' => 'not allowed'])->assertForbidden();
        $this->assertSame(PublicationStatus::PendingReview, $property->fresh()->publication_status);
    }

    // ------------------------------------------------------------------ owners

    public function test_staff_can_list_landlord_profiles_with_contact_details_and_verify_them(): void
    {
        $user = User::factory()->create();
        $owner = Owner::factory()->create(['user_id' => $user->id, 'phone' => '+255700123456']);
        Owner::factory()->create(['user_id' => null]); // demo-style owner, no login
        $officer = $this->staff();

        $this->getJson('/api/moderation/owners')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone', '+255700123456')
            ->assertJsonPath('data.0.verified', false);

        $this->postJson("/api/moderation/owners/{$owner->id}/verify")->assertOk()->assertJsonPath('data.verified', true);
        $this->assertSame($officer->id, $owner->fresh()->verified_by);
        $this->getJson('/api/moderation/owners?verified=1')->assertJsonCount(1, 'data');
        $this->getJson('/api/moderation/owners?verified=0')->assertJsonCount(0, 'data');

        $this->deleteJson("/api/moderation/owners/{$owner->id}/verify")->assertOk()->assertJsonPath('data.verified', false);
    }

    public function test_verifying_makes_the_public_badge_appear(): void
    {
        $user = User::factory()->create();
        $owner = Owner::factory()->create(['user_id' => $user->id]);
        $property = $this->property(['owner_id' => $owner->id]);

        $this->getJson("/api/properties/{$property->slug}")->assertJsonPath('data.verified', false);

        $this->staff();
        $this->postJson("/api/moderation/owners/{$owner->id}/verify")->assertOk();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/properties/{$property->slug}")->assertJsonPath('data.verified', true);
    }

    public function test_landlords_cannot_verify_themselves(): void
    {
        $landlord = $this->landlord();

        $this->postJson("/api/moderation/owners/{$landlord->owner->id}/verify")->assertForbidden();
        $this->assertNull($landlord->owner->fresh()->verified_at);
    }

    public function test_amenities_are_listed_publicly_for_the_form(): void
    {
        $this->amenity('wifi', 'Wi-Fi');
        $this->amenity('parking', 'Parking');

        $this->getJson('/api/amenities')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonStructure(['data' => [['slug', 'label', 'category']]]);
    }
}
