<?php

namespace Tests\Feature\Marketplace;

use App\Models\User;

/**
 * The API forces JSON and hides internals on 404. These tests also pin down that the
 * change did not alter how the existing authenticated API behaves.
 */
class ApiErrorHandlingTest extends MarketplaceTestCase
{
    public function test_unknown_api_routes_return_a_json_404(): void
    {
        $this->get('/api/does-not-exist')
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/json')
            ->assertExactJson(['message' => 'Not found.']);
    }

    public function test_missing_property_404_never_names_a_class(): void
    {
        $body = $this->get('/api/properties/nope')->assertNotFound()->getContent();

        $this->assertStringNotContainsString('App\\', $body);
        $this->assertStringNotContainsString('Model', $body);
        $this->assertStringNotContainsString('Illuminate', $body);
    }

    public function test_existing_model_bound_routes_also_stop_leaking_class_names(): void
    {
        $user = User::factory()->role('super_admin')->create();

        $body = $this->actingAs($user, 'sanctum')->getJson('/api/housing-projects/999')->assertNotFound()->getContent();

        $this->assertStringNotContainsString('HousingProject', $body);
        $this->assertStringNotContainsString('App\\', $body);
    }

    public function test_existing_protected_routes_still_require_authentication_and_answer_json(): void
    {
        // No Accept header: this used to fail with a 500 ("Route [login] not defined"). It is now a 401.
        $this->get('/api/housing-projects')->assertUnauthorized()->assertHeader('Content-Type', 'application/json');
        $this->getJson('/api/applications')->assertUnauthorized();
        $this->getJson('/api/dashboard')->assertUnauthorized();
        $this->getJson('/api/allocations')->assertUnauthorized();
    }

    public function test_existing_login_and_authenticated_requests_still_work(): void
    {
        $user = User::factory()->create(['email' => 'someone@example.test']);

        $login = $this->postJson('/api/login', ['email' => 'someone@example.test', 'password' => 'password'])
            ->assertOk()
            ->assertJsonStructure(['user' => ['id', 'email', 'role'], 'token']);

        $this->withToken($login->json('token'))->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $this->postJson('/api/login', ['email' => 'someone@example.test', 'password' => 'wrong'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_existing_role_authorization_is_unchanged(): void
    {
        $applicant = User::factory()->create();
        $officer = User::factory()->role('housing_officer')->create();

        $this->actingAs($applicant, 'sanctum')->getJson('/api/dashboard')->assertForbidden();
        $this->actingAs($officer, 'sanctum')->getJson('/api/dashboard')->assertOk();
        $this->actingAs($applicant, 'sanctum')->postJson('/api/housing-projects', ['name' => 'X'])->assertForbidden();
    }

    public function test_marketplace_routes_are_public_and_not_inside_the_auth_group(): void
    {
        $routes = collect(app('router')->getRoutes()->getRoutes())
            ->filter(fn ($route) => str_starts_with($route->uri(), 'api/properties') || in_array($route->uri(), ['api/locations', 'api/amenities'], true));

        // properties (list, show, similar), locations, amenities, and the report and inquiry POSTs.
        $this->assertCount(7, $routes);

        foreach ($routes as $route) {
            $this->assertNotContains('auth:sanctum', $route->gatherMiddleware(), $route->uri().' must be public');
        }

        // Everything public is read-only except two writes, and both are throttled.
        $writes = $routes->reject(fn ($route) => $route->methods() === ['GET', 'HEAD'])->keyBy(fn ($route) => $route->uri());
        $this->assertEqualsCanonicalizing(
            ['api/properties/{publishedProperty}/reports', 'api/properties/{publishedProperty}/inquiries'],
            $writes->keys()->all()
        );
        $this->assertContains('throttle:listing-reports', $writes['api/properties/{publishedProperty}/reports']->gatherMiddleware());
        $this->assertContains('throttle:inquiries', $writes['api/properties/{publishedProperty}/inquiries']->gatherMiddleware());
    }
}
