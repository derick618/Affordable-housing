<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewApplicationRequest;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Application::class);

        $user = $request->user();

        $query = Application::with(['user', 'housingProject'])->latest();

        if ($user->isApplicant()) {
            $query->where('user_id', $user->id);
        } elseif ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return ApplicationResource::collection($query->paginate(15));
    }

    public function store(StoreApplicationRequest $request)
    {
        $application = Application::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        return new ApplicationResource($application);
    }

    public function show(Request $request, Application $application)
    {
        $this->authorize('view', $application);

        return new ApplicationResource(
            $application->load(['user', 'housingProject', 'reviewer', 'allocation.unit'])
        );
    }

    public function update(UpdateApplicationRequest $request, Application $application)
    {
        $application->update($request->validated());

        return new ApplicationResource($application);
    }

    public function destroy(Application $application)
    {
        $this->authorize('delete', $application);

        $application->delete();

        return response()->noContent();
    }

    public function review(ReviewApplicationRequest $request, Application $application)
    {
        $application->update([
            ...$request->validated(),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return new ApplicationResource($application);
    }
}
