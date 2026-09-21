<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInquiryRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'regex:/^\+?[0-9 ]{9,16}$/'],
            'email' => ['nullable', 'email:rfc', 'max:160'],
            'preferred_contact' => ['nullable', 'in:phone,whatsapp,email'],
            'message' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a phone number such as +255 712 345 678.',
            'message.min' => 'Write a little more so the owner knows what you need.',
        ];
    }
}
