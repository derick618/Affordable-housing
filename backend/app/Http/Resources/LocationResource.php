<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type->value,
            'parent_slug' => $this->whenLoaded('parent', fn () => $this->parent?->slug),
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            // Present only for GET /api/locations?with_counts=1.
            'properties_count' => $this->when(
                $this->resource->offsetExists('properties_count'),
                fn () => $this->properties_count
            ),
        ];
    }
}
