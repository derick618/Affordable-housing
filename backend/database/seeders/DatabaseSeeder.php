<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->role('super_admin')->create([
            'name' => 'Super Admin',
            'email' => 'admin@affordablehousing.test',
        ]);

        User::factory()->role('housing_officer')->create([
            'name' => 'Housing Officer',
            'email' => 'officer@affordablehousing.test',
        ]);

        User::factory()->role('auditor')->create([
            'name' => 'Auditor',
            'email' => 'auditor@affordablehousing.test',
        ]);

        User::factory()->role('applicant')->create([
            'name' => 'Applicant',
            'email' => 'applicant@affordablehousing.test',
        ]);
    }
}
