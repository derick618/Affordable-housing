<?php

namespace App\Http\Controllers;

use App\Enums\ListingReportStatus;
use App\Http\Requests\StoreListingReportRequest;
use App\Http\Requests\UpdateListingReportRequest;
use App\Http\Resources\ListingReportResource;
use App\Models\ListingReport;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ListingReportController extends Controller
{
    /**
     * Public: anyone can report a published listing, signed in or not. Throttled per visitor
     * (see the `listing-reports` limiter). The response never says whether the report was new.
     */
    public function store(StoreListingReportRequest $request, Property $publishedProperty): JsonResponse
    {
        $user = $request->user('sanctum');
        $hash = hash('sha256', (string) $request->ip().config('app.key'));
        $reason = $request->validated('reason');

        $duplicate = ListingReport::query()
            ->where('property_id', $publishedProperty->id)
            ->where('reason', $reason)
            ->where('created_at', '>=', now()->subDay())
            ->where(fn ($q) => $user
                ? $q->where('user_id', $user->id)
                : $q->whereNull('user_id')->where('reporter_hash', $hash))
            ->exists();

        if (! $duplicate) {
            ListingReport::create([
                'property_id' => $publishedProperty->id,
                'user_id' => $user?->id,
                'reason' => $reason,
                'details' => $this->clean($request->validated('details')),
                'contact' => $this->clean($request->validated('contact')),
                'reporter_hash' => $hash,
            ]);
        }

        return response()->json(['message' => 'Thank you. Our team will review this listing.'], 201);
    }

    /** Staff: reports, newest first. Filter with ?status= and ?property=<slug>. */
    public function index(Request $request)
    {
        Gate::authorize('view-moderation');

        $request->validate([
            'status' => ['nullable', 'in:'.implode(',', array_column(ListingReportStatus::cases(), 'value'))],
            'property' => ['nullable', 'string', 'max:160'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $reports = ListingReport::query()
            ->with(['property', 'reporter', 'handler'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('property'), fn ($q, $slug) => $q->whereHas('property', fn ($p) => $p->withTrashed()->where('slug', $slug)))
            ->latest('id')
            ->paginate((int) $request->query('per_page', 20));

        return ListingReportResource::collection($reports);
    }

    /** Staff: change a report's status and leave a note. Auditors can read but not change. */
    public function update(UpdateListingReportRequest $request, ListingReport $listingReport)
    {
        Gate::authorize('moderate-listings');

        $status = ListingReportStatus::from($request->validated('status'));

        $listingReport->fill([
            'status' => $status,
            'staff_note' => $request->validated('staff_note') ?? $listingReport->staff_note,
            'handled_by' => $request->user()->id,
            'handled_at' => in_array($status, [ListingReportStatus::Resolved, ListingReportStatus::Dismissed], true) ? now() : null,
        ])->save();

        return new ListingReportResource($listingReport->load(['property', 'reporter', 'handler']));
    }

    private function clean(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
