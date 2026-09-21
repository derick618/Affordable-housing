<?php

namespace App\Enums;

enum Furnishing: string
{
    case Furnished = 'furnished';
    case SemiFurnished = 'semi_furnished';
    case Unfurnished = 'unfurnished';
}
