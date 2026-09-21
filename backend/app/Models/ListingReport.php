<?php

namespace App\Models;

use App\Enums\ListingReportReason;
use App\Enums\ListingReportStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListingReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'user_id',
        'reason',
        'details',
        'contact',
        'status',
        'reporter_hash',
        'handled_by',
        'handled_at',
        'staff_note',
    ];

    /** @var list<string> */
    protected $hidden = ['reporter_hash'];

    protected function casts(): array
    {
        return [
            'reason' => ListingReportReason::class,
            'status' => ListingReportStatus::class,
            'handled_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class)->withTrashed();
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
