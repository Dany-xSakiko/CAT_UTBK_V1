<?php

namespace App\Http\Controllers;

use App\Models\RekamJejak;
use App\Models\Soal;
use App\Models\Ujian;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UjianController extends Controller
{
    /** GET /api/ujian — admin lihat semua, peserta hanya yang aktif + riwayatnya */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Ujian::query()->orderByDesc('tanggal')->orderBy('waktu_mulai');

        if ($user->role === 'Peserta') {
            $query->where('status_aktif', true);
        }

        $ujian = $query->get()->map(function (Ujian $u) use ($user) {
            $row = $u->toArray();
            $row['jumlah_soal'] = Soal::where('id_ujian', $u->id_ujian)->count();
            $row['jumlah_peserta'] = RekamJejak::where('id_ujian', $u->id_ujian)
                ->distinct('id_user')
                ->count('id_user');

            $rekam = RekamJejak::where('id_user', $user->id_user)
                ->where('id_ujian', $u->id_ujian)
                ->first();

            $row['rekam'] = $rekam ? [
                'id_rekam_jejak'    => $rekam->id_rekam_jejak,
                'status_pengerjaan' => $rekam->status_pengerjaan,
                'skor_akhir'        => $rekam->skor_akhir,
                'waktu_mulai'       => $rekam->waktu_mulai
                    ? $rekam->waktu_mulai->format('Y-m-d\TH:i:s')
                    : null,
                'waktu_selesai'     => $rekam->waktu_selesai
                    ? $rekam->waktu_selesai->format('Y-m-d\TH:i:s')
                    : null,
                'jumlah_pelanggaran' => \App\Models\LogProctoring::where('id_rekam_jejak', $rekam->id_rekam_jejak)
                    ->where('jenis_pelanggaran', '!=', 'Normal')
                    ->count(),
            ] : null;

            return $row;
        });

        return response()->json(['success' => true, 'data' => $ujian]);
    }

    /** GET /api/ujian/{id} — detail + daftar soal (kunci hanya untuk admin) */
    public function show(Request $request, $id)
    {
        $ujian = Ujian::findOrFail($id);
        $isAdmin = $request->user()->role === 'Admin';

        $soal = Soal::where('id_ujian', $ujian->id_ujian)
            ->orderBy('nomor_urut')
            ->get()
            ->map(fn (Soal $s) => $this->formatSoal($s, $isAdmin));

        $data = $ujian->toArray();
        $data['jumlah_soal'] = $soal->count();
        $data['soal'] = $soal;

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

        if (! $ujian->status_aktif && $user->role === 'Peserta') {
            return response()->json([
                'success' => false,
                'message' => 'Ujian ini sedang tidak aktif.',
            ], 422);
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

        $rekam = RekamJejak::firstOrCreate(
            ['id_user' => $user->id_user, 'id_ujian' => $ujian->id_ujian],
            [
                'waktu_mulai'    => now(),
                'total_soal'     => $soal->count(),
                'status_pengerjaan' => 'sedang_mengerjakan',
            ]
        );

        if ($rekam->status_pengerjaan === 'selesai' || $rekam->status_pengerjaan === 'diskualifikasi') {
            return response()->json([
                'success' => false,
                'message' => 'Ujian ini sudah kamu kerjakan.',
                'rekam'   => ['id_rekam_jejak' => $rekam->id_rekam_jejak],
            ], 409);
        }

        $deadline = $rekam->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);
        $sisaDetik = now()->greaterThan($deadline) ? 0 : now()->diffInSeconds($deadline, false);

        return response()->json([
            'success' => true,
            'data'    => [
                'rekam' => [
                    'id_rekam_jejak'    => $rekam->id_rekam_jejak,
                    'waktu_mulai'       => $rekam->waktu_mulai->format('Y-m-d\TH:i:s'),
                    'status_pengerjaan' => $rekam->status_pengerjaan,
                    'durasi_menit'      => $ujian->durasi_menit,
                    'sisa_detik'        => max(0, (int) $sisaDetik),
                    'deadline'          => $deadline->format('Y-m-d\TH:i:s'),
                ],
                'ujian'  => $ujian,
                'soal'   => $soal->map(fn (Soal $s) => $this->formatSoal($s, false)),
                'jawaban' => \App\Models\JawabanPeserta::where('id_rekam_jejak', $rekam->id_rekam_jejak)
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
        ]);
    }

    private function formatSoal(Soal $s, bool $withKunci): array
    {
        $row = [
            'id_soal'    => $s->id_soal,
            'id_ujian'   => $s->id_ujian,
            'nomor_urut' => $s->nomor_urut,
            'teks_soal'  => $s->teks_soal,
            'opsi'       => [
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
