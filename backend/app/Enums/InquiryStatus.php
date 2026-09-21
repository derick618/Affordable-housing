<?php

namespace App\Enums;

/** Where an inquiry is in the landlord's inbox. */
enum InquiryStatus: string
{
    case New = 'new';
    case Read = 'read';
    case Replied = 'replied';
    case Closed = 'closed';
}
