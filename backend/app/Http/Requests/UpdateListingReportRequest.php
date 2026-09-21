<?php

namespace App\Http\Requests;

use App\Enums\ListingReportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateListingReportRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::enum(ListingReportStatus::class)],
            'staff_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
