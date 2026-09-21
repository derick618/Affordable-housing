<?php

namespace App\Http\Requests;

use App\Enums\LocationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexLocationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->query('with_counts') !== null) {
            $bool = filter_var($this->query('with_counts'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($bool !== null) {
                $this->merge(['with_counts' => $bool]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', Rule::enum(LocationType::class)],
            'parent' => ['nullable', 'string', 'max:100', Rule::exists('locations', 'slug')],
            'with_counts' => ['nullable', 'boolean'],
        ];
    }
}
