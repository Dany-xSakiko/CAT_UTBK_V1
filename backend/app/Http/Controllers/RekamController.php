<?php

namespace App\Http\Controllers;

use App\Models\JawabanPeserta;
use App\Models\LogProctoring;
use App\Models\RekamJejak;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RekamController extends Controller
{
    /** GET /api/rekam/{id} — peserta pemilik atau admin */
    public function show(Request $request, $id)
    {
        $rekam = RekamJejak::with(['ujian'])->findOrFail($id);
        $user = $request->user();

        if ($user->role === 'Peserta' && $rekam->id_user !== $user->id_user) {
            return response()->json(['success' => false, 'message' => 'Tidak punya akses ke rekam ini.'], 403);
        }

        $soal = Soal::where('id_ujian', $rekam->id_ujian)->orderBy('nomor_urut')->get();
        $jawaban = JawabanPeserta::where('id_rekam_jejak', $rekam->id_rekam_jejak)->get();
        $selesai = $rekam->status_pengerjaan !== 'sedang_mengerjakan';
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
        $rekam = RekamJejak::findOrFail($id);
        $user = $request->user();

        // pengerjaan hanya boleh oleh pemilik sesi (admin cukup memantau)
        if ($rekam->id_user !== $user->id_user) {
            return response()->json(['success' => false, 'message' => 'Hanya peserta pemilik sesi yang boleh menjawab.'], 403);
        }
        if ($rekam->status_pengerjaan !== 'sedang_mengerjakan') {
            return response()->json(['success' => false, 'message' => 'Sesi ujian sudah ditutup.'], 409);
        }
        if ($this->lewatDeadline($rekam)) {
            return response()->json(['success' => false, 'message' => 'Waktu ujian sudah habis.'], 409);
        }

        $data = $request->validate([
            'id_soal' => ['required', 'integer', 'exists:soal,id_soal'],
            'jawaban' => ['required', 'in:A,B,C,D,E'],
        ]);

        $soal = Soal::findOrFail($data['id_soal']);
        if ($soal->id_ujian !== $rekam->id_ujian) {
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

    /** POST /api/rekam/{id}/selesai — hitung skor & tutup sesi */
    public function selesai(Request $request, $id)
    {
        $rekam = RekamJejak::findOrFail($id);
        $user = $request->user();

        if ($rekam->id_user !== $user->id_user) {
            return response()->json(['success' => false, 'message' => 'Hanya peserta pemilik sesi yang boleh menyelesaikan ujian.'], 403);
        }

        if ($rekam->status_pengerjaan === 'sedang_mengerjakan') {
            DB::transaction(function () use ($rekam) {
                $totalSoal = Soal::where('id_ujian', $rekam->id_ujian)->count();

                // sinkronkan status benar/salah dengan kunci terbaru
                $jawaban = JawabanPeserta::where('id_rekam_jejak', $rekam->id_rekam_jejak)->get();
                foreach ($jawaban as $j) {
                    $kunci = Soal::whereKey($j->id_soal)->value('kunci_jawaban');
                    $benar = $j->jawaban_dipilih === $kunci;
                    if ($j->status_benar_salah !== $benar) {
                        $j->update(['status_benar_salah' => $benar]);
                    }
                }

                $benar = JawabanPeserta::where('id_rekam_jejak', $rekam->id_rekam_jejak)
                    ->where('status_benar_salah', true)
                    ->count();

                $rekam->update([
                    'waktu_selesai'     => now(),
                    'total_soal'        => $totalSoal,
                    'total_benar'       => $benar,
                    'total_salah'       => max(0, $totalSoal - $benar),
                    'skor_akhir'        => $totalSoal > 0 ? round($benar / $totalSoal * 100, 2) : 0,
                    'status_pengerjaan' => 'selesai',
                ]);
            });
        }

        $rekam->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Ujian selesai. Jawaban sudah dikunci.',
            'data'    => $this->formatRekam($rekam),
        ]);
    }

    private function lewatDeadline(RekamJejak $rekam): bool
    {
        $durasi = (int) $rekam->ujian->durasi_menit;

        return now()->greaterThan($rekam->waktu_mulai->copy()->addMinutes($durasi));
    }

    private function formatRekam(RekamJejak $rekam): array
    {
        $durasi = (int) ($rekam->ujian->durasi_menit ?? 0);
        $deadline = $rekam->waktu_mulai?->copy()->addMinutes($durasi);
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
            'sisa_detik'        => max(0, (int) $sisa),
            'deadline'          => $deadline?->format('Y-m-d\TH:i:s'),
        ];
    }
}
