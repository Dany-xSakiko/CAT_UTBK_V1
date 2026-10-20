<?php

namespace App\Http\Controllers;

use App\Models\JawabanPeserta;
use App\Models\LogProctoring;
use App\Models\Pengguna;
use App\Models\RekamJejak;
use App\Models\Soal;
use App\Models\Ujian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatistikController extends Controller
{
    /** GET /api/admin/statistik/ringkasan — angka kartu dashboard admin */
    public function ringkasan()
    {
        $rataSkor = RekamJejak::whereNotNull('skor_akhir')->avg('skor_akhir');

        return response()->json([
            'success' => true,
            'data'    => [
                'total_peserta'      => Pengguna::where('role', 'Peserta')->count(),
                'total_admin'        => Pengguna::where('role', 'Admin')->count(),
                'total_ujian'        => Ujian::count(),
                'ujian_aktif'        => Ujian::where('status_aktif', true)->count(),
                'total_soal'         => Soal::count(),
                'total_pelanggaran'  => LogProctoring::where('jenis_pelanggaran', '!=', 'Normal')->count(),
                'total_sesi'         => RekamJejak::count(),
                'sesi_selesai'       => RekamJejak::where('status_pengerjaan', 'selesai')->count(),
                'rata_rata_skor'     => $rataSkor !== null ? round((float) $rataSkor, 2) : 0,
            ],
        ]);
    }

    /** GET /api/admin/statistik/distribusi — jumlah log per jenis pelanggaran */
    public function distribusi()
    {
        $rows = LogProctoring::select('jenis_pelanggaran', DB::raw('COUNT(*) as jumlah'))
            ->groupBy('jenis_pelanggaran')
            ->orderByDesc('jumlah')
            ->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /** GET /api/admin/statistik/peserta — rekap per peserta (untuk tabel laporan) */
    public function perPeserta()
    {
        $rows = Pengguna::where('role', 'Peserta')
            ->withCount(['rekamJejak as jumlah_ujian'])
            ->get()
            ->map(function (Pengguna $p) {
                $pelanggaran = LogProctoring::where('id_user', $p->id_user)
                    ->where('jenis_pelanggaran', '!=', 'Normal')
                    ->count();

                $skor = RekamJejak::where('id_user', $p->id_user)
                    ->whereNotNull('skor_akhir')
                    ->pluck('skor_akhir');

                return [
                    'id_user'      => $p->id_user,
                    'nama_lengkap' => $p->nama_lengkap,
                    'username'     => $p->username,
                    'jumlah_ujian' => $p->jumlah_ujian,
                    'pelanggaran'  => $pelanggaran,
                    'rata_skor'    => $skor->count() ? round((float) $skor->avg(), 2) : 0,
                    'skor_terakhir'=> $skor->count() ? (float) $skor->last() : null,
                ];
            })
            ->sortByDesc('pelanggaran')
            ->values();

        return response()->json(['success' => true, 'data' => $rows]);
    }
}
