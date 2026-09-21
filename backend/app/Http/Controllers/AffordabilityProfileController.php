<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertAffordabilityProfileRequest;
use App\Http\Resources\AffordabilityProfileResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The signed-in renter's budget and preferences. Private to them; it does not rank or filter
 * anything on the server. The website uses it to show "within your budget" hints.
 */
class AffordabilityProfileController extends Controller
{
    /** `data` is null until a profile has been saved. */
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->affordabilityProfile?->load('location');

        return response()->json(['data' => $profile ? (new AffordabilityProfileResource($profile))->resolve() : null]);
    }

    /** Replaces the whole profile; fields left out are cleared. */
    public function upsert(UpsertAffordabilityProfileRequest $request): JsonResponse
    {
        $data = $request->validated();

        $profile = $request->user()->affordabilityProfile()->updateOrCreate([], [
            'monthly_budget' => $data['monthly_budget'] ?? null,
            'household_size' => $data['household_size'] ?? null,
            'min_bedrooms' => $data['min_bedrooms'] ?? null,
            'location_id' => filled($data['location'] ?? null)
                ? Location::query()->where('slug', $data['location'])->value('id')
                : null,
            'property_types' => ! empty($data['property_types']) ? array_values($data['property_types']) : null,
        ]);

        return (new AffordabilityProfileResource($profile->load('location')))->response();
    }

    public function destroy(Request $request): Response
    {
        $request->user()->affordabilityProfile()->delete();

        return response()->noContent();
    }
}
