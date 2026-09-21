<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reports about marketplace listings ("this looks like a scam"). Anyone may file one, so
     * `user_id` is optional. Reports are evidence, so a listing with reports cannot be hard-deleted.
     */
    public function up(): void
    {
        Schema::create('listing_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('reason', 30);
            $table->text('details')->nullable();
            // Optional way for the team to follow up (phone or email), never shown publicly.
            $table->string('contact', 120)->nullable();

            $table->string('status', 20)->default('open');
            // sha256(ip + app key). Lets us collapse repeat reports without storing raw addresses.
            $table->char('reporter_hash', 64)->nullable();

            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('handled_at')->nullable();
            $table->text('staff_note')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['property_id', 'status']);
            $table->index(['property_id', 'reporter_hash', 'reason'], 'listing_reports_dedupe_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_reports');
    }
};
