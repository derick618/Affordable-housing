<?php

namespace App\Http\Requests;

use App\Enums\OwnerType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertOwnerProfileRequest extends FormRequest
{
    private const PHONE = '/^\+?[0-9 ]{9,16}$/';

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
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'type' => ['required', Rule::enum(OwnerType::class)],
            'phone' => ['required', 'string', 'regex:'.self::PHONE],
            'whatsapp' => ['nullable', 'string', 'regex:'.self::PHONE],
            'languages' => ['nullable', 'string', 'max:120'],
            'response_time' => ['nullable', 'string', 'max:60'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a phone number such as +255 712 345 678.',
            'whatsapp.regex' => 'Enter a phone number such as +255 712 345 678.',
        ];
    }
}
