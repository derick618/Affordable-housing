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
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('housing_project_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('household_size');
            $table->decimal('monthly_income', 12, 2);
            $table->string('employment_status')->nullable();
            $table->unsignedTinyInteger('preferred_bedrooms')->nullable();
            $table->enum('status', ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'])
                ->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
