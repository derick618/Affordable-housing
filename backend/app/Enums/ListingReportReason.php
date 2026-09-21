<?php

namespace App\Enums;

/** Why a visitor reported a listing. The wording shown to people lives in the frontend. */
enum ListingReportReason: string
{
    case Scam = 'scam';
    case Misrepresented = 'misrepresented';
    case AlreadyRented = 'already_rented';
    case WrongDetails = 'wrong_details';
    case Other = 'other';
}
