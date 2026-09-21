<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffordabilityProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'monthly_budget',
        'household_size',
        'min_bedrooms',
        'location_id',
        'property_types',
    ];

    protected function casts(): array
    {
        return [
            'monthly_budget' => 'integer',
            'household_size' => 'integer',
            'min_bedrooms' => 'integer',
            'property_types' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
