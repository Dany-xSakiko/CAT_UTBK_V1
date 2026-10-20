<?php

namespace App\Http\Controllers;

use App\Models\LogProctoring;
use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * ============================================
     * QUERY SQL MURNI (Raw SQL)
     * ============================================
     * 
     * Menampilkan laporan log proctoring dengan JOIN
     * Urutkan dari kejadian terbaru (descending)
     */
    public function getLaporanProctoringRawSQL()
    {
        $sql = "
            SELECT 
                lp.id_log AS id_log,
                p.nama_lengkap AS nama_peserta,
                p.username AS username_peserta,
                lp.timestamp AS waktu_kejadian,
                lp.jenis_pelanggaran AS jenis_pelanggaran,
                lp.bukti_screenshot AS path_bukti,
                CONCAT(?, lp.bukti_screenshot) AS url_bukti,
                lp.keterangan AS keterangan,
                u.judul_mata_kuliah AS mata_kuliah,
                rj.skor_akhir AS skor
            FROM log_proctoring lp
            INNER JOIN pengguna p 
                ON lp.id_user = p.id_user
            INNER JOIN rekam_jejak rj 
                ON lp.id_rekam_jejak = rj.id_rekam_jejak
            INNER JOIN ujian u 
                ON rj.id_ujian = u.id_ujian
            ORDER BY lp.timestamp DESC
        ";

        $baseUrl = asset('storage/');
        
        $results = DB::select($sql, [$baseUrl]);

        return response()->json([
            'success' => true,
            'message' => 'Data laporan berhasil diambil (Raw SQL)',
            'data' => $results
        ]);
    }

    /**
     * ============================================
     * QUERY SQL MURNI dengan Filter
     * ============================================
     * 
     * Menampilkan laporan hanya pelanggaran (bukan Normal)
     */
    public function getLaporanPelanggaranRawSQL()
    {
        $sql = "
            SELECT 
                lp.id_log,
                p.nama_lengkap AS nama_peserta,
                p.username,
                lp.timestamp AS waktu_kejadian,
                lp.jenis_pelanggaran,
                lp.bukti_screenshot AS path_bukti,
                CONCAT(?, lp.bukti_screenshot) AS url_bukti,
                u.judul_mata_kuliah,
                rj.skor_akhir
            FROM log_proctoring lp
            INNER JOIN pengguna p ON lp.id_user = p.id_user
            INNER JOIN rekam_jejak rj ON lp.id_rekam_jejak = rj.id_rekam_jejak
            INNER JOIN ujian u ON rj.id_ujian = u.id_ujian
            WHERE lp.jenis_pelanggaran IN ('No Face', 'Multiple Faces', 'Looking Away', 'Suspicious Activity')
            ORDER BY lp.timestamp DESC
        ";

        $baseUrl = asset('storage/');
        $results = DB::select($sql, [$baseUrl]);

        return response()->json([
            'success' => true,
            'message' => 'Data pelanggaran berhasil diambil (Raw SQL)',
            'data' => $results
        ]);
    }

    /**
     * ============================================
     * QUERY ELOQUENT ORM
     * ============================================
     * 
     * Menampilkan laporan log proctoring dengan relasi Eloquent
     */
    public function getLaporanProctoringEloquent()
    {
        $logs = LogProctoring::with(['pengguna', 'rekamJejak.ujian'])
            ->orderBy('timestamp', 'desc')
            ->get()
            ->map(function($log) {
                return [
                    'id_log' => $log->id_log,
                    'nama_peserta' => $log->pengguna->nama_lengkap,
                    'username_peserta' => $log->pengguna->username,
                    'waktu_kejadian' => $log->timestamp->format('Y-m-d H:i:s'),
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'path_bukti' => $log->bukti_screenshot,
                    'url_bukti' => $log->screenshot_url,
                    'keterangan' => $log->keterangan,
                    'mata_kuliah' => $log->rekamJejak->ujian->judul_mata_kuliah,
                    'skor' => $log->rekamJejak->skor_akhir,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Data laporan berhasil diambil (Eloquent ORM)',
            'data' => $logs
        ]);
    }

    /**
     * ============================================
     * QUERY ELOQUENT ORM dengan Filter Pelanggaran
     * ============================================
     */
    public function getLaporanPelanggaranEloquent()
    {
        $logs = LogProctoring::with(['pengguna', 'rekamJejak.ujian'])
            ->pelanggaran() // menggunakan scope dari model
            ->orderBy('timestamp', 'desc')
            ->get()
            ->map(function($log) {
                return [
                    'id_log' => $log->id_log,
                    'nama_peserta' => $log->pengguna->nama_lengkap,
                    'username' => $log->pengguna->username,
                    'waktu_kejadian' => $log->timestamp->format('Y-m-d H:i:s'),
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'url_bukti' => $log->screenshot_url,
                    'mata_kuliah' => $log->rekamJejak->ujian->judul_mata_kuliah,
                    'skor' => $log->rekamJejak->skor_akhir,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Data pelanggaran berhasil diambil (Eloquent ORM)',
            'data' => $logs
        ]);
    }

    /**
     * ============================================
     * QUERY ELOQUENT ORM dengan Query Builder
     * ============================================
     * 
     * Alternative menggunakan DB facade dengan query builder
     */
    public function getLaporanProctoringQueryBuilder()
    {
        $logs = DB::table('log_proctoring as lp')
            ->join('pengguna as p', 'lp.id_user', '=', 'p.id_user')
            ->join('rekam_jejak as rj', 'lp.id_rekam_jejak', '=', 'rj.id_rekam_jejak')
            ->join('ujian as u', 'rj.id_ujian', '=', 'u.id_ujian')
            ->select(
                'lp.id_log',
                'p.nama_lengkap as nama_peserta',
                'p.username',
                'lp.timestamp as waktu_kejadian',
                'lp.jenis_pelanggaran',
                'lp.bukti_screenshot as path_bukti',
                'lp.keterangan',
                'u.judul_mata_kuliah',
                'rj.skor_akhir as skor'
            )
            ->orderBy('lp.timestamp', 'desc')
            ->get()
            ->map(function($log) {
                return [
                    'id_log' => $log->id_log,
                    'nama_peserta' => $log->nama_peserta,
                    'username' => $log->username,
                    'waktu_kejadian' => $log->waktu_kejadian,
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'path_bukti' => $log->path_bukti,
                    'url_bukti' => $log->path_bukti ? asset('storage/' . $log->path_bukti) : null,
                    'keterangan' => $log->keterangan,
                    'mata_kuliah' => $log->judul_mata_kuliah,
                    'skor' => $log->skor,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Data laporan berhasil diambil (Query Builder)',
            'data' => $logs
        ]);
    }

    /**
     * ============================================
     * STATISTIK PELANGGARAN PER PESERTA
     * ============================================
     */
    public function getStatistikPelanggaranPerPeserta()
    {
        // Raw SQL
        $sqlRaw = "
            SELECT 
                p.id_user,
                p.nama_lengkap,
                p.username,
                COUNT(CASE WHEN lp.jenis_pelanggaran = 'No Face' THEN 1 END) as total_no_face,
                COUNT(CASE WHEN lp.jenis_pelanggaran = 'Multiple Faces' THEN 1 END) as total_multiple_faces,
                COUNT(CASE WHEN lp.jenis_pelanggaran = 'Looking Away' THEN 1 END) as total_looking_away,
                COUNT(CASE WHEN lp.jenis_pelanggaran = 'Suspicious Activity' THEN 1 END) as total_suspicious,
                COUNT(CASE WHEN lp.jenis_pelanggaran != 'Normal' THEN 1 END) as total_pelanggaran
            FROM pengguna p
            LEFT JOIN log_proctoring lp ON p.id_user = lp.id_user
            WHERE p.role = 'Peserta'
            GROUP BY p.id_user, p.nama_lengkap, p.username
            HAVING total_pelanggaran > 0
            ORDER BY total_pelanggaran DESC
        ";

        $resultRaw = DB::select($sqlRaw);

        // Eloquent
        $resultEloquent = Pengguna::peserta()
            ->withCount([
                'logProctoring as total_no_face' => function($query) {
                    $query->where('jenis_pelanggaran', 'No Face');
                },
                'logProctoring as total_multiple_faces' => function($query) {
                    $query->where('jenis_pelanggaran', 'Multiple Faces');
                },
                'logProctoring as total_looking_away' => function($query) {
                    $query->where('jenis_pelanggaran', 'Looking Away');
                },
                'logProctoring as total_suspicious' => function($query) {
                    $query->where('jenis_pelanggaran', 'Suspicious Activity');
                },
                'logProctoring as total_pelanggaran' => function($query) {
                    $query->where('jenis_pelanggaran', '!=', 'Normal');
                }
            ])
            ->having('total_pelanggaran', '>', 0)
            ->orderBy('total_pelanggaran', 'desc')
            ->get()
            ->map(function($peserta) {
                return [
                    'id_user' => $peserta->id_user,
                    'nama_lengkap' => $peserta->nama_lengkap,
                    'username' => $peserta->username,
                    'total_no_face' => $peserta->total_no_face,
                    'total_multiple_faces' => $peserta->total_multiple_faces,
                    'total_looking_away' => $peserta->total_looking_away,
                    'total_suspicious' => $peserta->total_suspicious,
                    'total_pelanggaran' => $peserta->total_pelanggaran,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Statistik pelanggaran per peserta',
            'data' => [
                'raw_sql' => $resultRaw,
                'eloquent' => $resultEloquent
            ]
        ]);
    }

    /**
     * ============================================
     * LAPORAN DETAIL SATU PESERTA
     * ============================================
     */
    public function getLaporanDetailPeserta($idUser)
    {
        // Validasi peserta
        $peserta = Pengguna::where('id_user', $idUser)
                          ->where('role', 'Peserta')
                          ->first();

        if (!$peserta) {
            return response()->json([
                'success' => false,
                'message' => 'Peserta tidak ditemukan'
            ], 404);
        }

        // Get semua log peserta ini
        $logs = LogProctoring::with(['rekamJejak.ujian'])
            ->where('id_user', $idUser)
            ->orderBy('timestamp', 'desc')
            ->get()
            ->map(function($log) {
                return [
                    'id_log' => $log->id_log,
                    'waktu_kejadian' => $log->timestamp->format('Y-m-d H:i:s'),
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'url_bukti' => $log->screenshot_url,
                    'mata_kuliah' => $log->rekamJejak->ujian->judul_mata_kuliah,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'peserta' => [
                    'id_user' => $peserta->id_user,
                    'nama_lengkap' => $peserta->nama_lengkap,
                    'username' => $peserta->username,
                    'email' => $peserta->email,
                ],
                'total_log' => $logs->count(),
                'total_pelanggaran' => $logs->where('jenis_pelanggaran', '!=', 'Normal')->count(),
                'logs' => $logs
            ]
        ]);
    }
}
