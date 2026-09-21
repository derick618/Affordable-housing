<?php

namespace Tests\Feature\Marketplace;

use App\Models\Inquiry;
use App\Models\Owner;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;

class InquiriesTest extends LandlordTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('inquiries');
    }

    private function message(array $overrides = []): array
    {
        return [
            'name' => 'Juma Hassan',
            'phone' => '+255 754 111 222',
            'email' => 'juma@example.test',
            'preferred_contact' => 'whatsapp',
            'message' => 'Is the flat still available for viewing this weekend?',
            ...$overrides,
        ];
    }

    public function test_a_visitor_can_message_the_owner_without_signing_in(): void
    {
        $property = $this->property();

        $response = $this->postJson("/api/properties/{$property->slug}/inquiries", $this->message())->assertCreated();

        $this->assertDatabaseHas('inquiries', [
            'property_id' => $property->id,
            'user_id' => null,
            'name' => 'Juma Hassan',
            'status' => 'new',
            'preferred_contact' => 'whatsapp',
        ]);
        $this->assertSame(['message'], array_keys($response->json()));
    }

    public function test_the_owners_phone_number_is_never_in_the_response(): void
    {
        $owner = Owner::factory()->create(['phone' => '+255711999888', 'whatsapp' => '+255722999888']);
        $property = $this->property(['owner_id' => $owner->id]);

        $body = $this->postJson("/api/properties/{$property->slug}/inquiries", $this->message())->assertCreated()->getContent();

        $this->assertStringNotContainsString('255711999888', $body);
        $this->assertStringNotContainsString('255722999888', $body);
    }

    public function test_a_signed_in_message_is_linked_to_the_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $property = $this->property();

        $this->postJson("/api/properties/{$property->slug}/inquiries", $this->message())->assertCreated();

        $this->assertSame($user->id, Inquiry::first()->user_id);
    }

    public function test_validation(): void
    {
        $property = $this->property();
        $url = "/api/properties/{$property->slug}/inquiries";

        $this->postJson($url, [])->assertUnprocessable()->assertJsonValidationErrors(['name', 'phone', 'message']);
        $this->postJson($url, $this->message(['phone' => 'call me']))->assertUnprocessable()->assertJsonValidationErrors('phone');
        $this->postJson($url, $this->message(['email' => 'nope']))->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson($url, $this->message(['message' => 'hi']))->assertUnprocessable()->assertJsonValidationErrors('message');
        $this->postJson($url, $this->message(['message' => str_repeat('a', 1001)]))->assertUnprocessable();
        $this->postJson($url, $this->message(['preferred_contact' => 'pigeon']))->assertUnprocessable();

        $this->assertDatabaseCount('inquiries', 0);
    }

    public function test_email_and_preferred_contact_are_optional(): void
    {
        $property = $this->property();

        $this->postJson("/api/properties/{$property->slug}/inquiries", $this->message(['email' => null, 'preferred_contact' => null]))
            ->assertCreated();

        $this->assertSame('phone', Inquiry::first()->preferred_contact);
    }

    public function test_unpublished_unknown_and_rented_listings_cannot_be_messaged(): void
    {
        $draft = $this->property(['publication_status' => 'draft']);
        $rented = $this->property(['availability_status' => 'rented']);

        $this->postJson("/api/properties/{$draft->slug}/inquiries", $this->message())->assertNotFound();
        $this->postJson('/api/properties/nothing/inquiries', $this->message())->assertNotFound();
        $this->postJson("/api/properties/{$rented->slug}/inquiries", $this->message())
            ->assertUnprocessable()->assertJsonValidationErrors('message');
    }

    public function test_the_same_message_twice_in_a_day_is_stored_once(): void
    {
        $property = $this->property();
        $url = "/api/properties/{$property->slug}/inquiries";

        $this->postJson($url, $this->message())->assertCreated();
        $this->postJson($url, $this->message())->assertCreated();
        $this->assertDatabaseCount('inquiries', 1);

        $this->postJson($url, $this->message(['message' => 'A different question about the water supply.']))->assertCreated();
        $this->assertDatabaseCount('inquiries', 2);
    }

    public function test_messaging_is_rate_limited_per_visitor(): void
    {
        $listings = collect(range(1, 9))->map(fn () => $this->property());

        foreach ($listings->take(8) as $property) {
            $this->postJson("/api/properties/{$property->slug}/inquiries", $this->message())->assertCreated();
        }

        $this->postJson("/api/properties/{$listings->last()->slug}/inquiries", $this->message())->assertStatus(429);
    }

    // ------------------------------------------------------------------ the owner's inbox

    public function test_a_landlord_sees_messages_about_their_own_listings_only(): void
    {
        $landlord = $this->landlord();
        $mine = $this->property(['owner_id' => $landlord->owner->id, 'title' => 'My flat']);
        $theirs = $this->property();
        $mineInquiry = Inquiry::factory()->create(['property_id' => $mine->id, 'name' => 'Asha', 'phone' => '+255700111222']);
        Inquiry::factory()->create(['property_id' => $theirs->id]);

        $this->getJson('/api/landlord/inquiries')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mineInquiry->id)
            ->assertJsonPath('data.0.name', 'Asha')
            ->assertJsonPath('data.0.phone', '+255700111222')
            ->assertJsonPath('data.0.property.title', 'My flat')
            ->assertJsonPath('unread_count', 1)
            ->assertJsonMissingPath('data.0.sender_hash');
    }

    public function test_the_inbox_can_be_filtered_and_counts_unread(): void
    {
        $landlord = $this->landlord();
        $a = $this->property(['owner_id' => $landlord->owner->id]);
        $b = $this->property(['owner_id' => $landlord->owner->id]);
        Inquiry::factory()->create(['property_id' => $a->id]);
        Inquiry::factory()->create(['property_id' => $a->id, 'status' => 'read']);
        Inquiry::factory()->create(['property_id' => $b->id]);

        $this->getJson('/api/landlord/inquiries?status=new')->assertJsonCount(2, 'data');
        $this->getJson("/api/landlord/inquiries?property={$a->slug}")->assertJsonCount(2, 'data')->assertJsonPath('unread_count', 3 - 1);
        $this->getJson('/api/landlord/inquiries?status=bogus')->assertUnprocessable();
    }

    public function test_the_inbox_needs_a_profile_and_a_login(): void
    {
        $this->getJson('/api/landlord/inquiries')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/landlord/inquiries')->assertForbidden()->assertJsonPath('code', 'owner_profile_required');
    }

    public function test_a_landlord_can_mark_messages_read_replied_or_closed(): void
    {
        $landlord = $this->landlord();
        $property = $this->property(['owner_id' => $landlord->owner->id]);
        $inquiry = Inquiry::factory()->create(['property_id' => $property->id]);

        $this->patchJson("/api/landlord/inquiries/{$inquiry->id}", ['status' => 'read'])
            ->assertOk()->assertJsonPath('data.status', 'read');
        $this->assertNotNull($inquiry->fresh()->read_at);

        $this->patchJson("/api/landlord/inquiries/{$inquiry->id}", ['status' => 'replied'])->assertOk();
        $this->patchJson("/api/landlord/inquiries/{$inquiry->id}", ['status' => 'new'])->assertOk();
        $this->assertNull($inquiry->fresh()->read_at);
        $this->patchJson("/api/landlord/inquiries/{$inquiry->id}", ['status' => 'exploded'])->assertUnprocessable();
    }

    public function test_someone_elses_message_looks_like_it_does_not_exist(): void
    {
        $this->landlord();
        $theirs = Inquiry::factory()->create();

        $this->patchJson("/api/landlord/inquiries/{$theirs->id}", ['status' => 'closed'])->assertNotFound();

        $this->assertSame('new', $theirs->fresh()->status->value);
    }

    public function test_messages_about_a_deleted_listing_stay_in_the_inbox(): void
    {
        $landlord = $this->landlord();
        $property = $this->property(['owner_id' => $landlord->owner->id]);
        Inquiry::factory()->create(['property_id' => $property->id]);
        $property->delete();

        $this->getJson('/api/landlord/inquiries')->assertJsonCount(1, 'data');
    }

    public function test_listing_counts_include_new_messages(): void
    {
        $landlord = $this->landlord();
        $property = $this->property(['owner_id' => $landlord->owner->id]);
        Inquiry::factory()->count(2)->create(['property_id' => $property->id]);
        Inquiry::factory()->create(['property_id' => $property->id, 'status' => 'closed']);

        $this->getJson('/api/landlord/properties')
            ->assertJsonPath('data.0.inquiries_count', 3)
            ->assertJsonPath('data.0.new_inquiries_count', 2);
    }
}
