<?php

namespace App\Providers;

use App\Models\Inquiry;
use App\Models\Property;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('view-dashboard', fn (User $user) => ! $user->isApplicant());

        // Marketplace moderation. Staff can read; only admins and housing officers can act.
        Gate::define('view-moderation', fn (User $user) => ! $user->isApplicant());
        Gate::define('moderate-listings', fn (User $user) => $user->isSuperAdmin() || $user->isHousingOfficer());

        // Anonymous reports and messages are the easiest things to abuse, so they are limited per visitor.
        RateLimiter::for('listing-reports', fn (Request $request) => Limit::perHour(5)
            ->by($request->user('sanctum')?->id ?? $request->ip()));
        RateLimiter::for('inquiries', fn (Request $request) => Limit::perHour(8)
            ->by($request->user('sanctum')?->id ?? $request->ip()));

        // Public marketplace URLs: a draft, pending or archived listing (or a soft-deleted one)
        // must look exactly like a slug that does not exist.
        Route::bind('publishedProperty', fn (string $slug) => Property::query()
            ->published()
            ->where('slug', $slug)
            ->firstOrFail());

        // A landlord's own listing, in any state. Someone else's listing answers 404 rather than 403,
        // so slugs of drafts cannot be probed. `{image}` is likewise only found under its listing.
        Route::bind('landlordProperty', fn (string $slug, $route) => Property::query()
            ->where('slug', $slug)
            ->whereHas('owner', fn ($owner) => $owner->where('user_id', request()->user()?->id))
            ->firstOrFail());

        // An inquiry about one of the signed-in landlord's own listings; anything else is a 404.
        Route::bind('landlordInquiry', fn (string $id) => Inquiry::query()
            ->whereKey($id)
            ->whereHas('property', fn ($property) => $property->withTrashed()
                ->whereHas('owner', fn ($owner) => $owner->where('user_id', request()->user()?->id)))
            ->firstOrFail());

        // Any listing (not deleted), for staff review.
        Route::bind('moderationProperty', fn (string $slug) => Property::query()
            ->where('slug', $slug)
            ->firstOrFail());
    }
}
