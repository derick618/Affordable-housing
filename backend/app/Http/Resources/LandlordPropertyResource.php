<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * A listing as its owner (or a moderator) sees it: everything on the public detail page plus
 * where it is in the review process.
 */
class LandlordPropertyResource extends PropertyDetailResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'publication_status' => $this->publication_status->value,
            'submitted_at' => $this->submitted_at,
            'reviewed_at' => $this->reviewed_at,
            'moderation_note' => $this->moderation_note,
            'images_count' => $this->whenCounted('images'),
            'inquiries_count' => $this->whenCounted('inquiries'),
            'new_inquiries_count' => $this->whenCounted('new_inquiries'),
        ];
    }
}
