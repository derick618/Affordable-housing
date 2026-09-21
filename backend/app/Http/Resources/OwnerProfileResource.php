<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An owner profile including contact numbers. Only ever returned to the owner themselves and to
 * staff, never on a public listing (see OwnerResource for the public shape).
 */
class OwnerProfileResource extends JsonResource
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
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'languages' => $this->languages,
            'response_time' => $this->response_time,
            'verified' => $this->isVerified(),
            'verified_at' => $this->verified_at,
            'created_at' => $this->created_at,
            'properties_count' => $this->whenCounted('properties'),
        ];
    }
}
