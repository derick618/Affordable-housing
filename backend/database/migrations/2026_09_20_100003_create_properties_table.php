<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Marketplace listings. Deliberately separate from `units`, which belong to the
     * allocation workflow. Status-like columns are plain strings validated by PHP enums
     * (no MySQL ENUM), and only portable column types are used so the same migration runs
     * on MySQL and on the in-memory SQLite used by the tests.
     */
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->constrained()->restrictOnDelete();

            // Public, immutable URL key.
            $table->string('slug', 160)->unique();
            $table->string('title', 160);
            $table->string('summary', 200)->nullable();
            $table->text('description')->nullable();

            $table->string('property_type', 20);

            // Whole TZS. `currency` is kept so the model is not hard-wired to one currency.
            $table->unsignedInteger('monthly_rent');
            $table->char('currency', 3)->default('TZS');
            $table->unsignedTinyInteger('rent_advance_months')->default(1);

            $table->unsignedTinyInteger('bedrooms');
            $table->unsignedTinyInteger('bathrooms');
            $table->unsignedSmallInteger('size_sqm')->nullable();
            $table->string('furnishing', 20)->default('unfurnished');

            $table->string('address_line')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Utilities: original wording plus flags that matter for total monthly cost.
            $table->string('water_details')->nullable();
            $table->string('power_details')->nullable();
            $table->boolean('water_included')->default(false);
            $table->boolean('power_included')->default(false);

            // Display-only list of {kind, text} entries; not filtered on, so JSON is enough.
            $table->json('nearby')->nullable();

            $table->string('availability_status', 20)->default('available');
            $table->date('available_from')->nullable();
            $table->string('publication_status', 20)->default('draft');

            $table->boolean('featured')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Planned marketplace queries.
            $table->index(['publication_status', 'availability_status', 'monthly_rent'], 'properties_listing_idx');
            $table->index(['location_id', 'property_type'], 'properties_location_type_idx');
            $table->index(['property_type', 'bedrooms'], 'properties_type_bedrooms_idx');
            $table->index(['featured', 'published_at'], 'properties_featured_idx');
            $table->index('is_demo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
