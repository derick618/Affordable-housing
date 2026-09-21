<?php

namespace Tests\Feature\Marketplace;

use App\Models\Amenity;
use App\Models\Owner;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use LogicException;

class PropertyShowTest extends MarketplaceTestCase
{
    public function test_property_detail_is_returned_by_slug(): void
    {
        $city = $this->city('Dar es Salaam');
        $area = $this->area($city, 'Mikocheni');
        $owner = Owner::factory()->verified()->create(['name' => 'Amina Mwakasege']);
        $property = $this->property([
            'owner_id' => $owner->id,
            'title' => 'Modern 2 Bedroom Apartment',
            'description' => 'A bright flat.',
            'monthly_rent' => 650000,
            'rent_advance_months' => 3,
            'water_details' => 'DAWASA mains',
            'power_details' => 'Own LUKU meter',
            'water_included' => true,
            'nearby' => [['kind' => 'school', 'text' => 'Primary school, 10 min walk']],
        ], $area);

        $this->getJson("/api/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', $property->slug)
            ->assertJsonPath('data.title', 'Modern 2 Bedroom Apartment')
            ->assertJsonPath('data.description', 'A bright flat.')
            ->assertJsonPath('data.monthly_rent', 650000)
            ->assertJsonPath('data.currency', 'TZS')
            ->assertJsonPath('data.rent_advance_months', 3)
            ->assertJsonPath('data.water_details', 'DAWASA mains')
            ->assertJsonPath('data.power_details', 'Own LUKU meter')
            ->assertJsonPath('data.water_included', true)
            ->assertJsonPath('data.power_included', false)
            ->assertJsonPath('data.nearby.0.text', 'Primary school, 10 min walk')
            ->assertJsonPath('data.location.slug', 'mikocheni')
            ->assertJsonPath('data.location_path.0.slug', 'dar-es-salaam')
            ->assertJsonPath('data.availability_status', 'available')
            ->assertJsonPath('data.verified', true)
            ->assertJsonPath('data.owner.name', 'Amina Mwakasege')
            ->assertJsonPath('data.owner.verified', true)
            ->assertJsonStructure(['data' => ['published_at', 'updated_at', 'available_from', 'owner' => ['member_since', 'response_time', 'languages']]]);
    }

    public function test_detail_includes_all_images_in_position_order_with_urls(): void
    {
        config(['marketplace.demo_image_base_url' => 'https://app.example/images']);

        $property = $this->property();
        PropertyImage::factory()->create(['property_id' => $property->id, 'path' => 'interiors/second', 'position' => 1]);
        PropertyImage::factory()->create(['property_id' => $property->id, 'path' => 'properties/cover', 'position' => 0]);

        $response = $this->getJson("/api/properties/{$property->slug}")->assertOk();

        $this->assertSame([0, 1], $response->json('data.images.*.position'));
        $this->assertSame('https://app.example/images/properties/cover.jpg', $response->json('data.images.0.url'));
        $this->assertSame('https://app.example/images/properties/cover-sm.jpg', $response->json('data.images.0.thumb_url'));
    }

    public function test_detail_includes_amenities_with_their_notes(): void
    {
        $property = $this->property();
        $parking = Amenity::factory()->create(['slug' => 'parking', 'label' => 'Parking', 'sort_order' => 10]);
        $fenced = Amenity::factory()->create(['slug' => 'fenced-compound', 'label' => 'Fenced compound', 'sort_order' => 20]);
        $property->amenities()->attach($parking->id, ['note' => 'Parking for 2 cars']);
        $property->amenities()->attach($fenced->id);

        $this->getJson("/api/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.amenities.0.slug', 'parking')
            ->assertJsonPath('data.amenities.0.note', 'Parking for 2 cars')
            ->assertJsonPath('data.amenities.1.slug', 'fenced-compound')
            ->assertJsonPath('data.amenities.1.note', null);
    }

    public function test_owner_phone_and_whatsapp_are_never_exposed(): void
    {
        $owner = Owner::factory()->verified()->create(['phone' => '+255700111222', 'whatsapp' => '+255600333444']);
        $property = $this->property(['owner_id' => $owner->id]);

        foreach (['/api/properties', "/api/properties/{$property->slug}", "/api/properties/{$property->slug}/similar"] as $url) {
            $body = $this->getJson($url)->assertOk()->getContent();

            $this->assertStringNotContainsString('255700111222', $body, "phone leaked from {$url}");
            $this->assertStringNotContainsString('255600333444', $body, "whatsapp leaked from {$url}");
            $this->assertStringNotContainsString('"phone"', $body);
            $this->assertStringNotContainsString('"whatsapp"', $body);
        }

        // Defence in depth: even a direct toArray() on the model hides them.
        $this->assertArrayNotHasKey('phone', $owner->toArray());
        $this->assertArrayNotHasKey('whatsapp', $owner->toArray());
    }

    public function test_an_unverified_owner_is_reported_as_unverified(): void
    {
        $property = $this->property(['owner_id' => Owner::factory()->create()->id]);

        $this->getJson("/api/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.verified', false)
            ->assertJsonPath('data.owner.verified', false)
            ->assertJsonPath('data.owner.verified_at', null);
    }

    public function test_invalid_slug_returns_404_without_leaking_internals(): void
    {
        $response = $this->getJson('/api/properties/does-not-exist')->assertNotFound();

        $this->assertSame('The requested resource was not found.', $response->json('message'));
        $this->assertStringNotContainsString('App\\Models', $response->getContent());
        $this->assertStringNotContainsString('Property]', $response->getContent());
    }

    public function test_unpublished_and_deleted_properties_are_404(): void
    {
        $draft = Property::factory()->draft()->create();
        $archived = Property::factory()->archived()->create();
        $deleted = $this->property();
        $deleted->delete();

        foreach ([$draft, $archived, $deleted] as $hidden) {
            $this->getJson("/api/properties/{$hidden->slug}")->assertNotFound();
            $this->getJson("/api/properties/{$hidden->slug}/similar")->assertNotFound();
        }
    }

    public function test_numeric_ids_are_not_accepted_as_public_keys(): void
    {
        $property = $this->property();

        $this->getJson("/api/properties/{$property->id}")->assertNotFound();
    }

    public function test_the_public_detail_does_not_need_authentication(): void
    {
        $property = $this->property();

        $this->assertGuest();
        $this->getJson("/api/properties/{$property->slug}")->assertOk();
    }

    public function test_slug_is_immutable_once_created(): void
    {
        $property = $this->property(['slug' => 'original-slug']);

        $this->expectException(LogicException::class);

        $property->update(['slug' => 'changed-slug']);
    }

    public function test_other_fields_can_still_be_updated_without_touching_the_slug(): void
    {
        $property = $this->property(['slug' => 'stable-slug']);

        $property->update(['title' => 'A new title']);

        $this->assertSame('stable-slug', $property->fresh()->slug);
        $this->assertSame('A new title', $property->fresh()->title);
    }

    public function test_marketplace_owner_can_be_linked_to_a_user_without_changing_the_role(): void
    {
        $user = User::factory()->create();
        $owner = Owner::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->owner->is($owner));
        $this->assertSame('applicant', $user->fresh()->role);
    }
}
