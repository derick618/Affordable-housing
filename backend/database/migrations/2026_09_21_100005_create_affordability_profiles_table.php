<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * What a signed-in renter can afford and wants. It only stores preferences: nothing here
     * ranks, filters or scores listings, and it is private to the user.
     */
    public function up(): void
    {
        Schema::create('affordability_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('monthly_budget')->nullable();
            $table->unsignedTinyInteger('household_size')->nullable();
            $table->unsignedTinyInteger('min_bedrooms')->nullable();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->json('property_types')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affordability_profiles');
    }
};
