<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengguna extends Model
{
    use HasFactory;

    protected $table = 'pengguna';
    protected $primaryKey = 'id_user';

    protected $fillable = [
        'username',
        'password',
        'nama_lengkap',
        'role',
        'email',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'role' => 'string',
    ];

    /**
     * Relasi ke RekamJejak (One to Many)
     */
    public function rekamJejak()
    {
        return $this->hasMany(RekamJejak::class, 'id_user', 'id_user');
    }

    /**
     * Relasi ke LogProctoring (One to Many)
     */
    public function logProctoring()
    {
        return $this->hasMany(LogProctoring::class, 'id_user', 'id_user');
    }

    /**
     * Scope untuk filter berdasarkan role
     */
    public function scopeAdmin($query)
    {
        return $query->where('role', 'Admin');
    }

    public function scopePeserta($query)
    {
        return $query->where('role', 'Peserta');
    }
}
