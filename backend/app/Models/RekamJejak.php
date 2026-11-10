<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class RekamJejak extends Model
{
    use HasFactory;

    protected $table = 'rekam_jejak';
    protected $primaryKey = 'id_rekam_jejak';

    protected $fillable = [
        'id_user',
        'id_ujian',
        'waktu_mulai',
        'waktu_selesai',
        'skor_akhir',
        'total_soal',
        'total_benar',
        'total_salah',
        'status_pengerjaan',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
        'skor_akhir' => 'decimal:2',
        'total_soal' => 'integer',
        'total_benar' => 'integer',
        'total_salah' => 'integer',
        'status_pengerjaan' => 'string',
    ];

    /**
     * Relasi ke Pengguna (Many to One)
     */
    public function pengguna()
    {
        return $this->belongsTo(Pengguna::class, 'id_user', 'id_user');
    }

    /**
     * Relasi ke Ujian (Many to One)
     */
    public function ujian()
    {
        return $this->belongsTo(Ujian::class, 'id_ujian', 'id_ujian');
    }

    /**
     * Relasi ke JawabanPeserta (One to Many)
     */
    public function jawabanPeserta()
    {
        return $this->hasMany(JawabanPeserta::class, 'id_rekam_jejak', 'id_rekam_jejak');
    }

    /**
     * Relasi ke LogProctoring (One to Many)
     */
    public function logProctoring()
    {
        return $this->hasMany(LogProctoring::class, 'id_rekam_jejak', 'id_rekam_jejak');
    }

    /**
     * Hitung skor berdasarkan jawaban
     */
    public function hitungSkor()
    {
        $totalBenar = $this->jawabanPeserta()
            ->where('status_benar_salah', true)
            ->count();
        
        $totalSoal = $this->jawabanPeserta()->count();
        
        if ($totalSoal > 0) {
            $skor = ($totalBenar / $totalSoal) * 100;
            
            $this->update([
                'total_benar' => $totalBenar,
                'total_salah' => $totalSoal - $totalBenar,
                'total_soal' => $totalSoal,
                'skor_akhir' => $skor,
            ]);
            
            return $skor;
        }
        
        return 0;
    }

    /**
     * Batas waktu pengerjaan: waktu_mulai + durasi, tetapi tidak melewati
     * akhir jadwal ujian (sesi UTBK ditutup serentak saat jadwal berakhir).
     */
    public function deadline(): ?Carbon
    {
        if (! $this->waktu_mulai || ! $this->ujian) {
            return null;
        }

        $batasDurasi = $this->waktu_mulai->copy()->addMinutes((int) $this->ujian->durasi_menit);
        $batasJadwal = $this->ujian->jadwalSelesai();

        return $batasDurasi->lt($batasJadwal) ? $batasDurasi : $batasJadwal;
    }

    public function sedangBerjalan(): bool
    {
        return $this->status_pengerjaan === 'sedang_mengerjakan';
    }

    public function lewatDeadline(?Carbon $now = null): bool
    {
        $deadline = $this->deadline();

        return $deadline !== null && ($now ?? now())->gte($deadline);
    }

    /**
     * Mengacak penempatan soal setiap kali peserta masuk sesi atau me-refresh halaman.
     * Jawaban peserta tetap aman karena disimpan berdasarkan id_soal.
     *
     * @param  \Illuminate\Support\Collection<int, \App\Models\Soal>  $soal
     * @return \Illuminate\Support\Collection<int, \App\Models\Soal>
     */
    public function urutkanSoalUntukPeserta($soal)
    {
        $this->loadMissing('ujian');
        if ($this->ujian && $this->ujian->acak_soal === false) {
            return $soal->values();
        }

        return $soal->shuffle()->values();
    }

    /** serialisasi tanggal pakai zona waktu aplikasi (tanpa konversi UTC) */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }
}
