<?php

namespace Tests\Feature\Marketplace;

use App\Enums\PublicationStatus;
use App\Models\Amenity;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class LandlordListingsTest extends LandlordTestCase
{
    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/landlord/properties')->assertUnauthorized();
        $this->postJson('/api/landlord/properties', $this->listingPayload())->assertUnauthorized();
    }

    public function test_a_user_without_a_profile_is_told_to_create_one(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/landlord/properties')->assertForbidden()->assertJsonPath('code', 'owner_profile_required');
        $this->postJson('/api/landlord/properties', $this->listingPayload())->assertForbidden()
            ->assertJsonPath('code', 'owner_profile_required');
    }

    public function test_creating_a_listing_makes_a_private_draft_owned_by_the_landlord(): void
    {
        $user = $this->landlord();
        $this->amenity('parking', 'Parking');

        $response = $this->postJson('/api/landlord/properties', $this->listingPayload([
            'amenities' => [['slug' => 'parking', 'note' => 'Parking for 2 cars']],
        ]))->assertCreated();

        $response->assertJsonPath('data.title', 'Bright 2 Bedroom Apartment')
            ->assertJsonPath('data.publication_status', 'draft')
            ->assertJsonPath('data.monthly_rent', 650000)
            ->assertJsonPath('data.location.slug', $this->area->slug)
            ->assertJsonPath('data.amenities.0.note', 'Parking for 2 cars')
            ->assertJsonPath('data.featured', false)
            ->assertJsonPath('data.is_demo', false);

        $property = Property::where('slug', $response->json('data.slug'))->firstOrFail();
        $this->assertSame($user->owner->id, $property->owner_id);
        $this->assertNull($property->published_at);
        $this->assertMatchesRegularExpression('/^bright-2-bedroom-apartment-[a-z0-9]{6}$/', $property->slug);

        // Not on the public marketplace.
        $this->getJson("/api/properties/{$property->slug}")->assertNotFound();
        $this->assertSame([], $this->getJson('/api/properties')->json('data'));
    }

    public function test_protected_fields_cannot_be_set_by_the_landlord(): void
    {
        $user = $this->landlord();
        $other = $this->owner();

        $response = $this->postJson('/api/landlord/properties', $this->listingPayload([
            'owner_id' => $other->id,
            'slug' => 'my-own-slug',
            'featured' => true,
            'is_demo' => true,
            'publication_status' => 'published',
            'published_at' => now()->toDateTimeString(),
            'moderation_note' => 'pre-approved',
        ]))->assertCreated();

        $property = Property::where('slug', $response->json('data.slug'))->firstOrFail();
        $this->assertNotSame('my-own-slug', $property->slug);
        $this->assertSame($user->owner->id, $property->owner_id);
        $this->assertFalse($property->featured);
        $this->assertFalse($property->is_demo);
        $this->assertSame(PublicationStatus::Draft, $property->publication_status);
        $this->assertNull($property->published_at);
        $this->assertNull($property->moderation_note);
    }

    public function test_validation_errors(): void
    {
        $this->landlord();

        $this->postJson('/api/landlord/properties', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'property_type', 'monthly_rent', 'bedrooms', 'bathrooms', 'location']);

        $this->postJson('/api/landlord/properties', $this->listingPayload([
            'monthly_rent' => 50,
            'property_type' => 'castle',
            'location' => 'atlantis',
            'bedrooms' => -1,
            'nearby' => [['kind' => 'casino', 'text' => 'x']],
            'amenities' => [['slug' => 'no-such-amenity']],
            'latitude' => 200,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['monthly_rent', 'property_type', 'location', 'bedrooms', 'nearby.0.kind', 'amenities.0.slug', 'latitude']);
    }

    public function test_a_landlord_sees_only_their_own_listings_in_every_state(): void
    {
        $user = $this->landlord();
        $mine = [
            $this->property(['owner_id' => $user->owner->id, 'publication_status' => 'draft']),
            $this->property(['owner_id' => $user->owner->id]),
            $this->property(['owner_id' => $user->owner->id, 'publication_status' => 'archived']),
        ];
        $this->property(); // someone else's

        $response = $this->getJson('/api/landlord/properties')->assertOk();

        $this->assertEqualsCanonicalizing(collect($mine)->pluck('slug')->all(), $this->slugs($response));
        $response->assertJsonStructure(['data' => [['slug', 'publication_status', 'moderation_note', 'cover_image', 'images_count']]]);

        $this->getJson('/api/landlord/properties?status=draft')->assertJsonCount(1, 'data');
        $this->getJson('/api/landlord/properties?status=bogus')->assertUnprocessable();
    }

    public function test_listings_of_other_owners_look_like_they_do_not_exist(): void
    {
        $this->landlord();
        $theirs = $this->property(['publication_status' => 'draft']);

        $this->getJson("/api/landlord/properties/{$theirs->slug}")->assertNotFound();
        $this->patchJson("/api/landlord/properties/{$theirs->slug}", ['title' => 'Hijacked'])->assertNotFound();
        $this->deleteJson("/api/landlord/properties/{$theirs->slug}")->assertNotFound();
        $this->postJson("/api/landlord/properties/{$theirs->slug}/submit")->assertNotFound();
        $this->postJson("/api/landlord/properties/{$theirs->slug}/archive")->assertNotFound();

        $this->assertSame($theirs->title, $theirs->fresh()->title);
        $this->assertNotNull($theirs->fresh());
    }

    public function test_updating_changes_fields_and_keeps_the_slug(): void
    {
        $user = $this->landlord();
        $this->amenity('parking', 'Parking');
        $this->amenity('wifi', 'Wi-Fi');
        $property = $this->property(['owner_id' => $user->owner->id, 'publication_status' => 'draft']);
        $property->amenities()->attach([Amenity::where('slug', 'wifi')->value('id')]);

        $this->patchJson("/api/landlord/properties/{$property->slug}", [
            'title' => 'A completely new title',
            'monthly_rent' => 700000,
            'availability_status' => 'reserved',
            'amenities' => [['slug' => 'parking']],
        ])->assertOk()
            ->assertJsonPath('data.title', 'A completely new title')
            ->assertJsonPath('data.slug', $property->slug)
            ->assertJsonPath('data.availability_status', 'reserved')
            ->assertJsonCount(1, 'data.amenities')
            ->assertJsonPath('data.amenities.0.slug', 'parking');

        $this->assertSame(700000, $property->fresh()->monthly_rent);
    }

    public function test_a_partial_update_leaves_other_fields_alone(): void
    {
        $user = $this->landlord();
        $property = $this->property(['owner_id' => $user->owner->id, 'monthly_rent' => 400000, 'bedrooms' => 3]);
        $property->amenities()->attach($this->amenity('wifi', 'Wi-Fi')->id);

        $this->patchJson("/api/landlord/properties/{$property->slug}", ['monthly_rent' => 450000])->assertOk();

        $fresh = $property->fresh();
        $this->assertSame(450000, $fresh->monthly_rent);
        $this->assertSame(3, $fresh->bedrooms);
        $this->assertSame(1, $fresh->amenities()->count(), 'amenities not mentioned must be kept');
    }

    public function test_marking_a_published_listing_rented_is_immediate(): void
    {
        $user = $this->landlord();
        $property = $this->property(['owner_id' => $user->owner->id]);

        $this->patchJson("/api/landlord/properties/{$property->slug}", ['availability_status' => 'rented'])->assertOk();

        $this->getJson("/api/properties/{$property->slug}")->assertOk()->assertJsonPath('data.availability_status', 'rented');
    }

    public function test_deleting_removes_it_from_the_marketplace(): void
    {
        $user = $this->landlord();
        $property = $this->property(['owner_id' => $user->owner->id]);

        $this->deleteJson("/api/landlord/properties/{$property->slug}")->assertNoContent();

        $this->getJson("/api/properties/{$property->slug}")->assertNotFound();
        $this->getJson("/api/landlord/properties/{$property->slug}")->assertNotFound();
        $this->assertSoftDeleted($property);
    }

    // ------------------------------------------------------------------ review workflow

    private function draftWithPhoto(): Property
    {
        $user = $this->landlord();
        $property = $this->property(['owner_id' => $user->owner->id, 'publication_status' => 'draft', 'published_at' => null]);
        PropertyImage::factory()->create(['property_id' => $property->id]);

        return $property;
    }

    public function test_submitting_moves_a_draft_to_review_but_not_to_the_marketplace(): void
    {
        $property = $this->draftWithPhoto();

        $this->postJson("/api/landlord/properties/{$property->slug}/submit")
            ->assertOk()->assertJsonPath('data.publication_status', 'pending_review');

        $this->assertNotNull($property->fresh()->submitted_at);
        $this->getJson("/api/properties/{$property->slug}")->assertNotFound();
    }

    public function test_a_listing_needs_a_photo_and_a_description_before_it_can_be_submitted(): void
    {
        $user = $this->landlord();
        $property = $this->property([
            'owner_id' => $user->owner->id,
            'publication_status' => 'draft',
            'description' => 'Too short.',
        ]);

        $this->postJson("/api/landlord/properties/{$property->slug}/submit")
            ->assertUnprocessable()->assertJsonValidationErrors(['images', 'description']);

        $this->assertSame(PublicationStatus::Draft, $property->fresh()->publication_status);
    }

    public function test_only_valid_transitions_are_allowed(): void
    {
        $user = $this->landlord();
        $published = $this->property(['owner_id' => $user->owner->id]);
        PropertyImage::factory()->create(['property_id' => $published->id]);

        // A published listing cannot be re-submitted, withdrawn or reopened.
        $this->postJson("/api/landlord/properties/{$published->slug}/submit")->assertUnprocessable();
        $this->postJson("/api/landlord/properties/{$published->slug}/withdraw")->assertUnprocessable();
        $this->postJson("/api/landlord/properties/{$published->slug}/reopen")->assertUnprocessable();

        // It can be archived (leaves the marketplace), then reopened as a draft.
        $this->postJson("/api/landlord/properties/{$published->slug}/archive")
            ->assertOk()->assertJsonPath('data.publication_status', 'archived');
        $this->getJson("/api/properties/{$published->slug}")->assertNotFound();
        $this->postJson("/api/landlord/properties/{$published->slug}/archive")->assertUnprocessable();
        $this->postJson("/api/landlord/properties/{$published->slug}/reopen")
            ->assertOk()->assertJsonPath('data.publication_status', 'draft');
    }

    public function test_a_listing_in_review_can_be_withdrawn(): void
    {
        $property = $this->draftWithPhoto();
        $this->postJson("/api/landlord/properties/{$property->slug}/submit")->assertOk();

        $this->postJson("/api/landlord/properties/{$property->slug}/withdraw")
            ->assertOk()->assertJsonPath('data.publication_status', 'draft');
    }
}
