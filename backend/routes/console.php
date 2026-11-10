<?php

use App\Services\PenilaianService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('ujian:tutup-kedaluwarsa', function (PenilaianService $penilaian) {
    $n = $penilaian->tutupSemuaKedaluwarsa();
    $this->info("Sesi kedaluwarsa yang ditutup: {$n}");
})->purpose('Menutup otomatis sesi ujian yang sudah melewati batas waktu & menghitung skornya');

Schedule::command('ujian:tutup-kedaluwarsa')->everyMinute();
