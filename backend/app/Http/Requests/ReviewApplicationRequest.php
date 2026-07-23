<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('review', $this->route('application'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:under_review,approved,rejected,waitlisted'],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string'],
        ];
    }
}
