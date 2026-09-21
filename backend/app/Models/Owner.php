<?php

namespace App\Models;

use App\Enums\OwnerType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Owner extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'phone',
        'whatsapp',
        'languages',
        'response_time',
        'verified_at',
        'verified_by',
        'is_demo',
    ];

    /**
     * Contact details are never serialised by accident. They are reserved for a future,
     * throttled contact endpoint.
     *
     * @var list<string>
     */
    protected $hidden = [
        'phone',
        'whatsapp',
    ];

    protected function casts(): array
    {
        return [
            'type' => OwnerType::class,
            'verified_at' => 'datetime',
            'is_demo' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    /** "Verified" means we checked the owner's ID. It is not a guarantee about any listing. */
    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }
}
