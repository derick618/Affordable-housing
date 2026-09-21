<?php

namespace App\Http\Controllers;

use App\Enums\AvailabilityStatus;
use App\Enums\InquiryStatus;
use App\Http\Requests\StoreInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Models\Inquiry;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Messages from renters to a listing's owner. The renter never receives the owner's phone
 * number: they leave their own details, and the owner sees them in their dashboard.
 */
class InquiryController extends Controller
{
    /**
     * Public: anyone can message the owner of a published listing (throttled per visitor, see the
     * `inquiries` limiter). Sending the same message twice within a day is stored once.
     */
    public function store(StoreInquiryRequest $request, Property $publishedProperty): JsonResponse
    {
        if ($publishedProperty->availability_status === AvailabilityStatus::Rented) {
            throw ValidationException::withMessages(['message' => ['This home has already been rented.']]);
        }

        $user = $request->user('sanctum');
        $hash = hash('sha256', (string) $request->ip().config('app.key'));
        $data = $request->validated();
        $message = trim($data['message']);

        $duplicate = Inquiry::query()
            ->where('property_id', $publishedProperty->id)
            ->where('message', $message)
            ->where('created_at', '>=', now()->subDay())
            ->where(fn ($q) => $user
                ? $q->where('user_id', $user->id)
                : $q->whereNull('user_id')->where('sender_hash', $hash))
            ->exists();

        if (! $duplicate) {
            Inquiry::create([
                'property_id' => $publishedProperty->id,
                'user_id' => $user?->id,
                'name' => trim($data['name']),
                'phone' => trim($data['phone']),
                'email' => filled($data['email'] ?? null) ? trim($data['email']) : null,
                'preferred_contact' => $data['preferred_contact'] ?? 'phone',
                'message' => $message,
                'sender_hash' => $hash,
            ]);
        }

        return response()->json(['message' => 'Your message was sent. The owner will contact you.'], 201);
    }

    /** The owner's inbox: messages about their own listings, newest first. */
    public function index(Request $request)
    {
        $owner = $request->user()->owner;

        abort_if(
            $owner === null,
            response()->json(['message' => 'Create your landlord profile first.', 'code' => 'owner_profile_required'], 403)
        );

        $request->validate([
            'status' => ['nullable', Rule::in(array_column(InquiryStatus::cases(), 'value'))],
            'property' => ['nullable', 'string', 'max:160'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $own = Inquiry::query()->whereHas('property', fn ($p) => $p->withTrashed()->where('owner_id', $owner->id));

        $inquiries = (clone $own)
            ->with(['property' => fn ($q) => $q->withTrashed()])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('property'), fn ($q, $slug) => $q->whereHas('property', fn ($p) => $p->withTrashed()->where('slug', $slug)))
            ->latest('id')
            ->paginate((int) $request->query('per_page', 20));

        return InquiryResource::collection($inquiries)->additional([
            'unread_count' => (clone $own)->where('status', InquiryStatus::New->value)->count(),
        ]);
    }

    public function update(Request $request, Inquiry $landlordInquiry)
    {
        $data = $request->validate(['status' => ['required', Rule::enum(InquiryStatus::class)]]);
        $status = InquiryStatus::from($data['status']);

        $landlordInquiry->forceFill([
            'status' => $status,
            'read_at' => $status === InquiryStatus::New ? null : ($landlordInquiry->read_at ?? now()),
        ])->save();

        return new InquiryResource($landlordInquiry->load(['property' => fn ($q) => $q->withTrashed()]));
    }
}
