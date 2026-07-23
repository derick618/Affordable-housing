<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'applicant_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'housing_project_id' => $this->housing_project_id,
            'housing_project_name' => $this->whenLoaded('housingProject', fn () => $this->housingProject?->name),
            'household_size' => $this->household_size,
            'monthly_income' => $this->monthly_income,
            'employment_status' => $this->employment_status,
            'preferred_bedrooms' => $this->preferred_bedrooms,
            'status' => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewer_name' => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name),
            'reviewed_at' => $this->reviewed_at,
            'rejection_reason' => $this->rejection_reason,
            'submitted_at' => $this->submitted_at,
            'allocation' => new AllocationResource($this->whenLoaded('allocation')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
