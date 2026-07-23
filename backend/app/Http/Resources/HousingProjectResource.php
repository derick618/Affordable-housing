<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HousingProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'address' => $this->address,
            'ward' => $this->ward,
            'district' => $this->district,
            'total_units' => $this->total_units,
            'status' => $this->status,
            'units' => UnitResource::collection($this->whenLoaded('units')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
