<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    protected $casts = [
        'tanggal' => 'date',
        'waktu_mulai' => 'datetime:H:i:s',
        'waktu_selesai' => 'datetime:H:i:s',
        'status_aktif' => 'boolean',
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

    /** serialisasi tanggal pakai zona waktu aplikasi (tanpa konversi UTC) */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }
}
