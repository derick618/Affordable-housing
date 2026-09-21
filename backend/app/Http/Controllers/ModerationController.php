<?php

namespace App\Http\Controllers;

use App\Enums\PublicationStatus;
use App\Http\Resources\LandlordPropertyResource;
use App\Http\Resources\OwnerProfileResource;
use App\Models\Owner;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Staff review of landlord listings and owners. Everyone who is not an applicant can look;
 * only super admins and housing officers can approve, send back, or verify. Staff never edit a
 * landlord's listing text, they only decide whether it goes live.
 */
class ModerationController extends Controller
{
    private const RELATIONS = ['owner', 'location.parent.parent.parent', 'images', 'amenities'];

    /** The review queue (pending_review by default). */
    public function properties(Request $request)
    {
        Gate::authorize('view-moderation');

        $request->validate([
            'status' => ['nullable', Rule::in(array_column(PublicationStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $properties = Property::query()
            ->where('publication_status', $request->query('status', PublicationStatus::PendingReview->value))
            // Demo listings were never submitted, so they are never in a review queue.
            ->where('is_demo', false)
            ->with(['owner', 'location.parent.parent.parent', 'coverImage'])
            ->withCount('images')
            ->orderBy('submitted_at')
            ->orderBy('id')
            ->paginate((int) $request->query('per_page', 20));

        return LandlordPropertyResource::collection($properties);
    }

    public function show(Property $moderationProperty)
    {
        Gate::authorize('view-moderation');

        return new LandlordPropertyResource($moderationProperty->load(self::RELATIONS));
    }

    public function approve(Request $request, Property $moderationProperty)
    {
        Gate::authorize('moderate-listings');
        $this->requirePending($moderationProperty);

        $moderationProperty->forceFill([
            'publication_status' => PublicationStatus::Published,
            'published_at' => now(),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'moderation_note' => null,
        ])->save();

        return new LandlordPropertyResource($moderationProperty->load(self::RELATIONS));
    }

    /** Send a listing back to draft with a reason the landlord can read. */
    public function reject(Request $request, Property $moderationProperty)
    {
        Gate::authorize('moderate-listings');
        $this->requirePending($moderationProperty);

        $data = $request->validate(['note' => ['required', 'string', 'min:5', 'max:1000']]);

        $moderationProperty->forceFill([
            'publication_status' => PublicationStatus::Draft,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'moderation_note' => trim($data['note']),
        ])->save();

        return new LandlordPropertyResource($moderationProperty->load(self::RELATIONS));
    }

    // ------------------------------------------------------------------ owners

    /** Owner profiles with their contact details, for verification. `?verified=0|1`, `?q=name`. */
    public function owners(Request $request)
    {
        Gate::authorize('view-moderation');

        $request->validate([
            'verified' => ['nullable', 'in:0,1'],
            'q' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $owners = Owner::query()
            ->whereNotNull('user_id') // profiles created by real logins, not demo owners
            ->when($request->query('verified') !== null, fn ($q) => $request->query('verified') === '1'
                ? $q->whereNotNull('verified_at')
                : $q->whereNull('verified_at'))
            ->when($request->query('q'), fn ($q, $term) => $q->where('name', 'like', '%'.addcslashes($term, '%_\\').'%'))
            ->withCount('properties')
            ->latest('id')
            ->paginate((int) $request->query('per_page', 20));

        return OwnerProfileResource::collection($owners);
    }

    public function verifyOwner(Request $request, Owner $owner)
    {
        Gate::authorize('moderate-listings');

        $owner->forceFill(['verified_at' => now(), 'verified_by' => $request->user()->id])->save();

        return new OwnerProfileResource($owner);
    }

    public function unverifyOwner(Owner $owner)
    {
        Gate::authorize('moderate-listings');

        $owner->forceFill(['verified_at' => null, 'verified_by' => null])->save();

        return new OwnerProfileResource($owner);
    }

    private function requirePending(Property $property): void
    {
        if ($property->publication_status !== PublicationStatus::PendingReview) {
            throw ValidationException::withMessages(['publication_status' => ['This listing is not waiting for review.']]);
        }
    }
}
