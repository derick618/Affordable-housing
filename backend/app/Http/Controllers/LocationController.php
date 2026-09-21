<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexLocationsRequest;
use App\Http\Resources\LocationResource;
use App\Marketplace\LocationHierarchy;
use App\Models\Location;

class LocationController extends Controller
{
    /**
     * List locations, optionally narrowed by `type` and by `parent` (a slug; direct children
     * only). With `with_counts=1` each row carries `properties_count`: published properties
     * in that location and everything beneath it.
     */
    public function index(IndexLocationsRequest $request)
    {
        $query = Location::query()->with('parent')->orderBy('name')->orderBy('id');

        if ($type = $request->validated('type')) {
            $query->where('type', $type);
        }

        if ($parent = $request->validated('parent')) {
            $query->where('parent_id', Location::query()->where('slug', $parent)->value('id'));
        }

        $locations = $query->get();

        if ($request->validated('with_counts')) {
            $counts = (new LocationHierarchy)->publishedPropertyCounts();

            $locations->each(fn (Location $location) => $location->setAttribute(
                'properties_count',
                $counts[$location->id] ?? 0
            ));
        }

        return LocationResource::collection($locations);
    }
}
