<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** An inquiry as the listing's owner sees it. The visitor's details are for the owner only. */
class InquiryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'preferred_contact' => $this->preferred_contact,
            'message' => $this->message,
            'status' => $this->status->value,
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
            'property' => $this->whenLoaded('property', fn () => [
                'slug' => $this->property->slug,
                'title' => $this->property->title,
            ]),
        ];
    }
}
