<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    use HasFactory;

    protected $table = 'soal';
    protected $primaryKey = 'id_soal';

    protected $fillable = [
        'id_ujian',
        'nomor_urut',
        'teks_soal',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'opsi_e',
        'kunci_jawaban',
    ];

    protected $casts = [
        'id_ujian' => 'integer',
        'nomor_urut' => 'integer',
        'kunci_jawaban' => 'string',
    ];

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
        return $this->hasMany(JawabanPeserta::class, 'id_soal', 'id_soal');
    }

    /**
     * Cek apakah jawaban benar
     */
    public function isJawabanBenar($jawaban)
    {
        return strtoupper($jawaban) === strtoupper($this->kunci_jawaban);
    }

    /** serialisasi tanggal pakai zona waktu aplikasi (tanpa konversi UTC) */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }
}
