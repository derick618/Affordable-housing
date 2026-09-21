<?php

namespace App\Http\Requests;

use App\Enums\ListingReportReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreListingReportRequest extends FormRequest
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
            'reason' => ['required', 'string', Rule::enum(ListingReportReason::class)],
            'details' => ['nullable', 'string', 'max:1000'],
            'contact' => ['nullable', 'string', 'max:120'],
        ];
    }
}
