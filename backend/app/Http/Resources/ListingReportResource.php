<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Staff-only view of a report. Never returned by a public endpoint. */
class ListingReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reason' => $this->reason->value,
            'details' => $this->details,
            'contact' => $this->contact,
            'status' => $this->status->value,
            'staff_note' => $this->staff_note,
            'handled_at' => $this->handled_at,
            'created_at' => $this->created_at,
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'slug' => $this->property->slug,
                'title' => $this->property->title,
                'publication_status' => $this->property->publication_status->value,
            ]),
            'reporter' => $this->whenLoaded('reporter', fn () => $this->reporter
                ? ['id' => $this->reporter->id, 'name' => $this->reporter->name]
                : null),
            'handled_by' => $this->whenLoaded('handler', fn () => $this->handler?->name),
        ];
    }
}
