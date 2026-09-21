<?php

use App\Http\Controllers\AffordabilityProfileController;
use App\Http\Controllers\AllocationController;
use App\Http\Controllers\AmenityController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HousingProjectController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\LandlordProfileController;
use App\Http\Controllers\LandlordPropertyController;
use App\Http\Controllers\ListingReportController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\PropertyImageController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public marketplace (read-only). Deliberately outside the auth:sanctum group below.
// `publishedProperty` is bound in AppServiceProvider and only resolves published listings.
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{publishedProperty}', [PropertyController::class, 'show']);
Route::get('/properties/{publishedProperty}/similar', [PropertyController::class, 'similar']);
Route::get('/locations', [LocationController::class, 'index']);
Route::get('/amenities', [AmenityController::class, 'index']);
// The only writes open to visitors. Both are throttled per visitor.
Route::post('/properties/{publishedProperty}/reports', [ListingReportController::class, 'store'])
    ->middleware('throttle:listing-reports');
Route::post('/properties/{publishedProperty}/inquiries', [InquiryController::class, 'store'])
    ->middleware('throttle:inquiries');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Landlord tools: the signed-in user's own profile and listings.
    Route::get('/landlord/profile', [LandlordProfileController::class, 'show']);
    Route::put('/landlord/profile', [LandlordProfileController::class, 'upsert']);
    Route::get('/landlord/properties', [LandlordPropertyController::class, 'index']);
    Route::post('/landlord/properties', [LandlordPropertyController::class, 'store']);
    Route::get('/landlord/properties/{landlordProperty}', [LandlordPropertyController::class, 'show']);
    Route::patch('/landlord/properties/{landlordProperty}', [LandlordPropertyController::class, 'update']);
    Route::delete('/landlord/properties/{landlordProperty}', [LandlordPropertyController::class, 'destroy']);
    Route::post('/landlord/properties/{landlordProperty}/submit', [LandlordPropertyController::class, 'submit']);
    Route::post('/landlord/properties/{landlordProperty}/withdraw', [LandlordPropertyController::class, 'withdraw']);
    Route::post('/landlord/properties/{landlordProperty}/archive', [LandlordPropertyController::class, 'archive']);
    Route::post('/landlord/properties/{landlordProperty}/reopen', [LandlordPropertyController::class, 'reopen']);
    Route::post('/landlord/properties/{landlordProperty}/images', [PropertyImageController::class, 'store']);
    Route::put('/landlord/properties/{landlordProperty}/images/order', [PropertyImageController::class, 'reorder']);
    Route::patch('/landlord/properties/{landlordProperty}/images/{image}', [PropertyImageController::class, 'update'])
        ->whereNumber('image');
    Route::delete('/landlord/properties/{landlordProperty}/images/{image}', [PropertyImageController::class, 'destroy'])
        ->whereNumber('image');

    Route::get('/landlord/inquiries', [InquiryController::class, 'index']);
    Route::patch('/landlord/inquiries/{landlordInquiry}', [InquiryController::class, 'update'])->whereNumber('landlordInquiry');

    // The renter's own budget and preferences.
    Route::get('/profile/affordability', [AffordabilityProfileController::class, 'show']);
    Route::put('/profile/affordability', [AffordabilityProfileController::class, 'upsert']);
    Route::delete('/profile/affordability', [AffordabilityProfileController::class, 'destroy']);

    // Marketplace moderation (staff).
    Route::get('/moderation/properties', [ModerationController::class, 'properties']);
    Route::get('/moderation/properties/{moderationProperty}', [ModerationController::class, 'show']);
    Route::post('/moderation/properties/{moderationProperty}/approve', [ModerationController::class, 'approve']);
    Route::post('/moderation/properties/{moderationProperty}/reject', [ModerationController::class, 'reject']);
    Route::get('/moderation/owners', [ModerationController::class, 'owners']);
    Route::post('/moderation/owners/{owner}/verify', [ModerationController::class, 'verifyOwner']);
    Route::delete('/moderation/owners/{owner}/verify', [ModerationController::class, 'unverifyOwner']);
    Route::get('/listing-reports', [ListingReportController::class, 'index']);
    Route::patch('/listing-reports/{listingReport}', [ListingReportController::class, 'update']);

    // Saved listings for the signed-in user (marketplace).
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::get('/favorites/slugs', [FavoriteController::class, 'slugs']);
    Route::post('/favorites/sync', [FavoriteController::class, 'sync']);
    Route::put('/favorites/{publishedProperty}', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{slug}', [FavoriteController::class, 'destroy']);

    Route::apiResource('housing-projects', HousingProjectController::class);
    Route::apiResource('housing-projects.units', UnitController::class)->shallow();

    Route::apiResource('applications', ApplicationController::class);
    Route::patch('applications/{application}/review', [ApplicationController::class, 'review']);

    Route::apiResource('allocations', AllocationController::class)->except(['update']);
    Route::patch('allocations/{allocation}/respond', [AllocationController::class, 'respond']);
    Route::patch('allocations/{allocation}/confirm', [AllocationController::class, 'confirm']);

    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update']);
});
