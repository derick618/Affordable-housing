<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A visitor's message to a listing's owner. The owner's own phone number is never given to
     * the visitor; instead the visitor's details are given to the owner (through their dashboard).
     * Anyone may send one, so `user_id` is optional.
     */
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('name', 120);
            $table->string('phone', 30);
            $table->string('email', 160)->nullable();
            $table->string('preferred_contact', 20)->default('phone');
            $table->text('message');

            $table->string('status', 20)->default('new');
            $table->timestamp('read_at')->nullable();
            // sha256(ip + app key): lets us collapse repeat messages without storing raw addresses.
            $table->char('sender_hash', 64)->nullable();
            $table->timestamps();

            $table->index(['property_id', 'status', 'created_at']);
            $table->index(['property_id', 'sender_hash'], 'inquiries_dedupe_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
