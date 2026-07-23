<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHousingProjectRequest;
use App\Http\Requests\UpdateHousingProjectRequest;
use App\Http\Resources\HousingProjectResource;
use App\Models\HousingProject;

class HousingProjectController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', HousingProject::class);

        return HousingProjectResource::collection(
            HousingProject::withCount('units')->latest()->paginate(15)
        );
    }

    public function store(StoreHousingProjectRequest $request)
    {
        $project = HousingProject::create($request->validated());

        return new HousingProjectResource($project);
    }

    public function show(HousingProject $housingProject)
    {
        $this->authorize('view', $housingProject);

        return new HousingProjectResource($housingProject->load('units'));
    }

    public function update(UpdateHousingProjectRequest $request, HousingProject $housingProject)
    {
        $housingProject->update($request->validated());

        return new HousingProjectResource($housingProject);
    }

    public function destroy(HousingProject $housingProject)
    {
        $this->authorize('delete', $housingProject);

        $housingProject->delete();

        return response()->noContent();
    }
}
