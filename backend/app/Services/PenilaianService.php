<?php

namespace App\Services;

use App\Models\JawabanPeserta;
use App\Models\RekamJejak;
use App\Models\Soal;
use Illuminate\Support\Facades\DB;

/**
 * Satu-satunya tempat menghitung skor & menutup sesi ujian.
 * Dipakai oleh: tombol "Selesai" peserta, auto-tutup sesi kedaluwarsa,
 * dan diskualifikasi oleh admin — supaya hasilnya selalu konsisten.
 */
class PenilaianService
{
    /**
     * Tutup sesi + hitung skor. Idempoten: sesi yang sudah ditutup tidak diubah.
     *
     * @param  string  $status  'selesai' | 'diskualifikasi'
     */
    public function tutup(RekamJejak $rekam, string $status = 'selesai'): RekamJejak
    {
        DB::transaction(function () use ($rekam, $status) {
            // kunci baris agar dua request "selesai" bersamaan tidak saling tumpuk
            $locked = RekamJejak::whereKey($rekam->getKey())->lockForUpdate()->first();
            if (! $locked) {
                return;
            }

            $bolehUbah = $locked->status_pengerjaan === 'sedang_mengerjakan'
                || ($status === 'diskualifikasi' && $locked->status_pengerjaan === 'selesai');
            if (! $bolehUbah) {
                return;
            }

            $kunci = Soal::where('id_ujian', $locked->id_ujian)->pluck('kunci_jawaban', 'id_soal');
            $totalSoal = $kunci->count();

            // sinkronkan status benar/salah dengan kunci terbaru (kunci bisa diedit admin)
            $benar = 0;
            JawabanPeserta::where('id_rekam_jejak', $locked->id_rekam_jejak)->get()
                ->each(function (JawabanPeserta $j) use ($kunci, &$benar) {
                    $isBenar = $kunci->has($j->id_soal) && $j->jawaban_dipilih === $kunci[$j->id_soal];
                    if ((bool) $j->status_benar_salah !== $isBenar) {
                        $j->update(['status_benar_salah' => $isBenar]);
                    }
                    $benar += $isBenar ? 1 : 0;
                });

            // waktu selesai tidak boleh melewati deadline (untuk sesi yang ditutup otomatis)
            $selesaiPada = now();
            $deadline = $locked->deadline();
            if ($status === 'selesai' && $deadline && $selesaiPada->gt($deadline)) {
                $selesaiPada = $deadline;
            }

            $locked->update([
                'waktu_selesai'     => $locked->waktu_selesai ?? $selesaiPada,
                'total_soal'        => $totalSoal,
                'total_benar'       => $benar,
                'total_salah'       => max(0, $totalSoal - $benar),
                'skor_akhir'        => $totalSoal > 0 ? round($benar / $totalSoal * 100, 2) : 0,
                'status_pengerjaan' => $status,
            ]);
        });

        return $rekam->refresh();
    }

    /** Tutup sesi bila deadline sudah lewat. Return true jika ada yang ditutup. */
    public function tutupJikaKedaluwarsa(RekamJejak $rekam): bool
    {
        if ($rekam->sedangBerjalan() && $rekam->lewatDeadline()) {
            $this->tutup($rekam);

            return true;
        }

        return false;
    }

    /** Tutup semua sesi kedaluwarsa (dipanggil scheduler). Return jumlah sesi. */
    public function tutupSemuaKedaluwarsa(): int
    {
        $n = 0;
        RekamJejak::with('ujian')
            ->where('status_pengerjaan', 'sedang_mengerjakan')
            ->chunkById(200, function ($rows) use (&$n) {
                foreach ($rows as $rekam) {
                    $n += $this->tutupJikaKedaluwarsa($rekam) ? 1 : 0;
                }
            }, 'id_rekam_jejak');

        return $n;
    }
}
