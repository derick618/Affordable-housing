<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertOwnerProfileRequest;
use App\Http\Resources\OwnerProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The signed-in user's own landlord/agent profile. A login becomes a landlord by creating one;
 * `users.role` is not touched. Nobody can be marked verified from here.
 */
class LandlordProfileController extends Controller
{
    /** `data` is null until the profile has been created. */
    public function show(Request $request): JsonResponse
    {
        $owner = $request->user()->owner;

        return response()->json(['data' => $owner ? (new OwnerProfileResource($owner))->resolve() : null]);
    }

    public function upsert(UpsertOwnerProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $owner = $user->owner;
        $data = $request->validated();

        if ($owner) {
            $identityChanged = $owner->name !== $data['name'] || $owner->phone !== $data['phone'];
            $owner->fill($data);

            // Verification vouches for a specific person and number. If either changes, it has to be redone.
            if ($identityChanged && $owner->isVerified()) {
                $owner->verified_at = null;
                $owner->verified_by = null;
            }

            $owner->save();
        } else {
            $owner = $user->owner()->create($data);
            $owner->refresh();
            $user->setRelation('owner', $owner);
        }

        return (new OwnerProfileResource($owner))->response()->setStatusCode($owner->wasRecentlyCreated ? 201 : 200);
    }
}
