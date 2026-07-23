<?php

namespace App\Http\Requests;

use App\Models\Application;
use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Application::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'housing_project_id' => ['nullable', 'exists:housing_projects,id'],
            'household_size' => ['required', 'integer', 'min:1', 'max:255'],
            'monthly_income' => ['required', 'numeric', 'min:0'],
            'employment_status' => ['nullable', 'string', 'max:255'],
            'preferred_bedrooms' => ['nullable', 'integer', 'min:0', 'max:255'],
        ];
    }
}
