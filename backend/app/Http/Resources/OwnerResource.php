<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public owner information. Phone and WhatsApp numbers are intentionally absent; they are
 * reserved for a future throttled contact endpoint (and are $hidden on the model).
 */
class OwnerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type->value,
            'languages' => $this->languages,
            'response_time' => $this->response_time,
            'verified' => $this->isVerified(),
            'verified_at' => $this->verified_at,
            'member_since' => $this->created_at?->year,
        ];
    }
}
