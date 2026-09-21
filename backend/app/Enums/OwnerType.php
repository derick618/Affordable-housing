<?php

namespace App\Enums;

enum OwnerType: string
{
    case Landlord = 'landlord';
    case Agent = 'agent';
}
