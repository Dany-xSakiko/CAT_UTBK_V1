<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PenggunaController;
use App\Http\Controllers\ProctoringController;
use App\Http\Controllers\RekamController;
use App\Http\Controllers\SoalController;
use App\Http\Controllers\StatistikController;
use App\Http\Controllers\UjianController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Sistem CAT UTBK
|--------------------------------------------------------------------------
| Base URL (dev): http://localhost:8000/api
| Auth: Bearer token (Laravel Sanctum)
*/

// ---------- Auth ----------
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ---------- Ujian ----------
    Route::get('/ujian', [UjianController::class, 'index']);
    Route::get('/ujian/{id}', [UjianController::class, 'show']);
    Route::post('/ujian/{id}/mulai', [UjianController::class, 'mulai'])
        ->middleware('role:Peserta');

    Route::middleware('role:Admin')->group(function () {
        Route::post('/ujian', [UjianController::class, 'store']);
        Route::put('/ujian/{id}', [UjianController::class, 'update']);
        Route::delete('/ujian/{id}', [UjianController::class, 'destroy']);

        // ---------- Soal ----------
        Route::get('/soal', [SoalController::class, 'index']);
        Route::post('/soal', [SoalController::class, 'store']);
        Route::put('/soal/{id}', [SoalController::class, 'update']);
        Route::delete('/soal/{id}', [SoalController::class, 'destroy']);

        // ---------- Pengguna ----------
        Route::get('/pengguna', [PenggunaController::class, 'index']);
        Route::post('/pengguna', [PenggunaController::class, 'store']);
        Route::put('/pengguna/{id}', [PenggunaController::class, 'update']);
        Route::delete('/pengguna/{id}', [PenggunaController::class, 'destroy']);

        // ---------- Statistik & laporan ----------
        Route::get('/admin/statistik/ringkasan', [StatistikController::class, 'ringkasan']);
        Route::get('/admin/statistik/distribusi', [StatistikController::class, 'distribusi']);
        Route::get('/admin/statistik/peserta', [StatistikController::class, 'perPeserta']);

        // laporan proctoring (warisan controller lama, 3 varian query)
        Route::get('/admin/laporan/proctoring/eloquent', [AdminDashboardController::class, 'getLaporanProctoringEloquent']);
        Route::get('/admin/laporan/proctoring/raw', [AdminDashboardController::class, 'getLaporanProctoringRawSQL']);
        Route::get('/admin/laporan/proctoring/builder', [AdminDashboardController::class, 'getLaporanProctoringQueryBuilder']);
        Route::get('/admin/laporan/pelanggaran/eloquent', [AdminDashboardController::class, 'getLaporanPelanggaranEloquent']);
        Route::get('/admin/laporan/pelanggaran/raw', [AdminDashboardController::class, 'getLaporanPelanggaranRawSQL']);
        Route::get('/admin/statistik/pelanggaran', [AdminDashboardController::class, 'getStatistikPelanggaranPerPeserta']);
        Route::get('/admin/peserta/{idUser}/logs', [AdminDashboardController::class, 'getLaporanDetailPeserta']);
    });

    // ---------- Pengerjaan ujian ----------
    Route::get('/rekam/{id}', [RekamController::class, 'show']);
    Route::post('/rekam/{id}/jawab', [RekamController::class, 'jawab']);
    Route::post('/rekam/{id}/selesai', [RekamController::class, 'selesai']);

    // ---------- Proctoring ----------
    Route::post('/proctoring/log', [ProctoringController::class, 'insertLog']);
    Route::post('/proctoring/log/base64', [ProctoringController::class, 'insertLogBase64']);
    Route::get('/proctoring/logs/{idRekamJejak}', [ProctoringController::class, 'getLogsByRekamJejak']);
});
