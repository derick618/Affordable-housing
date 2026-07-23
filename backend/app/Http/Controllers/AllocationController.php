<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAllocationRequest;
use App\Http\Resources\AllocationResource;
use App\Models\Allocation;
use App\Models\Application;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AllocationController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Allocation::class);

        $user = $request->user();

        $query = Allocation::with(['unit', 'allocatedBy', 'application.user'])->latest();

        if ($user->isApplicant()) {
            $query->whereHas('application', fn ($q) => $q->where('user_id', $user->id));
        }

        return AllocationResource::collection($query->paginate(15));
    }

    public function store(StoreAllocationRequest $request)
    {
        $application = Application::findOrFail($request->validated('application_id'));
        $unit = Unit::findOrFail($request->validated('unit_id'));

        if ($application->status !== 'approved') {
            throw ValidationException::withMessages([
                'application_id' => ['Only approved applications can be allocated a unit.'],
            ]);
        }

        if ($application->allocation()->exists()) {
            throw ValidationException::withMessages([
                'application_id' => ['This application already has an allocation.'],
            ]);
        }

        if ($unit->status !== 'available') {
            throw ValidationException::withMessages([
                'unit_id' => ['This unit is not available.'],
            ]);
        }

        $allocation = DB::transaction(function () use ($request, $application, $unit) {
            $unit->update(['status' => 'reserved']);

            return Allocation::create([
                ...$request->validated(),
                'allocated_by' => $request->user()->id,
                'status' => 'offered',
            ]);
        });

        return new AllocationResource($allocation->load(['unit', 'application']));
    }

    public function show(Allocation $allocation)
    {
        $this->authorize('view', $allocation);

        return new AllocationResource($allocation->load(['unit', 'allocatedBy', 'application.user']));
    }

    /**
     * The applicant accepts or declines their offer.
     */
    public function respond(Request $request, Allocation $allocation)
    {
        $this->authorize('respond', $allocation);

        $data = $request->validate([
            'action' => ['required', 'in:accept,decline'],
        ]);

        DB::transaction(function () use ($data, $allocation) {
            if ($data['action'] === 'accept') {
                $allocation->update(['status' => 'accepted']);
            } else {
                $allocation->update(['status' => 'declined']);
                $allocation->unit->update(['status' => 'available']);
            }
        });

        return new AllocationResource($allocation->fresh(['unit', 'application']));
    }

    /**
     * An officer/admin confirms move-in for an accepted offer.
     */
    public function confirm(Request $request, Allocation $allocation)
    {
        $this->authorize('confirm', $allocation);

        if ($allocation->status !== 'accepted') {
            throw ValidationException::withMessages([
                'status' => ['Only accepted offers can be confirmed.'],
            ]);
        }

        $data = $request->validate([
            'move_in_date' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($data, $allocation) {
            $allocation->update([
                'status' => 'confirmed',
                'move_in_date' => $data['move_in_date'] ?? null,
            ]);
            $allocation->unit->update(['status' => 'occupied']);
        });

        return new AllocationResource($allocation->fresh(['unit', 'application']));
    }

    /**
     * An officer/admin cancels an offer/allocation and frees the unit.
     */
    public function destroy(Allocation $allocation)
    {
        $this->authorize('delete', $allocation);

        DB::transaction(function () use ($allocation) {
            if ($allocation->unit->status !== 'available') {
                $allocation->unit->update(['status' => 'available']);
            }
            $allocation->delete();
        });

        return response()->noContent();
    }
}
