<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Demo image bridge
    |--------------------------------------------------------------------------
    |
    | property_images rows on the `demo` disk are photos that the React app serves from
    | /images/<path>.jpg (and <path>-sm.jpg for the 640px variant). This is the base URL
    | they are served from. It goes away once photos live in real storage.
    |
    */

    'demo_image_base_url' => env(
        'MARKETPLACE_DEMO_IMAGE_BASE_URL',
        rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/').'/images'
    ),

    /*
    |--------------------------------------------------------------------------
    | Listing pagination
    |--------------------------------------------------------------------------
    */

    'pagination' => [
        'default_per_page' => 12,
        'max_per_page' => 50,
    ],

    /*
    |--------------------------------------------------------------------------
    | Similar properties
    |--------------------------------------------------------------------------
    |
    | A candidate scores +3 for the same city (or nearest shared area), +2 for the same
    | type, +2 for a rent within `price_tolerance` of the source rent and +1 if available.
    |
    */

    'similar' => [
        'default_limit' => 3,
        'max_limit' => 12,
        'price_tolerance' => 0.35,
    ],

    /*
    |--------------------------------------------------------------------------
    | Uploaded listing photos
    |--------------------------------------------------------------------------
    |
    | Every upload is re-encoded as a JPEG (which also strips EXIF data such as GPS position)
    | and stored twice: `name.jpg` (at most `full_width` px wide) and `name-sm.jpg`
    | (`thumb_width` px, for cards). Needs PHP's GD extension.
    |
    */

    'images' => [
        'disk' => env('MARKETPLACE_IMAGE_DISK', 'marketplace'),
        'max_per_listing' => 12,
        'max_upload_kb' => 5120,
        'max_files_per_request' => 8,
        'min_width' => 600,
        'min_height' => 400,
        'max_dimension' => 5000,
        'full_width' => 1200,
        'thumb_width' => 640,
    ],

    /*
    |--------------------------------------------------------------------------
    | Favourites
    |--------------------------------------------------------------------------
    */

    'favorites' => [
        'max' => 200,
    ],

];
