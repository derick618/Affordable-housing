<?php

namespace App\Marketplace;

use App\Models\Location;
use Illuminate\Database\Eloquent\Builder;

/**
 * Applies the public search parameters to a Property query. It knows nothing about HTTP:
 * it receives an already-validated array, which keeps it directly unit-testable.
 *
 * Recognised keys (all optional): q, location, min_price, max_price, property_type (list),
 * bedrooms (minimum), availability, featured, slugs (list), exclude (list), sort.
 */
class PropertyFilter
{
    public const SORTS = ['recommended', 'newest', 'price_asc', 'price_desc'];

    private ?LocationHierarchy $hierarchy = null;

    /** @param  array<string, mixed>  $params */
    public function __construct(private array $params = [], ?LocationHierarchy $hierarchy = null)
    {
        $this->hierarchy = $hierarchy;
    }

    public function apply(Builder $query): Builder
    {
        $this->search($query);
        $this->location($query);

        if (($min = $this->params['min_price'] ?? null) !== null) {
            $query->where('properties.monthly_rent', '>=', (int) $min);
        }

        if (($max = $this->params['max_price'] ?? null) !== null) {
            $query->where('properties.monthly_rent', '<=', (int) $max);
        }

        if ($types = $this->list('property_type')) {
            $query->whereIn('properties.property_type', $types);
        }

        if (($bedrooms = $this->params['bedrooms'] ?? null) !== null) {
            $query->where('properties.bedrooms', '>=', (int) $bedrooms);
        }

        if ($availability = $this->params['availability'] ?? null) {
            $query->where('properties.availability_status', $availability);
        }

        if (($featured = $this->params['featured'] ?? null) !== null) {
            $query->where('properties.featured', (bool) $featured);
        }

        if ($slugs = $this->list('slugs')) {
            $query->whereIn('properties.slug', $slugs);
        }

        if ($exclude = $this->list('exclude')) {
            $query->whereNotIn('properties.slug', $exclude);
        }

        return $this->sort($query);
    }

    /**
     * Every word must match the title, the street address, or the name of the property's
     * location or any ancestor (so "Dar es Salaam" finds homes in areas of that city).
     */
    private function search(Builder $query): void
    {
        $q = trim((string) ($this->params['q'] ?? ''));

        if ($q === '') {
            return;
        }

        $words = array_slice(preg_split('/\s+/', $q) ?: [], 0, 6);

        foreach ($words as $word) {
            $like = '%'.$this->escapeLike($word).'%';

            $matchingLocationIds = $this->hierarchy()->descendantIds(
                Location::query()->whereRaw("name LIKE ? ESCAPE '!'", [$like])->pluck('id')->all()
            );

            $query->where(function (Builder $group) use ($like, $matchingLocationIds) {
                $group->whereRaw("properties.title LIKE ? ESCAPE '!'", [$like])
                    ->orWhereRaw("properties.address_line LIKE ? ESCAPE '!'", [$like]);

                if ($matchingLocationIds) {
                    $group->orWhereIn('properties.location_id', $matchingLocationIds);
                }
            });
        }
    }

    /** A location slug matches the location itself and everything beneath it. */
    private function location(Builder $query): void
    {
        $slug = $this->params['location'] ?? null;

        if (! $slug) {
            return;
        }

        $id = Location::query()->where('slug', $slug)->value('id');

        // An unknown slug matches nothing (the HTTP layer rejects unknown slugs earlier).
        $query->whereIn('properties.location_id', $id ? $this->hierarchy()->descendantIds($id) : [0]);
    }

    private function sort(Builder $query): Builder
    {
        return match ($this->params['sort'] ?? 'recommended') {
            'newest' => $query->orderByDesc('properties.published_at')->orderByDesc('properties.id'),
            'price_asc' => $query->orderBy('properties.monthly_rent')->orderBy('properties.id'),
            'price_desc' => $query->orderByDesc('properties.monthly_rent')->orderBy('properties.id'),
            // Featured first, then available before reserved/rented, then newest.
            default => $query
                ->orderByDesc('properties.featured')
                ->orderByRaw("CASE WHEN properties.availability_status = 'available' THEN 0 ELSE 1 END")
                ->orderByDesc('properties.published_at')
                ->orderByDesc('properties.id'),
        };
    }

    /** @return list<string> */
    private function list(string $key): array
    {
        $value = $this->params[$key] ?? [];

        return array_values(array_filter((array) $value, fn ($item) => $item !== null && $item !== ''));
    }

    /** Escapes LIKE wildcards. `!` is the escape character because it needs no quoting on MySQL or SQLite. */
    private function escapeLike(string $value): string
    {
        return str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value);
    }

    private function hierarchy(): LocationHierarchy
    {
        return $this->hierarchy ??= new LocationHierarchy;
    }
}
