<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'housing_project_id' => $this->housing_project_id,
            'housing_project_name' => $this->whenLoaded('housingProject', fn () => $this->housingProject->name),
            'unit_number' => $this->unit_number,
            'block' => $this->block,
            'floor' => $this->floor,
            'bedrooms' => $this->bedrooms,
            'size_sqm' => $this->size_sqm,
            'ownership_type' => $this->ownership_type,
            'price' => $this->price,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
