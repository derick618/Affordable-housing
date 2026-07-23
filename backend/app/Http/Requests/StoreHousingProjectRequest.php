<?php

namespace App\Http\Requests;

use App\Models\HousingProject;
use Illuminate\Foundation\Http\FormRequest;

class StoreHousingProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', HousingProject::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address' => ['nullable', 'string', 'max:255'],
            'ward' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'total_units' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:planned,ongoing,completed'],
        ];
    }
}
