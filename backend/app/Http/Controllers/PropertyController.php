<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexPropertiesRequest;
use App\Http\Requests\SimilarPropertiesRequest;
use App\Http\Resources\PropertyDetailResource;
use App\Http\Resources\PropertyResource;
use App\Marketplace\PropertyFilter;
use App\Marketplace\SimilarProperties;
use App\Models\Property;

/**
 * Public, read-only marketplace endpoints. Only published listings are ever returned;
 * a draft, pending or archived listing is indistinguishable from one that does not exist.
 */
class PropertyController extends Controller
{
    /** Relations needed to render a card, loaded eagerly to avoid N+1 queries. */
    public const CARD_RELATIONS = ['owner', 'location.parent.parent.parent', 'coverImage'];

    public function index(IndexPropertiesRequest $request)
    {
        $query = Property::query()->published()->with(self::CARD_RELATIONS);

        (new PropertyFilter($request->filters()))->apply($query);

        return PropertyResource::collection(
            $query->paginate($request->perPage())->withQueryString()
        );
    }

    public function show(Property $publishedProperty)
    {
        return new PropertyDetailResource($publishedProperty->load([
            'owner',
            'location.parent.parent.parent',
            'images',
            'amenities',
        ]));
    }

    public function similar(SimilarPropertiesRequest $request, Property $publishedProperty)
    {
        $publishedProperty->load('location');

        return PropertyResource::collection(
            (new SimilarProperties)->for($publishedProperty, $request->limit())
        );
    }
}
