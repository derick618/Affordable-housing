<?php

namespace App\Http\Requests;

class StorePropertyRequest extends PropertyFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->propertyRules(creating: true);
    }
}
