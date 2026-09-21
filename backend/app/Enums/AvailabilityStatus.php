<?php

namespace App\Enums;

/** Whether the home can currently be rented. Independent of whether the listing is published. */
enum AvailabilityStatus: string
{
    case Available = 'available';
    case Reserved = 'reserved';
    case Rented = 'rented';
}
