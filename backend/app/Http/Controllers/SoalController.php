<?php

namespace App\Http\Controllers;

use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
            ->map(fn (Soal $s) => $this->format($s));

        return response()->json([
            'success'   => true,
            'data'      => $soal,
            'maks_soal' => self::MAKS_SOAL,
        ]);
    }

    /**
     * GET /api/soal/bank?exclude_ujian=1 (admin)
     * Menampilkan seluruh butir soal (beserta gambarnya) yang ada di Bank Soal lintas ujian.
     */
    public function bank(Request $request)
    {
        $query = Soal::with('ujian:id_ujian,judul_mata_kuliah')
            ->orderByDesc('gambar_soal')
            ->orderBy('id_ujian')
            ->orderBy('nomor_urut');

        if ($request->filled('exclude_ujian')) {
            $query->where('id_ujian', '!=', $request->integer('exclude_ujian'));
        }
        if ($request->boolean('hanya_bergambar')) {
            $query->whereNotNull('gambar_soal')->where('gambar_soal', '!=', '');
        }

        $items = $query->get()->map(fn (Soal $s) => array_merge($this->format($s), [
            'judul_mata_kuliah' => $s->ujian?->judul_mata_kuliah,
        ]));

        return response()->json([
            'success' => true,
            'data'    => $items,
        ]);
    }

    /**
     * POST /api/soal/salin (admin)
     * Menyalin butir soal (termasuk file gambarnya) dari Bank Soal ke suatu ujian.
     * Body: { id_ujian, id_soal: [1, 2, 3, ...] }
     */
    public function salinDariBank(Request $request)
    {
        $validated = $request->validate([
            'id_ujian'   => ['required', 'integer', 'exists:ujian,id_ujian'],
            'id_soal'    => ['required', 'array', 'min:1', 'max:' . self::MAKS_SOAL],
            'id_soal.*'  => ['required', 'integer', 'exists:soal,id_soal'],
        ]);

        $idUjian = (int) $validated['id_ujian'];
        $sumber = Soal::whereIn('id_soal', $validated['id_soal'])->orderBy('id_soal')->get();

        $disalin = DB::transaction(function () use ($idUjian, $sumber) {
            $terpakai = Soal::where('id_ujian', $idUjian)
                ->lockForUpdate()
                ->pluck('nomor_urut')
                ->map(fn ($n) => (int) $n)
                ->all();

            $sisaSlot = self::MAKS_SOAL - count($terpakai);
            if ($sumber->count() > $sisaSlot) {
                throw ValidationException::withMessages([
                    'id_soal' => [
                        $sisaSlot <= 0
                            ? 'Ujian tujuan sudah penuh (' . self::MAKS_SOAL . ' soal).'
                            : "Hanya tersisa {$sisaSlot} slot soal pada ujian tujuan.",
                    ],
                ]);
            }

            $setTerpakai = array_fill_keys($terpakai, true);
            $hasil = [];

            foreach ($sumber as $asal) {
                $no = null;
                for ($k = 1; $k <= self::MAKS_SOAL; $k++) {
                    if (! isset($setTerpakai[$k])) {
                        $no = $k;
                        break;
                    }
                }
                $setTerpakai[$no] = true;

                // Duplikasikan file gambar di storage agar independen dari soal asal
                $gambarBaru = null;
                if ($asal->gambar_soal && Storage::disk('public')->exists($asal->gambar_soal)) {
                    $ext = pathinfo($asal->gambar_soal, PATHINFO_EXTENSION) ?: 'jpg';
                    $gambarBaru = 'soal/soal_' . $idUjian . '_' . time() . '_' . uniqid() . '.' . $ext;
                    Storage::disk('public')->copy($asal->gambar_soal, $gambarBaru);
                }

                $hasil[] = Soal::create([
                    'id_ujian'      => $idUjian,
                    'nomor_urut'    => $no,
                    'teks_soal'     => $asal->teks_soal,
                    'gambar_soal'   => $gambarBaru,
                    'opsi_a'        => $asal->opsi_a,
                    'opsi_b'        => $asal->opsi_b,
                    'opsi_c'        => $asal->opsi_c,
                    'opsi_d'        => $asal->opsi_d,
                    'opsi_e'        => $asal->opsi_e ?? '',
                    'kunci_jawaban' => $asal->kunci_jawaban,
                ]);
            }

            return $hasil;
        });

        return response()->json([
            'success' => true,
            'message' => count($disalin) . ' soal berhasil diambil dari Bank Soal.',
            'data'    => array_map(fn (Soal $s) => $this->format($s), $disalin),
        ], 201);
    }

    /** POST /api/soal (admin) — mendukung JSON maupun multipart/form-data (dengan gambar_soal) */
    public function store(Request $request)
    {
        $data = $this->validasi($request);

        if ($request->hasFile('gambar_soal')) {
            $data['gambar_soal'] = $this->simpanGambar($request->file('gambar_soal'), (int) $data['id_ujian']);
        }

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
            'data'    => $this->format($soal),
        ], 201);
    }

    /**
     * POST /api/soal/batch (admin)
     * Tambah beberapa soal sekaligus (hingga total 100 soal per ujian), mendukung gambar per soal.
     */
    public function batchStore(Request $request)
    {
        $validated = $request->validate([
            'id_ujian'               => ['required', 'integer', 'exists:ujian,id_ujian'],
            'soal'                   => ['required', 'array', 'min:1', 'max:' . self::MAKS_SOAL],
            'soal.*.nomor_urut'      => ['nullable', 'integer', 'min:1', 'max:' . self::MAKS_SOAL],
            'soal.*.teks_soal'       => ['required', 'string'],
            'soal.*.gambar_soal'     => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:4096'],
            'soal.*.opsi_a'          => ['required', 'string'],
            'soal.*.opsi_b'          => ['required', 'string'],
            'soal.*.opsi_c'          => ['required', 'string'],
            'soal.*.opsi_d'          => ['required', 'string'],
            'soal.*.opsi_e'          => ['nullable', 'string'],
            'soal.*.kunci_jawaban'   => ['required', 'in:A,B,C,D,E'],
        ]);

        $idUjian = (int) $validated['id_ujian'];
        $items = $validated['soal'];

        $dibuat = DB::transaction(function () use ($request, $idUjian, $items) {
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

                $file = $request->file("soal.{$idx}.gambar_soal");
                $gambarPath = $file instanceof UploadedFile ? $this->simpanGambar($file, $idUjian) : null;

                $hasil[] = Soal::create([
                    'id_ujian'      => $idUjian,
                    'nomor_urut'    => $no,
                    'teks_soal'     => $item['teks_soal'],
                    'gambar_soal'   => $gambarPath,
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
            'data'    => array_map(fn (Soal $s) => $this->format($s), $dibuat),
        ], 201);
    }

    /** PUT / POST /api/soal/{id} (admin) */
    public function update(Request $request, $id)
    {
        $soal = Soal::findOrFail($id);
        $data = $this->validasi($request, $soal);

        if (empty($data['nomor_urut'])) {
            unset($data['nomor_urut']);
        }

        if ($request->hasFile('gambar_soal')) {
            $this->hapusFileGambar($soal->gambar_soal);
            $data['gambar_soal'] = $this->simpanGambar($request->file('gambar_soal'), (int) $data['id_ujian']);
        } elseif ($request->boolean('hapus_gambar')) {
            $this->hapusFileGambar($soal->gambar_soal);
            $data['gambar_soal'] = null;
        } else {
            unset($data['gambar_soal']);
        }

        $soal->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Soal berhasil diperbarui.',
            'data'    => $this->format($soal->fresh()),
        ]);
    }

    /** DELETE /api/soal/{id} (admin) */
    public function destroy($id)
    {
        $soal = Soal::findOrFail($id);
        $this->hapusFileGambar($soal->gambar_soal);
        $soal->delete();

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
            'gambar_soal'   => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:4096'],
            'opsi_a'        => ['required', 'string'],
            'opsi_b'        => ['required', 'string'],
            'opsi_c'        => ['required', 'string'],
            'opsi_d'        => ['required', 'string'],
            'opsi_e'        => ['nullable', 'string'],
            'kunci_jawaban' => ['required', 'in:A,B,C,D,E'],
        ], [
            'nomor_urut.max'    => 'Nomor urut soal maksimal ' . self::MAKS_SOAL . '.',
            'nomor_urut.unique' => 'Nomor urut tersebut sudah dipakai pada ujian ini.',
            'gambar_soal.image' => 'File lampiran soal harus berupa gambar (JPG, PNG, WEBP, atau GIF).',
            'gambar_soal.max'   => 'Ukuran gambar soal maksimal 4 MB.',
        ]);

        $data['opsi_e'] = $data['opsi_e'] ?? '';

        return $data;
    }

    private function simpanGambar(UploadedFile $file, int $idUjian): string
    {
        $ext = strtolower($file->extension() ?: 'jpg');
        $filename = 'soal_' . $idUjian . '_' . time() . '_' . uniqid() . '.' . $ext;

        return $file->storeAs('soal', $filename, 'public');
    }

    private function hapusFileGambar(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function format(Soal $s): array
    {
        return [
            'id_soal'       => $s->id_soal,
            'id_ujian'      => $s->id_ujian,
            'nomor_urut'    => $s->nomor_urut,
            'teks_soal'     => $s->teks_soal,
            'gambar_soal'   => $s->gambar_soal,
            'gambar_url'    => $s->gambar_url,
            'opsi'          => [
                'A' => $s->opsi_a,
                'B' => $s->opsi_b,
                'C' => $s->opsi_c,
                'D' => $s->opsi_d,
                'E' => $s->opsi_e,
            ],
            'kunci_jawaban' => $s->kunci_jawaban,
        ];
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
