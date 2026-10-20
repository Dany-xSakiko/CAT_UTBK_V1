<?php

namespace App\Http\Controllers;

use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SoalController extends Controller
{
    /** GET /api/soal?ujian_id=1 (admin) */
    public function index(Request $request)
    {
        $request->validate(['ujian_id' => ['required', 'integer', 'exists:ujian,id_ujian']]);

        $soal = Soal::where('id_ujian', $request->integer('ujian_id'))
            ->orderBy('nomor_urut')
            ->get()
            ->map(fn (Soal $s) => [
                'id_soal'       => $s->id_soal,
                'id_ujian'      => $s->id_ujian,
                'nomor_urut'    => $s->nomor_urut,
                'teks_soal'     => $s->teks_soal,
                'opsi'          => [
                    'A' => $s->opsi_a,
                    'B' => $s->opsi_b,
                    'C' => $s->opsi_c,
                    'D' => $s->opsi_d,
                    'E' => $s->opsi_e,
                ],
                'kunci_jawaban' => $s->kunci_jawaban,
            ]);

        return response()->json(['success' => true, 'data' => $soal]);
    }

    /** POST /api/soal (admin) */
    public function store(Request $request)
    {
        $data = $this->validasi($request);

        $soal = DB::transaction(function () use ($data) {
            if (empty($data['nomor_urut'])) {
                $data['nomor_urut'] = (int) Soal::where('id_ujian', $data['id_ujian'])->max('nomor_urut') + 1;
            }

            return Soal::create($data);
        });

        return response()->json([
            'success' => true,
            'message' => 'Soal berhasil ditambahkan.',
            'data'    => $soal,
        ], 201);
    }

    /** PUT /api/soal/{id} (admin) */
    public function update(Request $request, $id)
    {
        $soal = Soal::findOrFail($id);
        $soal->update($this->validasi($request, $soal->id_soal));

        return response()->json([
            'success' => true,
            'message' => 'Soal berhasil diperbarui.',
            'data'    => $soal->fresh(),
        ]);
    }

    /** DELETE /api/soal/{id} (admin) */
    public function destroy($id)
    {
        Soal::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Soal dihapus.']);
    }

    private function validasi(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'id_ujian'      => ['required', 'integer', 'exists:ujian,id_ujian'],
            'nomor_urut'    => ['nullable', 'integer', 'min:1'],
            'teks_soal'     => ['required', 'string'],
            'opsi_a'        => ['required', 'string'],
            'opsi_b'        => ['required', 'string'],
            'opsi_c'        => ['required', 'string'],
            'opsi_d'        => ['required', 'string'],
            'opsi_e'        => ['required', 'string'],
            'kunci_jawaban' => ['required', 'in:A,B,C,D,E'],
        ]);
    }
}
