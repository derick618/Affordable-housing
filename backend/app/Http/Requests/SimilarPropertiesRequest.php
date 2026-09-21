<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SimilarPropertiesRequest extends FormRequest
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
            'limit' => ['nullable', 'integer', 'min:1', 'max:'.(int) config('marketplace.similar.max_limit', 12)],
        ];
    }

    public function limit(): int
    {
        return (int) ($this->validated('limit') ?? config('marketplace.similar.default_limit', 3));
    }
}
