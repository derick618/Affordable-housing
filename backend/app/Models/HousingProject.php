<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HousingProject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'address',
        'ward',
        'district',
        'total_units',
        'status',
    ];

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}
