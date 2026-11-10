<?php

namespace App\Http\Controllers;

use App\Models\LogProctoring;
use App\Models\RekamJejak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProctoringController extends Controller
{
    private const JENIS_VALID = 'Normal,No Face,Multiple Faces,Looking Away,Suspicious Activity';

    /**
     * POST /api/proctoring/log — simpan log pelanggaran dari kamera/browser peserta.
     * Identitas peserta selalu diambil dari token autentikasi (bukan dari body request)
     * agar peserta tidak dapat memalsukan log atas nama peserta lain.
     */
    public function insertLog(Request $request)
    {
        $authUser = $request->user();
        $idUser = $authUser->role === 'Admin' && $request->filled('id_user')
            ? (int) $request->input('id_user')
            : (int) $authUser->id_user;

        // normalisasi alias parameter dari modul AI
        if (! $request->has('jenis_pelanggaran') && $request->has('status')) {
            $request->merge(['jenis_pelanggaran' => $request->input('status')]);
        }
        if (! $request->hasFile('bukti_screenshot') && $request->hasFile('screenshot')) {
            $request->files->set('bukti_screenshot', $request->file('screenshot'));
        }
        if (! $request->has('id_rekam_jejak') && $request->has('id_ujian')) {
            $activeRekam = RekamJejak::where('id_ujian', $request->id_ujian)
                ->where('id_user', $idUser)
                ->where('status_pengerjaan', 'sedang_mengerjakan')
                ->latest('waktu_mulai')
                ->first();
            if ($activeRekam) {
                $request->merge(['id_rekam_jejak' => $activeRekam->id_rekam_jejak]);
            }
        }

        if ($request->input('jenis_pelanggaran') === 'Normal') {
            return response()->json([
                'success' => true,
                'message' => 'Status normal diterima (tidak dicatat sebagai pelanggaran)',
            ], 200);
        }

        $validator = Validator::make($request->all(), [
            'id_rekam_jejak'    => 'required|integer|exists:rekam_jejak,id_rekam_jejak',
            'jenis_pelanggaran' => 'required|in:' . self::JENIS_VALID,
            'bukti_screenshot'  => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'keterangan'        => 'nullable|string|max:500',
        ], [
            'id_rekam_jejak.required'    => 'ID Rekam Jejak wajib diisi',
            'id_rekam_jejak.exists'      => 'ID Rekam Jejak tidak valid',
            'jenis_pelanggaran.required' => 'Jenis pelanggaran wajib diisi',
            'jenis_pelanggaran.in'       => 'Jenis pelanggaran tidak valid',
            'bukti_screenshot.image'     => 'File harus berupa gambar',
            'bukti_screenshot.mimes'     => 'Format gambar harus jpeg, png, atau jpg',
            'bukti_screenshot.max'       => 'Ukuran gambar maksimal 2MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $rekamJejak = RekamJejak::where('id_rekam_jejak', $request->id_rekam_jejak)
                ->where('id_user', $idUser)
                ->first();

            if (! $rekamJejak) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rekam jejak tidak ditemukan atau bukan milik peserta ini',
                ], 403);
            }

            if ($rekamJejak->status_pengerjaan !== 'sedang_mengerjakan') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ujian sudah selesai atau tidak aktif',
                ], 400);
            }

            $screenshotPath = null;
            if ($request->hasFile('bukti_screenshot')) {
                $file = $request->file('bukti_screenshot');
                $ext = strtolower($file->extension() ?: 'jpg');
                $filename = 'proctoring_' . $idUser . '_' . time() . '_' . uniqid() . '.' . $ext;
                $screenshotPath = $file->storeAs('proctoring', $filename, 'public');
            }

            $log = LogProctoring::create([
                'id_rekam_jejak'    => $rekamJejak->id_rekam_jejak,
                'id_user'           => $idUser,
                'timestamp'         => now(),
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'bukti_screenshot'  => $screenshotPath,
                'keterangan'        => $request->keterangan,
            ]);

            Log::info('Proctoring log inserted', [
                'id_log'            => $log->id_log,
                'id_user'           => $idUser,
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log proctoring berhasil disimpan',
                'data'    => [
                    'id_log'            => $log->id_log,
                    'timestamp'         => $log->timestamp->format('Y-m-d H:i:s'),
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'screenshot_url'    => $log->screenshot_url,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error inserting proctoring log', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan log',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * POST /api/proctoring/log/base64 — alternatif dengan screenshot base64.
     */
    public function insertLogBase64(Request $request)
    {
        $authUser = $request->user();
        $idUser = $authUser->role === 'Admin' && $request->filled('id_user')
            ? (int) $request->input('id_user')
            : (int) $authUser->id_user;

        if ($request->input('jenis_pelanggaran') === 'Normal') {
            return response()->json([
                'success' => true,
                'message' => 'Status normal diterima (tidak dicatat sebagai pelanggaran)',
            ], 200);
        }

        $validator = Validator::make($request->all(), [
            'id_rekam_jejak'          => 'required|integer|exists:rekam_jejak,id_rekam_jejak',
            'jenis_pelanggaran'       => 'required|in:' . self::JENIS_VALID,
            'bukti_screenshot_base64' => 'nullable|string|max:3000000',
            'keterangan'              => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $rekamJejak = RekamJejak::where('id_rekam_jejak', $request->id_rekam_jejak)
                ->where('id_user', $idUser)
                ->first();

            if (! $rekamJejak) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rekam jejak tidak ditemukan atau bukan milik peserta ini',
                ], 403);
            }

            if ($rekamJejak->status_pengerjaan !== 'sedang_mengerjakan') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ujian sudah selesai atau tidak aktif',
                ], 400);
            }

            $screenshotPath = null;
            if ($request->filled('bukti_screenshot_base64')) {
                $raw = $request->bukti_screenshot_base64;
                $ext = 'jpg';

                if (preg_match('/^data:image\/(jpeg|jpg|png);base64,/i', $raw, $m)) {
                    $raw = substr($raw, strpos($raw, ',') + 1);
                    $ext = strtolower($m[1]) === 'png' ? 'png' : 'jpg';
                }

                $imageData = base64_decode($raw, true);
                if ($imageData === false || strlen($imageData) > 2 * 1024 * 1024 || @getimagesizefromstring($imageData) === false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Data gambar base64 tidak valid atau melebihi 2MB',
                    ], 400);
                }

                $filename = 'proctoring_' . $idUser . '_' . time() . '_' . uniqid() . '.' . $ext;
                $screenshotPath = 'proctoring/' . $filename;
                Storage::disk('public')->put($screenshotPath, $imageData);
            }

            $log = LogProctoring::create([
                'id_rekam_jejak'    => $rekamJejak->id_rekam_jejak,
                'id_user'           => $idUser,
                'timestamp'         => now(),
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'bukti_screenshot'  => $screenshotPath,
                'keterangan'        => $request->keterangan,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log proctoring berhasil disimpan',
                'data'    => [
                    'id_log'            => $log->id_log,
                    'timestamp'         => $log->timestamp->format('Y-m-d H:i:s'),
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'screenshot_url'    => $log->screenshot_url,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error inserting proctoring log (base64)', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan log',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * GET /api/proctoring/logs/{idRekamJejak} — hanya pemilik sesi atau Admin.
     */
    public function getLogsByRekamJejak(Request $request, $idRekamJejak)
    {
        $rekam = RekamJejak::find($idRekamJejak);
        if (! $rekam) {
            return response()->json(['success' => false, 'message' => 'Rekam jejak tidak ditemukan'], 404);
        }

        $user = $request->user();
        if ($user->role === 'Peserta' && (int) $rekam->id_user !== (int) $user->id_user) {
            return response()->json(['success' => false, 'message' => 'Tidak punya akses ke log sesi ini.'], 403);
        }

        $logs = LogProctoring::where('id_rekam_jejak', $idRekamJejak)
            ->orderBy('timestamp', 'desc')
            ->get()
            ->map(fn (LogProctoring $log) => [
                'id_log'            => $log->id_log,
                'timestamp'         => $log->timestamp?->format('Y-m-d H:i:s'),
                'jenis_pelanggaran' => $log->jenis_pelanggaran,
                'screenshot_url'    => $log->screenshot_url,
                'keterangan'        => $log->keterangan,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }
}
