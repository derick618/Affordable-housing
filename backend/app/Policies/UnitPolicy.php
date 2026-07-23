<?php

namespace App\Policies;

use App\Models\Unit;
use App\Models\User;

class UnitPolicy
{
    /**
     * Any authenticated user can browse units (applicants included).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Unit $unit): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isHousingOfficer();
    }

    public function update(User $user, Unit $unit): bool
    {
        return $user->isSuperAdmin() || $user->isHousingOfficer();
    }

    /**
     * Deleting a unit is destructive, so it's restricted to super admins.
     */
    public function delete(User $user, Unit $unit): bool
    {
        return $user->isSuperAdmin();
    }
}
