<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

/**
 * Who may change a marketplace listing: the login linked to its owner profile (owners.user_id).
 * Staff moderation is a separate set of gates (see AppServiceProvider), so staff cannot edit a
 * landlord's listing content, only approve or send it back.
 */
class PropertyPolicy
{
    public function manage(User $user, Property $property): bool
    {
        return $property->owner !== null && $property->owner->user_id === $user->id;
    }
}
