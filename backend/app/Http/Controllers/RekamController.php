<?php

namespace App\Http\Controllers;

use App\Models\JawabanPeserta;
use App\Models\LogProctoring;
use App\Models\RekamJejak;
use App\Models\Soal;
use App\Services\PenilaianService;
use Illuminate\Http\Request;

class RekamController extends Controller
{
    public function __construct(private PenilaianService $penilaian) {}

    /** GET /api/rekam/{id} — peserta pemilik atau admin */
    public function show(Request $request, $id)
    {
        $rekam = RekamJejak::with(['ujian'])->findOrFail($id);
        $user = $request->user();

        if ($user->role === 'Peserta' && ! $this->milik($rekam, $user)) {
            return response()->json(['success' => false, 'message' => 'Tidak punya akses ke rekam ini.'], 403);
        }

        // sesi yang waktunya sudah habis langsung dinilai (tidak bergantung pada browser peserta)
        $this->penilaian->tutupJikaKedaluwarsa($rekam);

        $soal = Soal::where('id_ujian', $rekam->id_ujian)->orderBy('nomor_urut')->get();
        $jawaban = JawabanPeserta::where('id_rekam_jejak', $rekam->id_rekam_jejak)->get();
        $selesai = ! $rekam->sedangBerjalan();
        $petaJawaban = $jawaban->keyBy('id_soal');

        return response()->json([
            'success' => true,
            'data'    => [
                'rekam'   => $this->formatRekam($rekam),
                'ujian'   => $rekam->ujian,
                'soal'    => $soal->map(fn (Soal $s) => [
                    'id_soal'    => $s->id_soal,
                    'nomor_urut' => $s->nomor_urut,
                    'teks_soal'  => $s->teks_soal,
                    'opsi'       => [
                        'A' => $s->opsi_a, 'B' => $s->opsi_b, 'C' => $s->opsi_c,
                        'D' => $s->opsi_d, 'E' => $s->opsi_e,
                    ],
                    // kunci hanya dibuka setelah sesi selesai (untuk halaman hasil)
                    'kunci_jawaban' => $selesai ? $s->kunci_jawaban : null,
                    'jawaban_peserta' => $petaJawaban->get($s->id_soal)?->jawaban_dipilih,
                    'benar' => $selesai
                        ? ($petaJawaban->get($s->id_soal)?->jawaban_dipilih === $s->kunci_jawaban)
                        : null,
                ]),
                'jawaban' => $jawaban->pluck('jawaban_dipilih', 'id_soal'),
                'log'     => LogProctoring::where('id_rekam_jejak', $rekam->id_rekam_jejak)
                    ->orderBy('timestamp')
                    ->get()
                    ->map(fn (LogProctoring $l) => [
                        'id_log'            => $l->id_log,
                        'waktu'             => $l->timestamp?->format('Y-m-d\TH:i:s'),
                        'jenis_pelanggaran' => $l->jenis_pelanggaran,
                        'keterangan'        => $l->keterangan,
                        'bukti_screenshot'  => $l->screenshot_url,
                    ]),
            ],
        ]);
    }

    /** POST /api/rekam/{id}/jawab — body { id_soal, jawaban } */
    public function jawab(Request $request, $id)
    {
        $rekam = RekamJejak::with('ujian')->findOrFail($id);
        $user = $request->user();

        // pengerjaan hanya boleh oleh pemilik sesi (admin cukup memantau)
        if (! $this->milik($rekam, $user)) {
            return response()->json(['success' => false, 'message' => 'Hanya peserta pemilik sesi yang boleh menjawab.'], 403);
        }
        if ($this->penilaian->tutupJikaKedaluwarsa($rekam)) {
            return response()->json(['success' => false, 'message' => 'Waktu ujian sudah habis.', 'ditutup' => true], 409);
        }
        if (! $rekam->sedangBerjalan()) {
            return response()->json(['success' => false, 'message' => 'Sesi ujian sudah ditutup.', 'ditutup' => true], 409);
        }

        $data = $request->validate([
            'id_soal' => ['required', 'integer', 'exists:soal,id_soal'],
            'jawaban' => ['required', 'in:A,B,C,D,E'],
        ]);

        $soal = Soal::findOrFail($data['id_soal']);
        if ((int) $soal->id_ujian !== (int) $rekam->id_ujian) {
            return response()->json(['success' => false, 'message' => 'Soal bukan bagian dari ujian ini.'], 422);
        }

        $jawaban = JawabanPeserta::updateOrCreate(
            ['id_rekam_jejak' => $rekam->id_rekam_jejak, 'id_soal' => $soal->id_soal],
            [
                'jawaban_dipilih'   => $data['jawaban'],
                'status_benar_salah'=> $data['jawaban'] === $soal->kunci_jawaban,
                'waktu_dijawab'     => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'id_soal' => $jawaban->id_soal,
                'jawaban' => $jawaban->jawaban_dipilih,
                'terjawab' => JawabanPeserta::where('id_rekam_jejak', $rekam->id_rekam_jejak)->count(),
            ],
        ]);
    }

    /** POST /api/rekam/{id}/selesai — hitung skor & tutup sesi (idempoten) */
    public function selesai(Request $request, $id)
    {
        $rekam = RekamJejak::with('ujian')->findOrFail($id);
        $user = $request->user();

        if (! $this->milik($rekam, $user)) {
            return response()->json(['success' => false, 'message' => 'Hanya peserta pemilik sesi yang boleh menyelesaikan ujian.'], 403);
        }

        $this->penilaian->tutup($rekam);

        return response()->json([
            'success' => true,
            'message' => 'Ujian selesai. Jawaban sudah dikunci.',
            'data'    => $this->formatRekam($rekam),
        ]);
    }

    /** POST /api/admin/rekam/{id}/diskualifikasi (admin) */
    public function diskualifikasi(Request $request, $id)
    {
        $rekam = RekamJejak::with('ujian')->findOrFail($id);

        if ($rekam->status_pengerjaan === 'diskualifikasi') {
            return response()->json(['success' => false, 'message' => 'Peserta sudah didiskualifikasi.'], 409);
        }

        $data = $request->validate(['alasan' => ['nullable', 'string', 'max:500']]);

        $this->penilaian->tutup($rekam, 'diskualifikasi');

        // catat keputusan admin di log proctoring sebagai jejak audit
        LogProctoring::create([
            'id_rekam_jejak'    => $rekam->id_rekam_jejak,
            'id_user'           => $rekam->id_user,
            'timestamp'         => now(),
            'jenis_pelanggaran' => 'Suspicious Activity',
            'keterangan'        => 'Didiskualifikasi oleh admin ' . $request->user()->username
                . (! empty($data['alasan']) ? ': ' . $data['alasan'] : '.'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Peserta didiskualifikasi.',
            'data'    => $this->formatRekam($rekam->refresh()),
        ]);
    }

    private function milik(RekamJejak $rekam, $user): bool
    {
        // cast eksplisit: driver DB tertentu mengembalikan kolom FK sebagai string
        return (int) $rekam->id_user === (int) $user->id_user;
    }

    private function formatRekam(RekamJejak $rekam): array
    {
        $rekam->loadMissing('ujian');
        $durasi = (int) ($rekam->ujian->durasi_menit ?? 0);
        $deadline = $rekam->deadline();
        $sisa = $deadline ? now()->diffInSeconds($deadline, false) : 0;

        return [
            'id_rekam_jejak'    => $rekam->id_rekam_jejak,
            'id_user'           => $rekam->id_user,
            'id_ujian'          => $rekam->id_ujian,
            'waktu_mulai'       => $rekam->waktu_mulai?->format('Y-m-d\TH:i:s'),
            'waktu_selesai'     => $rekam->waktu_selesai?->format('Y-m-d\TH:i:s'),
            'skor_akhir'        => $rekam->skor_akhir !== null ? (float) $rekam->skor_akhir : null,
            'total_soal'        => (int) $rekam->total_soal,
            'total_benar'       => (int) $rekam->total_benar,
            'total_salah'       => (int) $rekam->total_salah,
            'status_pengerjaan' => $rekam->status_pengerjaan,
            'durasi_menit'      => $durasi,
            'sisa_detik'        => $rekam->sedangBerjalan() ? max(0, (int) $sisa) : 0,
            'deadline'          => $deadline?->format('Y-m-d\TH:i:s'),
        ];
    }
}
