<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncFavoritesRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/**
 * The signed-in user's saved listings. Every route is scoped to the current user, so there is
 * no way to read or change someone else's favourites. Only published listings are shown.
 */
class FavoriteController extends Controller
{
    /** Saved listings as cards, most recently saved first. */
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 24), 1), (int) config('marketplace.pagination.max_per_page'));

        $properties = $request->user()->favoriteProperties()
            ->published()
            ->with(PropertyController::CARD_RELATIONS)
            ->orderByDesc('favorites.created_at')
            ->orderByDesc('favorites.id')
            ->paginate($perPage);

        return PropertyResource::collection($properties);
    }

    /** Slugs only: cheap enough to load on every page to fill in the heart buttons. */
    public function slugs(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->slugsFor($request)]);
    }

    /** Save a listing. Idempotent. */
    public function store(Request $request, Property $publishedProperty): Response
    {
        $user = $request->user();

        if (! $user->favoriteProperties()->whereKey($publishedProperty->id)->exists()) {
            $this->assertRoomFor($request, 1);
            $user->favoriteProperties()->attach($publishedProperty->id);
        }

        return response()->noContent();
    }

    /**
     * Remove a saved listing. Idempotent, and deliberately not limited to published listings so
     * a saved home that was later unpublished can still be removed from the list.
     */
    public function destroy(Request $request, string $slug): Response
    {
        $property = Property::withTrashed()->where('slug', $slug)->first();

        if ($property) {
            $request->user()->favoriteProperties()->detach($property->id);
        }

        return response()->noContent();
    }

    /**
     * Merge a list of slugs (e.g. what an anonymous visitor saved in the browser before signing
     * in) into the account. Unknown and unpublished slugs are ignored. Returns the full list.
     */
    public function sync(SyncFavoritesRequest $request): JsonResponse
    {
        $user = $request->user();
        $existing = $user->favoriteProperties()->pluck('properties.id')->all();

        $incoming = Property::query()->published()
            ->whereIn('slug', $request->slugs())
            ->whereNotIn('id', $existing)
            ->pluck('id')
            ->all();

        $this->assertRoomFor($request, count($incoming));

        if ($incoming) {
            $user->favoriteProperties()->attach($incoming);
        }

        return response()->json(['data' => $this->slugsFor($request)]);
    }

    /** @return list<string> */
    private function slugsFor(Request $request): array
    {
        return $request->user()->favoriteProperties()
            ->published()
            ->orderByDesc('favorites.created_at')
            ->orderByDesc('favorites.id')
            ->pluck('properties.slug')
            ->all();
    }

    private function assertRoomFor(Request $request, int $adding): void
    {
        $max = (int) config('marketplace.favorites.max', 200);

        if ($request->user()->favoriteProperties()->count() + $adding > $max) {
            throw ValidationException::withMessages([
                'slugs' => ["You can save up to {$max} homes. Remove some to save more."],
            ]);
        }
    }
}
