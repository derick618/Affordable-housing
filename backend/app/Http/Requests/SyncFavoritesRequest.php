<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncFavoritesRequest extends FormRequest
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
            'slugs' => ['required', 'array', 'max:'.(int) config('marketplace.favorites.max', 200)],
            'slugs.*' => ['string', 'max:160'],
        ];
    }

    /** @return list<string> */
    public function slugs(): array
    {
        return array_values(array_unique($this->validated('slugs')));
    }
}
