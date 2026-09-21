<?php

namespace App\Http\Controllers;

use App\Enums\InquiryStatus;
use App\Enums\PublicationStatus;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\LandlordPropertyResource;
use App\Models\Owner;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * A landlord's own listings. Every listing is looked up through the signed-in user's owner
 * profile (route binding `landlordProperty`), so someone else's listing answers 404 exactly
 * like one that does not exist. New listings start as drafts; going live needs staff approval.
 */
class LandlordPropertyController extends Controller
{
    private const DETAIL_RELATIONS = ['owner', 'location.parent.parent.parent', 'images', 'amenities'];

    public function index(Request $request)
    {
        $owner = $this->ownerOrFail($request);

        $request->validate([
            'status' => ['nullable', Rule::in(array_column(PublicationStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $properties = Property::query()
            ->where('owner_id', $owner->id)
            ->when($request->query('status'), fn ($q, $status) => $q->where('publication_status', $status))
            ->with(['owner', 'location.parent.parent.parent', 'coverImage'])
            ->withCount([
                'images',
                'inquiries',
                'inquiries as new_inquiries_count' => fn ($q) => $q->where('status', InquiryStatus::New->value),
            ])
            ->latest('updated_at')
            ->latest('id')
            ->paginate((int) $request->query('per_page', 20));

        return LandlordPropertyResource::collection($properties);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $owner = $this->ownerOrFail($request);

        $property = DB::transaction(function () use ($request, $owner) {
            $property = new Property($request->propertyAttributes());
            $property->slug = Property::newSlug($request->validated('title'));
            $property->owner_id = $owner->id;
            $property->publication_status = PublicationStatus::Draft;
            $property->save();

            if (($amenities = $request->amenitySync()) !== null) {
                $property->amenities()->sync($amenities);
            }

            return $property;
        });

        // Reload so database defaults (featured, is_demo, ...) are on the model.
        return (new LandlordPropertyResource($property->refresh()->load(self::DETAIL_RELATIONS)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Property $landlordProperty)
    {
        Gate::authorize('manage', $landlordProperty);

        return new LandlordPropertyResource($landlordProperty->load(self::DETAIL_RELATIONS));
    }

    public function update(UpdatePropertyRequest $request, Property $landlordProperty)
    {
        Gate::authorize('manage', $landlordProperty);

        DB::transaction(function () use ($request, $landlordProperty) {
            $landlordProperty->fill($request->propertyAttributes())->save();

            if (($amenities = $request->amenitySync()) !== null) {
                $landlordProperty->amenities()->sync($amenities);
            }
        });

        return new LandlordPropertyResource($landlordProperty->refresh()->load(self::DETAIL_RELATIONS));
    }

    /** Soft delete: the listing leaves the marketplace at once; reports about it are kept. */
    public function destroy(Property $landlordProperty): Response
    {
        Gate::authorize('manage', $landlordProperty);

        $landlordProperty->delete();

        return response()->noContent();
    }

    /** draft -> pending_review. The listing must be complete enough for a reviewer. */
    public function submit(Property $landlordProperty)
    {
        Gate::authorize('manage', $landlordProperty);
        $this->requireStatus($landlordProperty, [PublicationStatus::Draft], 'Only a draft can be submitted for review.');

        $problems = [];
        if (! $landlordProperty->images()->exists()) {
            $problems['images'] = ['Add at least one photo before submitting.'];
        }
        if (mb_strlen(trim((string) $landlordProperty->description)) < 30) {
            $problems['description'] = ['Describe the home in at least a couple of sentences before submitting.'];
        }
        if ($problems) {
            throw ValidationException::withMessages($problems);
        }

        return $this->moveTo($landlordProperty, PublicationStatus::PendingReview, [
            'submitted_at' => now(),
            'moderation_note' => null,
        ]);
    }

    /** pending_review -> draft, to keep editing before a reviewer looks at it. */
    public function withdraw(Property $landlordProperty)
    {
        Gate::authorize('manage', $landlordProperty);
        $this->requireStatus($landlordProperty, [PublicationStatus::PendingReview], 'Only a listing waiting for review can be withdrawn.');

        return $this->moveTo($landlordProperty, PublicationStatus::Draft);
    }

    /** Take a listing off the marketplace without deleting it. */
    public function archive(Property $landlordProperty)
    {
        Gate::authorize('manage', $landlordProperty);
        $this->requireStatus(
            $landlordProperty,
            [PublicationStatus::Draft, PublicationStatus::PendingReview, PublicationStatus::Published],
            'This listing is already archived.'
        );

        return $this->moveTo($landlordProperty, PublicationStatus::Archived);
    }

    /** archived -> draft. Going live again needs a fresh review. */
    public function reopen(Property $landlordProperty)
    {
        Gate::authorize('manage', $landlordProperty);
        $this->requireStatus($landlordProperty, [PublicationStatus::Archived], 'Only an archived listing can be reopened.');

        return $this->moveTo($landlordProperty, PublicationStatus::Draft);
    }

    private function ownerOrFail(Request $request): Owner
    {
        $owner = $request->user()->owner;

        abort_if(
            $owner === null,
            response()->json(['message' => 'Create your landlord profile before adding listings.', 'code' => 'owner_profile_required'], 403)
        );

        return $owner;
    }

    /** @param  list<PublicationStatus>  $allowed */
    private function requireStatus(Property $property, array $allowed, string $message): void
    {
        if (! in_array($property->publication_status, $allowed, true)) {
            throw ValidationException::withMessages(['publication_status' => [$message]]);
        }
    }

    /** @param  array<string, mixed>  $extra */
    private function moveTo(Property $property, PublicationStatus $status, array $extra = [])
    {
        $property->forceFill(['publication_status' => $status, ...$extra])->save();

        return new LandlordPropertyResource($property->load(self::DETAIL_RELATIONS));
    }
}
