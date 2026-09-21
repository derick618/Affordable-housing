<?php

namespace App\Marketplace;

use App\Enums\AvailabilityStatus;
use App\Enums\LocationType;
use App\Models\Property;
use Illuminate\Database\Eloquent\Collection;

/**
 * Finds homes similar to a given one, using the same scoring the demo frontend used:
 * +3 same city (or, without a city, the nearest shared parent area), +2 same type,
 * +2 rent within the tolerance of the source rent, +1 available. Highest score first.
 *
 * Only published homes are considered, the source is excluded, and when the source is
 * reserved or rented only available homes are suggested.
 */
class SimilarProperties
{
    public function __construct(private ?LocationHierarchy $hierarchy = null)
    {
        $this->hierarchy ??= new LocationHierarchy;
    }

    /** @return Collection<int, Property> */
    public function for(Property $property, int $limit): Collection
    {
        $tolerance = (float) config('marketplace.similar.price_tolerance', 0.35);
        $rent = $property->monthly_rent;

        $query = Property::query()
            ->published()
            ->whereKeyNot($property->getKey())
            ->with(['owner', 'location.parent.parent.parent', 'coverImage']);

        if ($property->availability_status !== AvailabilityStatus::Available) {
            $query->where('availability_status', AvailabilityStatus::Available->value);
        }

        $areaIds = $this->sameAreaIds($property);
        $inPlaceholders = implode(',', array_fill(0, count($areaIds), '?'));

        $score = "(CASE WHEN properties.location_id IN ({$inPlaceholders}) THEN 3 ELSE 0 END)"
            .' + (CASE WHEN properties.property_type = ? THEN 2 ELSE 0 END)'
            .' + (CASE WHEN properties.monthly_rent BETWEEN ? AND ? THEN 2 ELSE 0 END)'
            .' + (CASE WHEN properties.availability_status = ? THEN 1 ELSE 0 END)';

        $bindings = [
            ...$areaIds,
            $property->property_type->value,
            round($rent * (1 - $tolerance), 2),
            round($rent * (1 + $tolerance), 2),
            AvailabilityStatus::Available->value,
        ];

        return $query
            ->orderByRaw("{$score} DESC", $bindings)
            ->orderByDesc('properties.featured')
            ->orderByDesc('properties.published_at')
            ->orderByDesc('properties.id')
            ->limit($limit)
            ->get();
    }

    /**
     * Location ids that count as "the same place": the source's city and everything under
     * it, else the source's parent (nearby areas), else just its own location.
     *
     * @return list<int>
     */
    private function sameAreaIds(Property $property): array
    {
        $scope = $this->hierarchy->nearestOfType($property->location_id, LocationType::City)
            ?? $this->hierarchy->parentOf($property->location_id)
            ?? $property->location_id;

        return $this->hierarchy->descendantIds($scope);
    }
}
