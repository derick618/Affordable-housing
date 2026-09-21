<?php

namespace App\Http\Requests;

class UpdatePropertyRequest extends PropertyFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->propertyRules(creating: false);
    }
}
