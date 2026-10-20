<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProctoringLogRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Set true untuk development
        // Dalam production, tambahkan logic authorization
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_user' => 'required|integer|exists:pengguna,id_user',
            'id_rekam_jejak' => 'required|integer|exists:rekam_jejak,id_rekam_jejak',
            'jenis_pelanggaran' => 'required|in:Normal,No Face,Multiple Faces,Looking Away,Suspicious Activity',
            'bukti_screenshot' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'keterangan' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_user.required' => 'ID Peserta wajib diisi',
            'id_user.integer' => 'ID Peserta harus berupa angka',
            'id_user.exists' => 'ID Peserta tidak ditemukan dalam database',
            
            'id_rekam_jejak.required' => 'ID Rekam Jejak wajib diisi',
            'id_rekam_jejak.integer' => 'ID Rekam Jejak harus berupa angka',
            'id_rekam_jejak.exists' => 'ID Rekam Jejak tidak ditemukan dalam database',
            
            'jenis_pelanggaran.required' => 'Jenis pelanggaran wajib diisi',
            'jenis_pelanggaran.in' => 'Jenis pelanggaran tidak valid. Pilihan: Normal, No Face, Multiple Faces, Looking Away, Suspicious Activity',
            
            'bukti_screenshot.image' => 'File bukti harus berupa gambar',
            'bukti_screenshot.mimes' => 'Format gambar yang diperbolehkan: jpeg, png, jpg',
            'bukti_screenshot.max' => 'Ukuran gambar maksimal 2MB (2048 KB)',
            
            'keterangan.string' => 'Keterangan harus berupa teks',
            'keterangan.max' => 'Keterangan maksimal 500 karakter',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'id_user' => 'ID Peserta',
            'id_rekam_jejak' => 'ID Rekam Jejak',
            'jenis_pelanggaran' => 'Jenis Pelanggaran',
            'bukti_screenshot' => 'Bukti Screenshot',
            'keterangan' => 'Keterangan',
        ];
    }
}
