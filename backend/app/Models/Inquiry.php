<?php

namespace App\Models;

use App\Enums\InquiryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'user_id',
        'name',
        'phone',
        'email',
        'preferred_contact',
        'message',
        'status',
        'read_at',
        'sender_hash',
    ];

    /** @var list<string> */
    protected $hidden = ['sender_hash'];

    protected function casts(): array
    {
        return [
            'status' => InquiryStatus::class,
            'read_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class)->withTrashed();
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
