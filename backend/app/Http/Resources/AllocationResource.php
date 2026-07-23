<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AllocationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'allocated_by' => $this->allocated_by,
            'allocated_by_name' => $this->whenLoaded('allocatedBy', fn () => $this->allocatedBy->name),
            'status' => $this->status,
            'offer_expires_at' => $this->offer_expires_at,
            'move_in_date' => $this->move_in_date,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
