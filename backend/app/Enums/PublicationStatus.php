<?php

namespace App\Enums;

/** Moderation / visibility of the listing. Only `published` listings appear in the public API. */
enum PublicationStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Published = 'published';
    case Archived = 'archived';
}
