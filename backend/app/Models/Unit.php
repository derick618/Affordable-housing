<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'housing_project_id',
        'unit_number',
        'block',
        'floor',
        'bedrooms',
        'size_sqm',
        'ownership_type',
        'price',
        'status',
    ];

    public function housingProject(): BelongsTo
    {
        return $this->belongsTo(HousingProject::class);
    }

    public function allocation(): HasOne
    {
        return $this->hasOne(Allocation::class);
    }
}
