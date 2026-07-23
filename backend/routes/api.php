<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\HousingProjectController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::apiResource('housing-projects', HousingProjectController::class);
    Route::apiResource('housing-projects.units', UnitController::class)->shallow();
});
