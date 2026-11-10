<?php

namespace App\Http\Controllers;

use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SoalController extends Controller
{
    public const MAKS_SOAL = 100;

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

        return response()->json([
            'success'   => true,
            'data'      => $soal,
            'maks_soal' => self::MAKS_SOAL,
        ]);
    }

    /** POST /api/soal (admin) */
    public function store(Request $request)
    {
        $data = $this->validasi($request);

        $soal = DB::transaction(function () use ($data) {
            $jumlah = Soal::where('id_ujian', $data['id_ujian'])->lockForUpdate()->count();
            if ($jumlah >= self::MAKS_SOAL) {
                throw ValidationException::withMessages([
                    'id_ujian' => ['Jumlah soal sudah mencapai batas maksimal ' . self::MAKS_SOAL . ' soal untuk ujian ini.'],
                ]);
            }

            if (empty($data['nomor_urut'])) {
                $data['nomor_urut'] = $this->nomorUrutBerikutnya((int) $data['id_ujian']);
            }

            return Soal::create($data);
        });

        return response()->json([
            'success' => true,
            'message' => 'Soal berhasil ditambahkan.',
            'data'    => $soal,
        ], 201);
    }

    /**
     * POST /api/soal/batch (admin)
     * Tambah beberapa soal sekaligus (mis. 5, 10, 20… hingga total 100 soal per ujian).
     * Body: { id_ujian, soal: [ { teks_soal, opsi_a..e, kunci_jawaban, nomor_urut? }, ... ] }
     */
    public function batchStore(Request $request)
    {
        $validated = $request->validate([
            'id_ujian'               => ['required', 'integer', 'exists:ujian,id_ujian'],
            'soal'                   => ['required', 'array', 'min:1', 'max:' . self::MAKS_SOAL],
            'soal.*.nomor_urut'      => ['nullable', 'integer', 'min:1', 'max:' . self::MAKS_SOAL],
            'soal.*.teks_soal'       => ['required', 'string'],
            'soal.*.opsi_a'          => ['required', 'string'],
            'soal.*.opsi_b'          => ['required', 'string'],
            'soal.*.opsi_c'          => ['required', 'string'],
            'soal.*.opsi_d'          => ['required', 'string'],
            'soal.*.opsi_e'          => ['nullable', 'string'],
            'soal.*.kunci_jawaban'   => ['required', 'in:A,B,C,D,E'],
        ]);

        $idUjian = (int) $validated['id_ujian'];
        $items = $validated['soal'];

        $dibuat = DB::transaction(function () use ($idUjian, $items) {
            $terpakai = Soal::where('id_ujian', $idUjian)
                ->lockForUpdate()
                ->pluck('nomor_urut')
                ->map(fn ($n) => (int) $n)
                ->all();

            $sisaSlot = self::MAKS_SOAL - count($terpakai);
            if (count($items) > $sisaSlot) {
                throw ValidationException::withMessages([
                    'soal' => [
                        $sisaSlot <= 0
                            ? 'Ujian ini sudah memiliki ' . self::MAKS_SOAL . ' soal (batas maksimal).'
                            : "Hanya tersisa {$sisaSlot} slot soal lagi (maksimal " . self::MAKS_SOAL . ' soal per ujian).',
                    ],
                ]);
            }

            $setTerpakai = array_fill_keys($terpakai, true);
            $hasil = [];

            foreach ($items as $idx => $item) {
                $no = ! empty($item['nomor_urut']) ? (int) $item['nomor_urut'] : null;
                if ($no !== null && isset($setTerpakai[$no])) {
                    throw ValidationException::withMessages([
                        "soal.{$idx}.nomor_urut" => ["Nomor urut {$no} sudah dipakai pada ujian ini."],
                    ]);
                }
                if ($no === null) {
                    for ($k = 1; $k <= self::MAKS_SOAL; $k++) {
                        if (! isset($setTerpakai[$k])) {
                            $no = $k;
                            break;
                        }
                    }
                }
                $setTerpakai[$no] = true;

                $hasil[] = Soal::create([
                    'id_ujian'      => $idUjian,
                    'nomor_urut'    => $no,
                    'teks_soal'     => $item['teks_soal'],
                    'opsi_a'        => $item['opsi_a'],
                    'opsi_b'        => $item['opsi_b'],
                    'opsi_c'        => $item['opsi_c'],
                    'opsi_d'        => $item['opsi_d'],
                    'opsi_e'        => $item['opsi_e'] ?? '',
                    'kunci_jawaban' => $item['kunci_jawaban'],
                ]);
            }

            return $hasil;
        });

        return response()->json([
            'success' => true,
            'message' => count($dibuat) . ' soal berhasil ditambahkan.',
            'data'    => $dibuat,
        ], 201);
    }

    /** PUT /api/soal/{id} (admin) */
    public function update(Request $request, $id)
    {
        $soal = Soal::findOrFail($id);
        $data = $this->validasi($request, $soal);

        if (empty($data['nomor_urut'])) {
            unset($data['nomor_urut']);
        }

        $soal->update($data);

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

    private function validasi(Request $request, ?Soal $existing = null): array
    {
        $idUjian = (int) $request->input('id_ujian', $existing?->id_ujian);

        $uniqueNo = Rule::unique('soal', 'nomor_urut')
            ->where(fn ($q) => $q->where('id_ujian', $idUjian));
        if ($existing) {
            $uniqueNo->ignore($existing->id_soal, 'id_soal');
        }

        $data = $request->validate([
            'id_ujian'      => ['required', 'integer', 'exists:ujian,id_ujian'],
            'nomor_urut'    => ['nullable', 'integer', 'min:1', 'max:' . self::MAKS_SOAL, $uniqueNo],
            'teks_soal'     => ['required', 'string'],
            'opsi_a'        => ['required', 'string'],
            'opsi_b'        => ['required', 'string'],
            'opsi_c'        => ['required', 'string'],
            'opsi_d'        => ['required', 'string'],
            'opsi_e'        => ['nullable', 'string'],
            'kunci_jawaban' => ['required', 'in:A,B,C,D,E'],
        ], [
            'nomor_urut.max'    => 'Nomor urut soal maksimal ' . self::MAKS_SOAL . '.',
            'nomor_urut.unique' => 'Nomor urut tersebut sudah dipakai pada ujian ini.',
        ]);

        // kolom opsi_e bertipe NOT NULL di skema lama, simpan string kosong bila dikosongkan
        $data['opsi_e'] = $data['opsi_e'] ?? '';

        return $data;
    }

    /** Cari nomor urut terkecil yang belum terpakai (1..MAKS_SOAL). */
    private function nomorUrutBerikutnya(int $idUjian): int
    {
        $terpakai = Soal::where('id_ujian', $idUjian)
            ->pluck('nomor_urut')
            ->map(fn ($n) => (int) $n)
            ->flip();

        for ($no = 1; $no <= self::MAKS_SOAL; $no++) {
            if (! $terpakai->has($no)) {
                return $no;
            }
        }

        return self::MAKS_SOAL;
    }
}
