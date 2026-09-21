<?php

namespace App\Enums;

enum PropertyType: string
{
    case Apartment = 'apartment';
    case House = 'house';
    case Townhouse = 'townhouse';
    case Studio = 'studio';
    case Room = 'room';
}
