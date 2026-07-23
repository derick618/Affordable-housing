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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('housing_project_id')->constrained()->cascadeOnDelete();
            $table->string('unit_number');
            $table->string('block')->nullable();
            $table->unsignedSmallInteger('floor')->nullable();
            $table->unsignedTinyInteger('bedrooms');
            $table->decimal('size_sqm', 8, 2)->nullable();
            $table->enum('ownership_type', ['rent', 'sale'])->default('sale');
            $table->decimal('price', 12, 2);
            $table->enum('status', ['available', 'reserved', 'allocated', 'occupied', 'maintenance'])
                ->default('available');
            $table->timestamps();

            $table->unique(['housing_project_id', 'unit_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
