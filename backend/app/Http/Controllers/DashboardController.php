<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\Application;
use App\Models\HousingProject;
use App\Models\Unit;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private const APPLICATION_STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'];

    private const UNIT_STATUSES = ['available', 'reserved', 'allocated', 'occupied', 'maintenance'];

    private const PROJECT_STATUSES = ['planned', 'ongoing', 'completed'];

    private const ALLOCATION_STATUSES = ['offered', 'accepted', 'declined', 'confirmed', 'cancelled'];

    public function index(Request $request)
    {
        $this->authorize('view-dashboard');

        $unitTotal = Unit::count();
        $occupiedUnits = Unit::where('status', 'occupied')->count();

        return response()->json([
            'applications' => $this->countsByStatus(Application::class, self::APPLICATION_STATUSES),
            'units' => $this->countsByStatus(Unit::class, self::UNIT_STATUSES),
            'housing_projects' => $this->countsByStatus(HousingProject::class, self::PROJECT_STATUSES),
            'allocations' => $this->countsByStatus(Allocation::class, self::ALLOCATION_STATUSES),
            'occupancy_rate' => $unitTotal > 0 ? round($occupiedUnits / $unitTotal * 100, 1) : 0,
            'recent_applications' => Application::with('user')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn (Application $application) => [
                    'id' => $application->id,
                    'applicant_name' => $application->user->name,
                    'status' => $application->status,
                    'submitted_at' => $application->submitted_at,
                ]),
        ]);
    }

    /**
     * @param  class-string  $model
     * @param  array<int, string>  $statuses
     * @return array<string, int>
     */
    private function countsByStatus(string $model, array $statuses): array
    {
        $counts = $model::query()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $result = ['total' => 0];

        foreach ($statuses as $status) {
            $count = (int) ($counts[$status] ?? 0);
            $result[$status] = $count;
            $result['total'] += $count;
        }

        return $result;
    }
}
