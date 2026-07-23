<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    /**
     * Scoping to "own vs all" happens in the controller query; any
     * authenticated user may hit the index/show endpoints.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Application $application): bool
    {
        return $application->user_id === $user->id
            || $user->isHousingOfficer()
            || $user->isSuperAdmin()
            || $user->isAuditor();
    }

    public function create(User $user): bool
    {
        return $user->isApplicant();
    }

    /**
     * Applicants may edit their own application while it's still pending.
     */
    public function update(User $user, Application $application): bool
    {
        return $application->user_id === $user->id && $application->status === 'pending';
    }

    /**
     * Applicants may withdraw their own application before it's decided.
     */
    public function delete(User $user, Application $application): bool
    {
        return $application->user_id === $user->id
            && in_array($application->status, ['pending', 'under_review'], true);
    }

    /**
     * Officers/admins decide the outcome of an application.
     */
    public function review(User $user, Application $application): bool
    {
        return $user->isHousingOfficer() || $user->isSuperAdmin();
    }
}
