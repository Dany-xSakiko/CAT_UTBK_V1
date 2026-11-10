<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Ujian extends Model
{
    use HasFactory;

    protected $table = 'ujian';
    protected $primaryKey = 'id_ujian';

    protected $fillable = [
        'judul_mata_kuliah',
        'tanggal',
        'waktu_mulai',
        'waktu_selesai',
        'durasi_menit',
        'status_aktif',
        'acak_soal',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'waktu_mulai' => 'datetime:H:i:s',
        'waktu_selesai' => 'datetime:H:i:s',
        'status_aktif' => 'boolean',
        'acak_soal' => 'boolean',
        'durasi_menit' => 'integer',
    ];

    /**
     * Relasi ke Soal (One to Many)
     */
    public function soal()
    {
        return $this->hasMany(Soal::class, 'id_ujian', 'id_ujian');
    }

    /**
     * Relasi ke RekamJejak (One to Many)
     */
    public function rekamJejak()
    {
        return $this->hasMany(RekamJejak::class, 'id_ujian', 'id_ujian');
    }

    /**
     * Scope untuk filter ujian aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }

    /** Awal jendela jadwal ujian (tanggal + waktu_mulai). */
    public function jadwalMulai(): Carbon
    {
        return $this->gabungJadwal((string) ($this->attributes['waktu_mulai'] ?? '00:00:00'));
    }

    /** Akhir jendela jadwal ujian (tanggal + waktu_selesai). */
    public function jadwalSelesai(): Carbon
    {
        return $this->gabungJadwal((string) ($this->attributes['waktu_selesai'] ?? '23:59:59'));
    }

    /** 'belum' | 'berlangsung' | 'lewat' relatif terhadap sekarang. */
    public function statusJadwal(?Carbon $now = null): string
    {
        $now ??= now();
        if ($now->lt($this->jadwalMulai())) {
            return 'belum';
        }
        if ($now->gt($this->jadwalSelesai())) {
            return 'lewat';
        }

        return 'berlangsung';
    }

    private function gabungJadwal(string $jam): Carbon
    {
        $tgl = $this->tanggal instanceof \DateTimeInterface
            ? $this->tanggal->format('Y-m-d')
            : substr((string) ($this->attributes['tanggal'] ?? ''), 0, 10);

        // jam bisa "08:00" atau "08:00:00" atau datetime penuh
        $jam = strlen($jam) > 8 ? substr($jam, -8) : $jam;

        return Carbon::parse("{$tgl} {$jam}", config('app.timezone'));
    }

    /** serialisasi tanggal pakai zona waktu aplikasi (tanpa konversi UTC) */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }
}
