<?php

namespace Tests\Feature\Marketplace;

use App\Models\Location;
use App\Models\Owner;
use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Shared setup for the marketplace API tests: in-memory SQLite, fresh schema per test,
 * plus small builders so each test states only what it cares about.
 */
abstract class MarketplaceTestCase extends TestCase
{
    use RefreshDatabase;

    protected function city(string $name = 'Dar es Salaam', ?Location $parent = null): Location
    {
        return Location::factory()->city()->state([
            'name' => $name,
            'slug' => str($name)->slug()->toString(),
            'parent_id' => $parent?->id,
        ])->create();
    }

    protected function area(Location $parent, string $name = 'Mikocheni'): Location
    {
        return Location::factory()->within($parent)->state([
            'name' => $name,
            'slug' => str($name)->slug()->toString(),
        ])->create();
    }

    /** @param  array<string, mixed>  $attributes */
    protected function property(array $attributes = [], ?Location $in = null): Property
    {
        $factory = Property::factory();

        if ($in) {
            $factory = $factory->in($in);
        }

        return $factory->create($attributes);
    }

    protected function owner(): Owner
    {
        return Owner::factory()->verified()->create();
    }

    /** @return list<string> slugs of the properties in a list response, in order */
    protected function slugs(TestResponse $response): array
    {
        return collect($response->json('data'))->pluck('slug')->all();
    }
}
