<?php

namespace App\Http\Requests;

use App\Enums\AvailabilityStatus;
use App\Enums\PropertyType;
use App\Marketplace\PropertyFilter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates and normalises the query string of GET /api/properties.
 * List parameters accept either `a,b,c` or `a[]=a&a[]=b`.
 */
class IndexPropertiesRequest extends FormRequest
{
    private const LIST_KEYS = ['property_type', 'slugs', 'exclude'];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        foreach (self::LIST_KEYS as $key) {
            $value = $this->query($key);

            if (is_string($value)) {
                $merge[$key] = array_values(array_filter(
                    array_map('trim', explode(',', $value)),
                    fn (string $item) => $item !== ''
                ));
            }
        }

        if ($this->query('featured') !== null) {
            $bool = filter_var($this->query('featured'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($bool !== null) {
                $merge['featured'] = $bool;
            }
        }

        $this->merge($merge);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $maxPerPage = (int) config('marketplace.pagination.max_per_page', 50);

        return [
            'q' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100', Rule::exists('locations', 'slug')],
            'min_price' => ['nullable', 'integer', 'min:0', 'max:2000000000'],
            'max_price' => ['nullable', 'integer', 'min:0', 'max:2000000000'],
            'property_type' => ['nullable', 'array', 'max:'.count(PropertyType::cases())],
            'property_type.*' => ['string', Rule::enum(PropertyType::class)],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'availability' => ['nullable', Rule::enum(AvailabilityStatus::class)],
            'featured' => ['nullable', 'boolean'],
            'slugs' => ['nullable', 'array', 'max:50'],
            'slugs.*' => ['string', 'max:160'],
            'exclude' => ['nullable', 'array', 'max:50'],
            'exclude.*' => ['string', 'max:160'],
            'sort' => ['nullable', Rule::in(PropertyFilter::SORTS)],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.$maxPerPage],
        ];
    }

    /** @return array<string, mixed> the parameters PropertyFilter understands */
    public function filters(): array
    {
        return $this->safe()->only([
            'q', 'location', 'min_price', 'max_price', 'property_type', 'bedrooms',
            'availability', 'featured', 'slugs', 'exclude', 'sort',
        ]);
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? config('marketplace.pagination.default_per_page', 12));
    }
}
