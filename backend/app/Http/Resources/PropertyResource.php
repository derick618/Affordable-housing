<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Card-sized representation used by list endpoints: enough for a property card, without the
 * description, gallery, amenities or owner details.
 */
class PropertyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'summary' => $this->summary,
            'property_type' => $this->property_type->value,
            'monthly_rent' => $this->monthly_rent,
            'currency' => $this->currency,
            'rent_advance_months' => $this->rent_advance_months,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'size_sqm' => $this->size_sqm,
            'furnishing' => $this->furnishing->value,
            'address_line' => $this->address_line,
            'location' => new LocationResource($this->whenLoaded('location')),
            'location_path' => $this->whenLoaded('location', fn () => $this->locationPath()),
            'availability_status' => $this->availability_status->value,
            'available_from' => $this->available_from?->toDateString(),
            'verified' => $this->whenLoaded('owner', fn () => $this->owner->isVerified()),
            'featured' => $this->featured,
            'is_demo' => $this->is_demo,
            'published_at' => $this->published_at,
            'updated_at' => $this->updated_at,
            'cover_image' => new PropertyImageResource($this->whenLoaded('coverImage')),
        ];
    }

    /**
     * The location and its ancestors from the top down, e.g. region > city > area.
     *
     * @return list<array{slug: string, name: string, type: string}>
     */
    protected function locationPath(): array
    {
        $path = [];
        $node = $this->location;

        while ($node !== null && count($path) < 10) {
            array_unshift($path, [
                'slug' => $node->slug,
                'name' => $node->name,
                'type' => $node->type->value,
            ]);
            $node = $node->parent;
        }

        return $path;
    }
}
