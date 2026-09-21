<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AffordabilityProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'monthly_budget' => $this->monthly_budget,
            'household_size' => $this->household_size,
            'min_bedrooms' => $this->min_bedrooms,
            'location' => $this->location ? [
                'slug' => $this->location->slug,
                'name' => $this->location->name,
                'type' => $this->location->type->value,
            ] : null,
            'property_types' => $this->property_types ?? [],
            'updated_at' => $this->updated_at,
        ];
    }
}
