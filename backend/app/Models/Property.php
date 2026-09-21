<?php

namespace App\Models;

use App\Enums\AvailabilityStatus;
use App\Enums\Furnishing;
use App\Enums\PropertyType;
use App\Enums\PublicationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use LogicException;

/**
 * A marketplace listing. Unrelated to `Unit`, which belongs to the allocation workflow.
 */
class Property extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'location_id',
        'slug',
        'title',
        'summary',
        'description',
        'property_type',
        'monthly_rent',
        'currency',
        'rent_advance_months',
        'bedrooms',
        'bathrooms',
        'size_sqm',
        'furnishing',
        'address_line',
        'latitude',
        'longitude',
        'water_details',
        'power_details',
        'water_included',
        'power_included',
        'nearby',
        'availability_status',
        'available_from',
        'publication_status',
        'featured',
        'is_demo',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'property_type' => PropertyType::class,
            'furnishing' => Furnishing::class,
            'availability_status' => AvailabilityStatus::class,
            'publication_status' => PublicationStatus::class,
            'monthly_rent' => 'integer',
            'rent_advance_months' => 'integer',
            'bedrooms' => 'integer',
            'bathrooms' => 'integer',
            'size_sqm' => 'integer',
            'latitude' => 'float',
            'longitude' => 'float',
            'water_included' => 'boolean',
            'power_included' => 'boolean',
            'nearby' => 'array',
            'available_from' => 'date',
            'featured' => 'boolean',
            'is_demo' => 'boolean',
            'published_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /** A unique, URL-safe slug for a new listing. Never regenerated afterwards. */
    public static function newSlug(string $title): string
    {
        $base = Str::limit(Str::slug($title), 100, '');

        do {
            $slug = trim($base.'-'.Str::lower(Str::random(6)), '-');
        } while (static::withTrashed()->where('slug', $slug)->exists());

        return $slug;
    }

    protected static function booted(): void
    {
        // Public URLs are built from the slug, so it must never change once created.
        static::updating(function (Property $property) {
            if ($property->isDirty('slug')) {
                throw new LogicException('A property slug is immutable once it has been created.');
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('publication_status', PublicationStatus::Published->value);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('position')->orderBy('id');
    }

    /** The image at the lowest position, used by list responses so they do not load every photo. */
    public function coverImage(): HasOne
    {
        return $this->hasOne(PropertyImage::class)->ofMany(['position' => 'min', 'id' => 'min']);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class)
            ->withPivot('note')
            ->orderBy('amenities.sort_order')
            ->orderBy('amenities.id');
    }
}
