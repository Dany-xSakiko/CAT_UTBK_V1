<?php

namespace App\Http\Controllers;

use App\Models\JawabanPeserta;
use App\Models\LogProctoring;
use App\Models\RekamJejak;
use App\Models\Soal;
use App\Models\Ujian;
use App\Services\PenilaianService;
use Illuminate\Http\Request;

class UjianController extends Controller
{
    public function __construct(private PenilaianService $penilaian) {}

    /** GET /api/ujian — admin lihat semua, peserta hanya yang aktif + riwayatnya */
    public function index(Request $request)
    {
        $user = $request->user();
        $isPeserta = $user->role === 'Peserta';

        $query = Ujian::query()
            ->withCount('soal as jumlah_soal')
            ->orderByDesc('tanggal')
            ->orderBy('waktu_mulai');

        if ($isPeserta) {
            $query->where('status_aktif', true);
        }

        $ujian = $query->get();
        $ids = $ujian->pluck('id_ujian');

        // agregat sekali jalan (menghindari N+1 query per ujian)
        $jumlahPeserta = RekamJejak::whereIn('id_ujian', $ids)
            ->selectRaw('id_ujian, COUNT(DISTINCT id_user) as n')
            ->groupBy('id_ujian')
            ->pluck('n', 'id_ujian');

        $rekamUser = RekamJejak::with('ujian')
            ->where('id_user', $user->id_user)
            ->whereIn('id_ujian', $ids)
            ->get()
            ->each(fn (RekamJejak $r) => $this->penilaian->tutupJikaKedaluwarsa($r))
            ->keyBy('id_ujian');

        $pelanggaran = LogProctoring::whereIn('id_rekam_jejak', $rekamUser->pluck('id_rekam_jejak'))
            ->where('jenis_pelanggaran', '!=', 'Normal')
            ->selectRaw('id_rekam_jejak, COUNT(*) as n')
            ->groupBy('id_rekam_jejak')
            ->pluck('n', 'id_rekam_jejak');

        $data = $ujian->map(function (Ujian $u) use ($jumlahPeserta, $rekamUser, $pelanggaran) {
            $row = $u->toArray();
            $row['jumlah_soal'] = (int) $u->jumlah_soal;
            $row['jumlah_peserta'] = (int) ($jumlahPeserta[$u->id_ujian] ?? 0);
            $row['status_jadwal'] = $u->statusJadwal();
            $row['jadwal_mulai'] = $u->jadwalMulai()->format('Y-m-d\TH:i:s');
            $row['jadwal_selesai'] = $u->jadwalSelesai()->format('Y-m-d\TH:i:s');

            $rekam = $rekamUser->get($u->id_ujian);
            $row['rekam'] = $rekam ? [
                'id_rekam_jejak'     => $rekam->id_rekam_jejak,
                'status_pengerjaan'  => $rekam->status_pengerjaan,
                'skor_akhir'         => $rekam->skor_akhir,
                'waktu_mulai'        => $rekam->waktu_mulai?->format('Y-m-d\TH:i:s'),
                'waktu_selesai'      => $rekam->waktu_selesai?->format('Y-m-d\TH:i:s'),
                'jumlah_pelanggaran' => (int) ($pelanggaran[$rekam->id_rekam_jejak] ?? 0),
            ] : null;

            return $row;
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/ujian/{id}
     * Admin: detail + daftar soal lengkap dengan kunci.
     * Peserta: hanya info ujian aktif (soal TIDAK dikirim supaya tidak bocor sebelum ujian).
     */
    public function show(Request $request, $id)
    {
        $ujian = Ujian::findOrFail($id);
        $isAdmin = $request->user()->role === 'Admin';

        if (! $isAdmin && ! $ujian->status_aktif) {
            return response()->json(['success' => false, 'message' => 'Ujian tidak ditemukan.'], 404);
        }

        $data = $ujian->toArray();
        $data['jumlah_soal'] = Soal::where('id_ujian', $ujian->id_ujian)->count();
        $data['maks_soal'] = SoalController::MAKS_SOAL;
        $data['status_jadwal'] = $ujian->statusJadwal();

        if ($isAdmin) {
            $data['soal'] = Soal::where('id_ujian', $ujian->id_ujian)
                ->orderBy('nomor_urut')
                ->get()
                ->map(fn (Soal $s) => $this->formatSoal($s, true));
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    /** POST /api/ujian (admin) */
    public function store(Request $request)
    {
        $data = $this->validasi($request);
        $ujian = Ujian::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Ujian berhasil dibuat.',
            'data'    => $ujian,
        ], 201);
    }

    /** PUT /api/ujian/{id} (admin) */
    public function update(Request $request, $id)
    {
        $ujian = Ujian::findOrFail($id);
        $ujian->update($this->validasi($request, $ujian->id_ujian));

        return response()->json([
            'success' => true,
            'message' => 'Ujian berhasil diperbarui.',
            'data'    => $ujian->fresh(),
        ]);
    }

    /** DELETE /api/ujian/{id} (admin) */
    public function destroy($id)
    {
        $ujian = Ujian::findOrFail($id);
        $ujian->delete();

        return response()->json(['success' => true, 'message' => 'Ujian dihapus.']);
    }

    /**
     * POST /api/ujian/{id}/mulai (peserta)
     * Membuat / melanjutkan rekam_jejak, mengembalikan soal + sisa waktu.
     */
    public function mulai(Request $request, $id)
    {
        $user = $request->user();
        $ujian = Ujian::findOrFail($id);

        if (! $ujian->status_aktif) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian ini sedang tidak aktif.',
            ], 422);
        }

        $rekam = RekamJejak::with('ujian')
            ->where('id_user', $user->id_user)
            ->where('id_ujian', $ujian->id_ujian)
            ->first();

        if ($rekam) {
            $this->penilaian->tutupJikaKedaluwarsa($rekam);
        }

        if ($rekam && ! $rekam->sedangBerjalan()) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian ini sudah kamu kerjakan.',
                'rekam'   => ['id_rekam_jejak' => $rekam->id_rekam_jejak],
            ], 409);
        }

        // sesi baru hanya boleh dibuat di dalam jendela jadwal; sesi berjalan boleh dilanjutkan
        if (! $rekam) {
            $jadwal = $ujian->statusJadwal();
            if ($jadwal === 'belum') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ujian belum dimulai. Jadwal: ' . $ujian->jadwalMulai()->translatedFormat('d M Y H:i') . '.',
                ], 422);
            }
            if ($jadwal === 'lewat') {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal ujian sudah berakhir.',
                ], 422);
            }
        }

        $soal = Soal::where('id_ujian', $ujian->id_ujian)
            ->orderBy('nomor_urut')
            ->get();

        if ($soal->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian ini belum memiliki soal.',
            ], 422);
        }

        $rekam ??= RekamJejak::firstOrCreate(
            ['id_user' => $user->id_user, 'id_ujian' => $ujian->id_ujian],
            [
                'waktu_mulai'       => now(),
                'total_soal'        => $soal->count(),
                'status_pengerjaan' => 'sedang_mengerjakan',
            ]
        );
        $rekam->setRelation('ujian', $ujian);

        $soal = $rekam->urutkanSoalUntukPeserta($soal);

        $deadline = $rekam->deadline();
        $sisaDetik = $deadline ? max(0, (int) now()->diffInSeconds($deadline, false)) : 0;

        return response()->json([
            'success' => true,
            'data'    => [
                'rekam' => [
                    'id_rekam_jejak'    => $rekam->id_rekam_jejak,
                    'waktu_mulai'       => $rekam->waktu_mulai->format('Y-m-d\TH:i:s'),
                    'status_pengerjaan' => $rekam->status_pengerjaan,
                    'durasi_menit'      => $ujian->durasi_menit,
                    'sisa_detik'        => $sisaDetik,
                    'deadline'          => $deadline?->format('Y-m-d\TH:i:s'),
                ],
                'ujian'   => $ujian,
                'soal'    => $soal->values()->map(fn (Soal $s, int $i) => $this->formatSoal($s, false, $i + 1)),
                'jawaban' => JawabanPeserta::where('id_rekam_jejak', $rekam->id_rekam_jejak)
                    ->get()
                    ->keyBy('id_soal')
                    ->map(fn ($j) => $j->jawaban_dipilih),
            ],
        ]);
    }

    private function validasi(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'judul_mata_kuliah' => ['required', 'string', 'max:255'],
            'tanggal'           => ['required', 'date'],
            'waktu_mulai'       => ['required', 'date_format:H:i'],
            'waktu_selesai'     => ['required', 'date_format:H:i', 'after:waktu_mulai'],
            'durasi_menit'      => ['required', 'integer', 'min:1', 'max:600'],
            'status_aktif'      => ['boolean'],
            'acak_soal'         => ['boolean'],
        ]);
    }

    private function formatSoal(Soal $s, bool $withKunci, ?int $nomorTampil = null): array
    {
        $row = [
            'id_soal'      => $s->id_soal,
            'id_ujian'     => $s->id_ujian,
            'nomor_urut'   => $s->nomor_urut,
            'nomor_tampil' => $nomorTampil ?? $s->nomor_urut,
            'teks_soal'    => $s->teks_soal,
            'gambar_soal'  => $s->gambar_soal,
            'gambar_url'   => $s->gambar_url,
            'opsi'         => [
                'A' => $s->opsi_a,
                'B' => $s->opsi_b,
                'C' => $s->opsi_c,
                'D' => $s->opsi_d,
                'E' => $s->opsi_e,
            ],
        ];

        if ($withKunci) {
            $row['kunci_jawaban'] = $s->kunci_jawaban;
        }

        return $row;
    }
}
