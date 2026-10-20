<?php

namespace App\Http\Controllers;

use App\Models\LogProctoring;
use App\Models\RekamJejak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ProctoringController extends Controller
{
    /**
     * Insert log proctoring dari frontend/AI
     * Dipanggil setiap 3 detik saat anomali terdeteksi
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function insertLog(Request $request)
    {
        // Validasi request
        $validator = Validator::make($request->all(), [
            'id_user' => 'required|integer|exists:pengguna,id_user',
            'id_rekam_jejak' => 'required|integer|exists:rekam_jejak,id_rekam_jejak',
            'jenis_pelanggaran' => 'required|in:Normal,No Face,Multiple Faces,Looking Away,Suspicious Activity',
            'bukti_screenshot' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', // Max 2MB
            'keterangan' => 'nullable|string|max:500',
        ], [
            'id_user.required' => 'ID Peserta wajib diisi',
            'id_user.exists' => 'ID Peserta tidak valid',
            'id_rekam_jejak.required' => 'ID Rekam Jejak wajib diisi',
            'id_rekam_jejak.exists' => 'ID Rekam Jejak tidak valid',
            'jenis_pelanggaran.required' => 'Jenis pelanggaran wajib diisi',
            'jenis_pelanggaran.in' => 'Jenis pelanggaran tidak valid',
            'bukti_screenshot.image' => 'File harus berupa gambar',
            'bukti_screenshot.mimes' => 'Format gambar harus jpeg, png, atau jpg',
            'bukti_screenshot.max' => 'Ukuran gambar maksimal 2MB',
        ]);

        // Jika validasi gagal
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verifikasi bahwa rekam jejak milik user yang bersangkutan
            $rekamJejak = RekamJejak::where('id_rekam_jejak', $request->id_rekam_jejak)
                                    ->where('id_user', $request->id_user)
                                    ->first();

            if (!$rekamJejak) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rekam jejak tidak ditemukan atau tidak sesuai dengan peserta'
                ], 404);
            }

            // Cek apakah ujian masih berlangsung
            if ($rekamJejak->status_pengerjaan !== 'sedang_mengerjakan') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ujian sudah selesai atau tidak aktif'
                ], 400);
            }

            // Proses upload screenshot jika ada
            $screenshotPath = null;
            if ($request->hasFile('bukti_screenshot')) {
                $file = $request->file('bukti_screenshot');
                $filename = 'proctoring_' 
                          . $request->id_user 
                          . '_' . time() 
                          . '_' . uniqid() 
                          . '.' . $file->getClientOriginalExtension();
                
                // Simpan ke storage/app/public/proctoring
                $screenshotPath = $file->storeAs('proctoring', $filename, 'public');
            }

            // Insert log ke database
            $log = LogProctoring::create([
                'id_rekam_jejak' => $request->id_rekam_jejak,
                'id_user' => $request->id_user,
                'timestamp' => now(),
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'bukti_screenshot' => $screenshotPath,
                'keterangan' => $request->keterangan,
            ]);

            // Log untuk monitoring
            Log::info('Proctoring log inserted', [
                'id_log' => $log->id_log,
                'id_user' => $request->id_user,
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
            ]);

            // Return response sukses
            return response()->json([
                'success' => true,
                'message' => 'Log proctoring berhasil disimpan',
                'data' => [
                    'id_log' => $log->id_log,
                    'timestamp' => $log->timestamp->format('Y-m-d H:i:s'),
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'screenshot_url' => $screenshotPath ? asset('storage/' . $screenshotPath) : null,
                ]
            ], 201);

        } catch (\Exception $e) {
            // Log error untuk debugging
            Log::error('Error inserting proctoring log', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan log',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Insert log proctoring dengan base64 screenshot
     * Alternative untuk frontend yang mengirim gambar dalam format base64
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function insertLogBase64(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_user' => 'required|integer|exists:pengguna,id_user',
            'id_rekam_jejak' => 'required|integer|exists:rekam_jejak,id_rekam_jejak',
            'jenis_pelanggaran' => 'required|in:Normal,No Face,Multiple Faces,Looking Away,Suspicious Activity',
            'bukti_screenshot_base64' => 'nullable|string',
            'keterangan' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rekamJejak = RekamJejak::where('id_rekam_jejak', $request->id_rekam_jejak)
                                    ->where('id_user', $request->id_user)
                                    ->first();

            if (!$rekamJejak) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rekam jejak tidak valid'
                ], 404);
            }

            // Proses base64 screenshot
            $screenshotPath = null;
            if ($request->filled('bukti_screenshot_base64')) {
                $imageData = $request->bukti_screenshot_base64;
                
                // Remove data:image/png;base64, prefix jika ada
                if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                    $imageData = substr($imageData, strpos($imageData, ',') + 1);
                    $type = strtolower($type[1]);
                    
                    if (!in_array($type, ['jpg', 'jpeg', 'png'])) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Format gambar tidak valid'
                        ], 400);
                    }
                }
                
                $imageData = base64_decode($imageData);
                
                if ($imageData === false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Data base64 tidak valid'
                    ], 400);
                }
                
                $filename = 'proctoring_' 
                          . $request->id_user 
                          . '_' . time() 
                          . '_' . uniqid() 
                          . '.png';
                
                $screenshotPath = 'proctoring/' . $filename;
                Storage::disk('public')->put($screenshotPath, $imageData);
            }

            $log = LogProctoring::create([
                'id_rekam_jejak' => $request->id_rekam_jejak,
                'id_user' => $request->id_user,
                'timestamp' => now(),
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'bukti_screenshot' => $screenshotPath,
                'keterangan' => $request->keterangan,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log proctoring berhasil disimpan',
                'data' => [
                    'id_log' => $log->id_log,
                    'timestamp' => $log->timestamp->format('Y-m-d H:i:s'),
                    'jenis_pelanggaran' => $log->jenis_pelanggaran,
                    'screenshot_url' => $screenshotPath ? asset('storage/' . $screenshotPath) : null,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error inserting proctoring log (base64)', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan log',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get log proctoring untuk satu rekam jejak
     * 
     * @param int $idRekamJejak
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLogsByRekamJejak($idRekamJejak)
    {
        try {
            $logs = LogProctoring::where('id_rekam_jejak', $idRekamJejak)
                                 ->orderBy('timestamp', 'desc')
                                 ->get()
                                 ->map(function($log) {
                                     return [
                                         'id_log' => $log->id_log,
                                         'timestamp' => $log->timestamp->format('Y-m-d H:i:s'),
                                         'jenis_pelanggaran' => $log->jenis_pelanggaran,
                                         'screenshot_url' => $log->screenshot_url,
                                         'keterangan' => $log->keterangan,
                                     ];
                                 });

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data log'
            ], 500);
        }
    }
}
