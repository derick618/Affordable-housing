<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AmenityResource extends JsonResource
{
    /**
     * `note` is the listing-specific wording from the pivot, for example
     * "Parking for 2 cars" on the `parking` amenity. Show `note` if present, else `label`.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'label' => $this->label,
            'category' => $this->category,
            'note' => $this->whenPivotLoaded('amenity_property', fn () => $this->pivot->note),
        ];
    }
}
