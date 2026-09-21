<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadPropertyImagesRequest extends FormRequest
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
        $config = config('marketplace.images');

        return [
            'images' => ['required', 'array', 'min:1', 'max:'.$config['max_files_per_request']],
            'images.*' => [
                'file',
                'mimes:jpg,jpeg,png,webp',
                'max:'.$config['max_upload_kb'],
                'dimensions:min_width='.$config['min_width'].',min_height='.$config['min_height']
                    .',max_width='.$config['max_dimension'].',max_height='.$config['max_dimension'],
            ],
        ];
    }

    public function messages(): array
    {
        $config = config('marketplace.images');

        return [
            'images.*.max' => 'Each photo must be smaller than '.round($config['max_upload_kb'] / 1024).' MB.',
            'images.*.mimes' => 'Photos must be JPG, PNG or WebP.',
            'images.*.dimensions' => "Photos must be at least {$config['min_width']}×{$config['min_height']} pixels and no larger than {$config['max_dimension']} pixels on either side.",
        ];
    }
}
