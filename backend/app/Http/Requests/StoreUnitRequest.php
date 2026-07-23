<?php

namespace App\Http\Requests;

use App\Models\Unit;
use Illuminate\Foundation\Http\FormRequest;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Unit::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'unit_number' => ['required', 'string', 'max:255'],
            'block' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'integer', 'min:0'],
            'bedrooms' => ['required', 'integer', 'min:0', 'max:255'],
            'size_sqm' => ['nullable', 'numeric', 'min:0'],
            'ownership_type' => ['required', 'in:rent,sale'],
            'price' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:available,reserved,allocated,occupied,maintenance'],
        ];
    }
}
