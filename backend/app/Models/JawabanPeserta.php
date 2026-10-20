<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JawabanPeserta extends Model
{
    use HasFactory;

    protected $table = 'jawaban_peserta';
    protected $primaryKey = 'id_jawaban';

    protected $fillable = [
        'id_rekam_jejak',
        'id_soal',
        'jawaban_dipilih',
        'status_benar_salah',
        'waktu_dijawab',
    ];

    protected $casts = [
        'jawaban_dipilih' => 'string',
        'status_benar_salah' => 'boolean',
        'waktu_dijawab' => 'datetime',
    ];

    /**
     * Relasi ke RekamJejak (Many to One)
     */
    public function rekamJejak()
    {
        return $this->belongsTo(RekamJejak::class, 'id_rekam_jejak', 'id_rekam_jejak');
    }

    /**
     * Relasi ke Soal (Many to One)
     */
    public function soal()
    {
        return $this->belongsTo(Soal::class, 'id_soal', 'id_soal');
    }

    /**
     * Cek dan set status benar/salah
     */
    public function cekJawaban()
    {
        $soal = $this->soal;
        
        if ($soal && $this->jawaban_dipilih) {
            $isBenar = $soal->isJawabanBenar($this->jawaban_dipilih);
            $this->update(['status_benar_salah' => $isBenar]);
            
            return $isBenar;
        }
        
        return false;
    }

    /** serialisasi tanggal pakai zona waktu aplikasi (tanpa konversi UTC) */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }
}
