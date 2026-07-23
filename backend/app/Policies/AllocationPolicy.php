<?php

namespace App\Policies;

use App\Models\Allocation;
use App\Models\User;

class AllocationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Allocation $allocation): bool
    {
        return $allocation->application->user_id === $user->id
            || $user->isHousingOfficer()
            || $user->isSuperAdmin()
            || $user->isAuditor();
    }

    public function create(User $user): bool
    {
        return $user->isHousingOfficer() || $user->isSuperAdmin();
    }

    /**
     * The applicant the offer was made to accepts/declines it.
     */
    public function respond(User $user, Allocation $allocation): bool
    {
        return $allocation->application->user_id === $user->id && $allocation->status === 'offered';
    }

    /**
     * Officers/admins confirm an accepted offer (move-in) or cancel it.
     */
    public function confirm(User $user, Allocation $allocation): bool
    {
        return $user->isHousingOfficer() || $user->isSuperAdmin();
    }

    public function delete(User $user, Allocation $allocation): bool
    {
        return $user->isHousingOfficer() || $user->isSuperAdmin();
    }
}
