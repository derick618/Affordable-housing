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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['applicant', 'housing_officer', 'super_admin', 'auditor'])
                ->default('applicant')
                ->after('email');
            $table->string('phone')->nullable()->after('role');
            $table->string('national_id')->nullable()->unique()->after('phone');
            $table->string('address')->nullable()->after('national_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'national_id', 'address']);
        });
    }
};
