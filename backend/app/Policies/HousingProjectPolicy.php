<?php

namespace App\Policies;

use App\Models\HousingProject;
use App\Models\User;

class HousingProjectPolicy
{
    /**
     * Any authenticated user can browse projects (applicants included).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, HousingProject $housingProject): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isHousingOfficer();
    }

    public function update(User $user, HousingProject $housingProject): bool
    {
        return $user->isSuperAdmin() || $user->isHousingOfficer();
    }

    /**
     * Deleting a project is destructive, so it's restricted to super admins.
     */
    public function delete(User $user, HousingProject $housingProject): bool
    {
        return $user->isSuperAdmin();
    }
}
