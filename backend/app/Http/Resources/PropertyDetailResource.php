<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** Full public representation of one listing. */
class PropertyDetailResource extends PropertyResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'description' => $this->description,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'water_details' => $this->water_details,
            'power_details' => $this->power_details,
            'water_included' => $this->water_included,
            'power_included' => $this->power_included,
            'nearby' => $this->nearby ?? [],
            'images' => PropertyImageResource::collection($this->whenLoaded('images')),
            'amenities' => AmenityResource::collection($this->whenLoaded('amenities')),
            'owner' => new OwnerResource($this->whenLoaded('owner')),
            'created_at' => $this->created_at,
        ];
    }
}
