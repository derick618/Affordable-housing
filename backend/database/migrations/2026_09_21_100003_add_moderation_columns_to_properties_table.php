<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Review trail for landlord-submitted listings. Additive and nullable, so the demo
     * listings (which were never submitted or reviewed) are unaffected.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->timestamp('submitted_at')->nullable()->after('published_at');
            $table->foreignId('reviewed_by')->nullable()->after('submitted_at')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            // Why a listing was sent back, shown to the landlord.
            $table->text('moderation_note')->nullable()->after('reviewed_at');

            $table->index(['publication_status', 'submitted_at'], 'properties_review_queue_idx');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex('properties_review_queue_idx');
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['submitted_at', 'reviewed_at', 'moderation_note']);
        });
    }
};
