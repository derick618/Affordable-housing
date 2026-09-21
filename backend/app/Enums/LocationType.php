<?php

namespace App\Enums;

/**
 * Levels of the location hierarchy. Rows form a tree through locations.parent_id,
 * for example region -> city -> district -> area. Not every level has to be used.
 */
enum LocationType: string
{
    case Region = 'region';
    case City = 'city';
    case District = 'district';
    case Area = 'area';
}
