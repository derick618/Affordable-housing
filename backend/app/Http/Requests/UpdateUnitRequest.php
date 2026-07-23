<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('unit'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'unit_number' => ['sometimes', 'required', 'string', 'max:255'],
            'block' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'integer', 'min:0'],
            'bedrooms' => ['sometimes', 'required', 'integer', 'min:0', 'max:255'],
            'size_sqm' => ['nullable', 'numeric', 'min:0'],
            'ownership_type' => ['sometimes', 'required', 'in:rent,sale'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:available,reserved,allocated,occupied,maintenance'],
        ];
    }
}
