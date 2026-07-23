<?php

namespace App\Http\Requests;

use App\Models\Allocation;
use Illuminate\Foundation\Http\FormRequest;

class StoreAllocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Allocation::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'application_id' => ['required', 'exists:applications,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'offer_expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
