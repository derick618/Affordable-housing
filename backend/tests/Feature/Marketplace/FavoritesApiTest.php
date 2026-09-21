<?php

namespace Tests\Feature\Marketplace;

use App\Models\User;
use Laravel\Sanctum\Sanctum;

class FavoritesApiTest extends MarketplaceTestCase
{
    private function signIn(?User $user = null): User
    {
        $user ??= User::factory()->create(['role' => 'applicant']);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_guests_cannot_use_favorites(): void
    {
        $property = $this->property();

        $this->getJson('/api/favorites')->assertUnauthorized();
        $this->getJson('/api/favorites/slugs')->assertUnauthorized();
        $this->putJson("/api/favorites/{$property->slug}")->assertUnauthorized();
        $this->deleteJson("/api/favorites/{$property->slug}")->assertUnauthorized();
        $this->postJson('/api/favorites/sync', ['slugs' => [$property->slug]])->assertUnauthorized();
    }

    public function test_saving_a_listing_is_idempotent(): void
    {
        $user = $this->signIn();
        $property = $this->property();

        $this->putJson("/api/favorites/{$property->slug}")->assertNoContent();
        $this->putJson("/api/favorites/{$property->slug}")->assertNoContent();

        $this->assertSame(1, $user->favoriteProperties()->count());
        $this->getJson('/api/favorites/slugs')->assertOk()->assertExactJson(['data' => [$property->slug]]);
    }

    public function test_only_published_listings_can_be_saved(): void
    {
        $this->signIn();
        $draft = $this->property(['publication_status' => 'draft']);

        $this->putJson("/api/favorites/{$draft->slug}")->assertNotFound();
        $this->putJson('/api/favorites/no-such-home')->assertNotFound();
    }

    public function test_removing_is_idempotent_and_works_for_unknown_slugs(): void
    {
        $user = $this->signIn();
        $property = $this->property();
        $user->favoriteProperties()->attach($property->id);

        $this->deleteJson("/api/favorites/{$property->slug}")->assertNoContent();
        $this->deleteJson("/api/favorites/{$property->slug}")->assertNoContent();
        $this->deleteJson('/api/favorites/no-such-home')->assertNoContent();

        $this->assertSame(0, $user->favoriteProperties()->count());
    }

    public function test_a_listing_that_was_unpublished_can_still_be_removed(): void
    {
        $user = $this->signIn();
        $property = $this->property();
        $user->favoriteProperties()->attach($property->id);
        $property->update(['publication_status' => 'archived']);

        $this->deleteJson("/api/favorites/{$property->slug}")->assertNoContent();

        $this->assertSame(0, $user->favoriteProperties()->count());
    }

    public function test_favorites_list_returns_cards_newest_saved_first(): void
    {
        $user = $this->signIn();
        $first = $this->property(['title' => 'First saved']);
        $second = $this->property(['title' => 'Second saved']);

        $this->travel(-1)->hours();
        $user->favoriteProperties()->attach($first->id);
        $this->travelBack();
        $user->favoriteProperties()->attach($second->id);

        $response = $this->getJson('/api/favorites')->assertOk();

        $this->assertSame([$second->slug, $first->slug], $this->slugs($response));
        $response->assertJsonStructure(['data' => [['slug', 'title', 'monthly_rent', 'cover_image', 'location']], 'meta', 'links']);
        $this->assertArrayNotHasKey('phone', $response->json('data.0'));
    }

    public function test_unpublished_and_deleted_listings_disappear_from_the_list(): void
    {
        $user = $this->signIn();
        $live = $this->property();
        $archived = $this->property();
        $deleted = $this->property();
        $user->favoriteProperties()->attach([$live->id, $archived->id, $deleted->id]);

        $archived->update(['publication_status' => 'archived']);
        $deleted->delete();

        $this->assertSame([$live->slug], $this->slugs($this->getJson('/api/favorites')->assertOk()));
        $this->getJson('/api/favorites/slugs')->assertExactJson(['data' => [$live->slug]]);
    }

    public function test_users_only_see_their_own_favorites(): void
    {
        $property = $this->property();
        $other = User::factory()->create();
        $other->favoriteProperties()->attach($property->id);

        $this->signIn();

        $this->getJson('/api/favorites')->assertOk()->assertJsonCount(0, 'data');
        $this->deleteJson("/api/favorites/{$property->slug}")->assertNoContent();

        $this->assertSame(1, $other->favoriteProperties()->count(), "removing must not touch someone else's row");
    }

    public function test_sync_merges_local_slugs_and_ignores_unknown_or_unpublished_ones(): void
    {
        $user = $this->signIn();
        $already = $this->property();
        $fresh = $this->property();
        $draft = $this->property(['publication_status' => 'draft']);
        $user->favoriteProperties()->attach($already->id);

        $response = $this->postJson('/api/favorites/sync', [
            'slugs' => [$already->slug, $fresh->slug, $draft->slug, 'nope', $fresh->slug],
        ])->assertOk();

        $this->assertEqualsCanonicalizing([$already->slug, $fresh->slug], $response->json('data'));
        $this->assertSame(2, $user->favoriteProperties()->count());
    }

    public function test_sync_validates_its_input(): void
    {
        $this->signIn();

        $this->postJson('/api/favorites/sync', [])->assertUnprocessable()->assertJsonValidationErrors('slugs');
        $this->postJson('/api/favorites/sync', ['slugs' => 'abc'])->assertUnprocessable();
        $this->postJson('/api/favorites/sync', ['slugs' => [['x']]])->assertUnprocessable();
    }

    public function test_there_is_a_cap_on_saved_listings(): void
    {
        config(['marketplace.favorites.max' => 2]);
        $user = $this->signIn();
        [$a, $b, $c] = [$this->property(), $this->property(), $this->property()];

        $this->putJson("/api/favorites/{$a->slug}")->assertNoContent();
        $this->putJson("/api/favorites/{$b->slug}")->assertNoContent();
        $this->putJson("/api/favorites/{$c->slug}")->assertUnprocessable()->assertJsonValidationErrors('slugs');
        // Saving one that is already saved still works at the cap.
        $this->putJson("/api/favorites/{$a->slug}")->assertNoContent();

        $this->assertSame(2, $user->favoriteProperties()->count());
    }

    public function test_favorites_are_removed_with_the_user(): void
    {
        $user = $this->signIn();
        $property = $this->property();
        $user->favoriteProperties()->attach($property->id);

        $user->delete();

        $this->assertDatabaseCount('favorites', 0);
    }
}
