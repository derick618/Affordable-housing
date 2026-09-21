<?php

namespace App\Http\Requests;

use App\Enums\PropertyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertAffordabilityProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'monthly_budget' => ['nullable', 'integer', 'min:10000', 'max:100000000'],
            'household_size' => ['nullable', 'integer', 'min:1', 'max:20'],
            'min_bedrooms' => ['nullable', 'integer', 'min:0', 'max:10'],
            'location' => ['nullable', 'string', Rule::exists('locations', 'slug')],
            'property_types' => ['nullable', 'array', 'max:5'],
            'property_types.*' => ['distinct', Rule::enum(PropertyType::class)],
        ];
    }
}
