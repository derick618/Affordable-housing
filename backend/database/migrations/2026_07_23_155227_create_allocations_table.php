<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('allocated_by')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['offered', 'accepted', 'declined', 'confirmed', 'cancelled'])
                ->default('offered');
            $table->timestamp('offer_expires_at')->nullable();
            $table->date('move_in_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('allocations');
    }
};
