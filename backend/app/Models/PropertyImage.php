<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PropertyImage extends Model
{
    use HasFactory;

    /** Disk name for demo photos that are served by the React app. */
    public const DEMO_DISK = 'demo';

    protected $fillable = [
        'property_id',
        'disk',
        'path',
        'alt_text',
        'position',
        'width',
        'height',
        'mime',
        'size_bytes',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'size_bytes' => 'integer',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** Full-size (1200px) image URL. */
    protected function url(): Attribute
    {
        return Attribute::get(fn () => $this->urlFor($this->path));
    }

    /**
     * Card-size (640px) image URL. Variants follow one naming rule everywhere:
     * `name.jpg` is full size and `name-sm.jpg` is the small one.
     */
    protected function thumbUrl(): Attribute
    {
        return Attribute::get(fn () => $this->urlFor($this->thumbPath()));
    }

    private function thumbPath(): string
    {
        if ($this->disk === self::DEMO_DISK) {
            return $this->path.'-sm';
        }

        return preg_replace('/(\.[A-Za-z0-9]+)$/', '-sm$1', $this->path) ?? $this->path;
    }

    private function urlFor(string $path): string
    {
        if ($this->disk === self::DEMO_DISK) {
            return rtrim(config('marketplace.demo_image_base_url'), '/').'/'.ltrim($path, '/').'.jpg';
        }

        return Storage::disk($this->disk)->url($path);
    }
}
