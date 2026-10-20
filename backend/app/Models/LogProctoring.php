<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogProctoring extends Model
{
    use HasFactory;

    protected $table = 'log_proctoring';
    protected $primaryKey = 'id_log';
    
    // Tidak gunakan updated_at, hanya created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'id_rekam_jejak',
        'id_user',
        'timestamp',
        'jenis_pelanggaran',
        'bukti_screenshot',
        'keterangan',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'jenis_pelanggaran' => 'string',
    ];

    /**
     * Relasi ke RekamJejak (Many to One)
     */
    public function rekamJejak()
    {
        return $this->belongsTo(RekamJejak::class, 'id_rekam_jejak', 'id_rekam_jejak');
    }

    /**
     * Relasi ke Pengguna (Many to One)
     */
    public function pengguna()
    {
        return $this->belongsTo(Pengguna::class, 'id_user', 'id_user');
    }

    /**
     * Scope untuk filter berdasarkan jenis pelanggaran
     */
    public function scopePelanggaran($query)
    {
        return $query->whereIn('jenis_pelanggaran', [
            'No Face', 
            'Multiple Faces', 
            'Looking Away', 
            'Suspicious Activity'
        ]);
    }

    /**
     * Scope untuk filter normal
     */
    public function scopeNormal($query)
    {
        return $query->where('jenis_pelanggaran', 'Normal');
    }

    /**
     * Accessor untuk URL screenshot
     */
    public function getScreenshotUrlAttribute()
    {
        if ($this->bukti_screenshot) {
            return asset('storage/' . $this->bukti_screenshot);
        }
        return null;
    }

    /** serialisasi tanggal pakai zona waktu aplikasi (tanpa konversi UTC) */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }
}
