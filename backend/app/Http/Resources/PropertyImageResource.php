<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'thumb_url' => $this->thumb_url,
            'alt_text' => $this->alt_text,
            'position' => $this->position,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}
