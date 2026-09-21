<?php

namespace App\Marketplace;

use App\Enums\LocationType;
use App\Models\Location;
use App\Models\Property;

/**
 * Answers questions about the location tree (descendants, ancestors, counts) without
 * recursive SQL, so it behaves the same on MySQL and SQLite. The id/parent map is loaded
 * once per instance; only two integer columns per row are read.
 */
class LocationHierarchy
{
    /** @var array<int, int|null>|null id => parent_id */
    private ?array $parents = null;

    /** @var array<int, list<int>>|null parent_id => child ids */
    private ?array $children = null;

    /**
     * @param  int|list<int>  $ids
     * @return list<int> the given ids plus every descendant
     */
    public function descendantIds(int|array $ids): array
    {
        $this->load();

        $queue = array_map('intval', (array) $ids);
        $seen = [];

        while ($queue) {
            $id = array_shift($queue);

            if (isset($seen[$id])) {
                continue;
            }

            $seen[$id] = true;

            foreach ($this->children[$id] ?? [] as $childId) {
                $queue[] = $childId;
            }
        }

        return array_keys($seen);
    }

    /** The id of the nearest ancestor (or the location itself) of the given type. */
    public function nearestOfType(int $locationId, LocationType $type): ?int
    {
        $this->load();

        $typeByLocation = Location::query()->whereIn('id', $this->ancestorPath($locationId))->pluck('type', 'id');

        foreach ($this->ancestorPath($locationId) as $id) {
            $rowType = $typeByLocation[$id] ?? null;
            $rowType = $rowType instanceof LocationType ? $rowType : LocationType::tryFrom((string) $rowType);

            if ($rowType === $type) {
                return $id;
            }
        }

        return null;
    }

    public function parentOf(int $locationId): ?int
    {
        $this->load();

        return $this->parents[$locationId] ?? null;
    }

    /**
     * Published, non-deleted properties per location. A parent counts everything below it,
     * so a city includes the properties in its areas.
     *
     * @return array<int, int> location id => count
     */
    public function publishedPropertyCounts(): array
    {
        $this->load();

        $direct = Property::query()
            ->published()
            ->selectRaw('location_id, count(*) as aggregate')
            ->groupBy('location_id')
            ->pluck('aggregate', 'location_id');

        $counts = [];

        foreach ($direct as $locationId => $count) {
            foreach ($this->ancestorPath((int) $locationId) as $id) {
                $counts[$id] = ($counts[$id] ?? 0) + (int) $count;
            }
        }

        return $counts;
    }

    /** The location and its ancestors, nearest first. Guards against accidental cycles. */
    private function ancestorPath(int $locationId): array
    {
        $path = [];
        $id = $locationId;

        while ($id !== null && ! in_array($id, $path, true) && count($path) < 10) {
            $path[] = $id;
            $id = $this->parents[$id] ?? null;
        }

        return $path;
    }

    private function load(): void
    {
        if ($this->parents !== null) {
            return;
        }

        $this->parents = [];
        $this->children = [];

        foreach (Location::query()->get(['id', 'parent_id']) as $row) {
            $this->parents[$row->id] = $row->parent_id;

            if ($row->parent_id !== null) {
                $this->children[$row->parent_id][] = $row->id;
            }
        }
    }
}
