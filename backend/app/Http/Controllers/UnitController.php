<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUnitRequest;
use App\Http\Requests\UpdateUnitRequest;
use App\Http\Resources\UnitResource;
use App\Models\HousingProject;
use App\Models\Unit;

class UnitController extends Controller
{
    public function index(HousingProject $housingProject)
    {
        $this->authorize('viewAny', Unit::class);

        return UnitResource::collection(
            $housingProject->units()->latest()->paginate(15)
        );
    }

    public function store(StoreUnitRequest $request, HousingProject $housingProject)
    {
        $unit = $housingProject->units()->create($request->validated());

        return new UnitResource($unit);
    }

    public function show(Unit $unit)
    {
        $this->authorize('view', $unit);

        return new UnitResource($unit->load('housingProject'));
    }

    public function update(UpdateUnitRequest $request, Unit $unit)
    {
        $unit->update($request->validated());

        return new UnitResource($unit);
    }

    public function destroy(Unit $unit)
    {
        $this->authorize('delete', $unit);

        $unit->delete();

        return response()->noContent();
    }
}
