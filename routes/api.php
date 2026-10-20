<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProctoringController;
use App\Http\Controllers\AdminDashboardController;

/*
|--------------------------------------------------------------------------
| API Routes untuk Sistem CAT
|--------------------------------------------------------------------------
*/

// ============================================
// ROUTES PROCTORING
// ============================================

// Insert log proctoring (dipanggil dari frontend setiap 3 detik)
Route::post('/proctoring/log', [ProctoringController::class, 'insertLog'])
    ->name('proctoring.insertLog');

// Insert log dengan base64 screenshot (alternative)
Route::post('/proctoring/log/base64', [ProctoringController::class, 'insertLogBase64'])
    ->name('proctoring.insertLogBase64');

// Get logs untuk satu rekam jejak
Route::get('/proctoring/logs/{idRekamJejak}', [ProctoringController::class, 'getLogsByRekamJejak'])
    ->name('proctoring.getLogs');


// ============================================
// ROUTES ADMIN DASHBOARD
// ============================================

// Laporan lengkap (Raw SQL)
Route::get('/admin/laporan/proctoring/raw', [AdminDashboardController::class, 'getLaporanProctoringRawSQL'])
    ->name('admin.laporan.raw');

// Laporan pelanggaran saja (Raw SQL)
Route::get('/admin/laporan/pelanggaran/raw', [AdminDashboardController::class, 'getLaporanPelanggaranRawSQL'])
    ->name('admin.pelanggaran.raw');

// Laporan lengkap (Eloquent ORM)
Route::get('/admin/laporan/proctoring/eloquent', [AdminDashboardController::class, 'getLaporanProctoringEloquent'])
    ->name('admin.laporan.eloquent');

// Laporan pelanggaran (Eloquent ORM)
Route::get('/admin/laporan/pelanggaran/eloquent', [AdminDashboardController::class, 'getLaporanPelanggaranEloquent'])
    ->name('admin.pelanggaran.eloquent');

// Laporan dengan Query Builder
Route::get('/admin/laporan/proctoring/builder', [AdminDashboardController::class, 'getLaporanProctoringQueryBuilder'])
    ->name('admin.laporan.builder');

// Statistik pelanggaran per peserta
Route::get('/admin/statistik/pelanggaran', [AdminDashboardController::class, 'getStatistikPelanggaranPerPeserta'])
    ->name('admin.statistik.pelanggaran');

// Detail log satu peserta
Route::get('/admin/peserta/{idUser}/logs', [AdminDashboardController::class, 'getLaporanDetailPeserta'])
    ->name('admin.peserta.logs');
