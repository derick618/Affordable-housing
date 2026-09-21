<?php

namespace App\Http\Controllers;

use App\Http\Resources\AmenityResource;
use App\Models\Amenity;

class AmenityController extends Controller
{
    /** Every amenity a listing can offer, in display order. Used to fill in the listing form. */
    public function index()
    {
        return AmenityResource::collection(Amenity::query()->orderBy('sort_order')->orderBy('id')->get());
    }
}
