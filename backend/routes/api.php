<?php

use App\Http\Controllers\AllocationController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HousingProjectController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('housing-projects', HousingProjectController::class);
    Route::apiResource('housing-projects.units', UnitController::class)->shallow();

    Route::apiResource('applications', ApplicationController::class);
    Route::patch('applications/{application}/review', [ApplicationController::class, 'review']);

    Route::apiResource('allocations', AllocationController::class)->except(['update']);
    Route::patch('allocations/{allocation}/respond', [AllocationController::class, 'respond']);
    Route::patch('allocations/{allocation}/confirm', [AllocationController::class, 'confirm']);

    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update']);
});
