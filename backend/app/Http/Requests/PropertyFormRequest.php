<?php

namespace App\Http\Requests;

use App\Enums\AvailabilityStatus;
use App\Enums\Furnishing;
use App\Enums\PropertyType;
use App\Models\Amenity;
use App\Models\Location;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The fields a landlord can set on a listing. Anything not listed here (owner, slug, featured,
 * demo flag, publication status, review fields) can never be set through this request.
 */
abstract class PropertyFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    protected function propertyRules(bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'min:5', 'max:160'],
            'summary' => ['sometimes', 'nullable', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'property_type' => [$required, Rule::enum(PropertyType::class)],
            'monthly_rent' => [$required, 'integer', 'min:10000', 'max:100000000'],
            'rent_advance_months' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'bedrooms' => [$required, 'integer', 'min:0', 'max:20'],
            'bathrooms' => [$required, 'integer', 'min:0', 'max:20'],
            'size_sqm' => ['sometimes', 'nullable', 'integer', 'min:5', 'max:5000'],
            'furnishing' => ['sometimes', Rule::enum(Furnishing::class)],
            'location' => [$required, 'string', Rule::exists('locations', 'slug')],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'water_details' => ['sometimes', 'nullable', 'string', 'max:255'],
            'power_details' => ['sometimes', 'nullable', 'string', 'max:255'],
            'water_included' => ['sometimes', 'boolean'],
            'power_included' => ['sometimes', 'boolean'],
            'nearby' => ['sometimes', 'nullable', 'array', 'max:10'],
            'nearby.*.kind' => ['required', 'in:transport,school,health,market'],
            'nearby.*.text' => ['required', 'string', 'max:120'],
            'availability_status' => ['sometimes', Rule::enum(AvailabilityStatus::class)],
            'available_from' => ['sometimes', 'nullable', 'date'],
            'amenities' => ['sometimes', 'array', 'max:30'],
            'amenities.*.slug' => ['required', 'string', 'distinct', Rule::exists('amenities', 'slug')],
            'amenities.*.note' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * The validated fields as Property attributes (location slug resolved to its id).
     *
     * @return array<string, mixed>
     */
    public function propertyAttributes(): array
    {
        $data = $this->safe()->except(['location', 'amenities']);

        if ($this->has('location')) {
            $data['location_id'] = Location::query()->where('slug', $this->validated('location'))->value('id');
        }

        if (array_key_exists('nearby', $data) && is_array($data['nearby'])) {
            $data['nearby'] = collect($data['nearby'])
                ->map(fn ($item) => ['kind' => $item['kind'], 'text' => trim($item['text'])])
                ->values()
                ->all();
        }

        return $data;
    }

    /**
     * Pivot payload for `sync()`, or null when the request did not mention amenities.
     *
     * @return array<int, array{note: ?string}>|null
     */
    public function amenitySync(): ?array
    {
        if (! $this->has('amenities')) {
            return null;
        }

        $slugs = collect($this->validated('amenities'));
        $ids = Amenity::query()->whereIn('slug', $slugs->pluck('slug'))->pluck('id', 'slug');

        return $slugs->mapWithKeys(fn ($item) => [
            $ids[$item['slug']] => ['note' => ($item['note'] ?? null) !== null ? trim($item['note']) : null],
        ])->all();
    }
}
