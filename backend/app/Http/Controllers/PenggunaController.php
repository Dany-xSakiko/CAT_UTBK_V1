<?php

namespace App\Http\Controllers;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PenggunaController extends Controller
{
    /** GET /api/pengguna (admin) */
    public function index(Request $request)
    {
        $q = Pengguna::query()->orderByRaw("FIELD(role, 'Admin', 'Peserta')")->orderBy('nama_lengkap');

        if ($request->filled('role')) {
            $q->where('role', $request->string('role'));
        }
        if ($request->filled('cari')) {
            $cari = '%' . $request->string('cari') . '%';
            $q->where(function ($w) use ($cari) {
                $w->where('nama_lengkap', 'like', $cari)
                  ->orWhere('username', 'like', $cari)
                  ->orWhere('email', 'like', $cari);
            });
        }

        return response()->json(['success' => true, 'data' => $q->get()]);
    }

    /** POST /api/pengguna (admin) */
    public function store(Request $request)
    {
        $data = $request->validate([
            'username'     => ['required', 'string', 'max:100', 'unique:pengguna,username'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email'        => ['nullable', 'email', 'max:255', 'unique:pengguna,email'],
            'role'         => ['required', 'in:Admin,Peserta'],
            'password'     => ['required', 'string', 'min:6'],
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = Pengguna::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan.',
            'data'    => $user,
        ], 201);
    }

    /** PUT /api/pengguna/{id} (admin) */
    public function update(Request $request, $id)
    {
        $user = Pengguna::findOrFail($id);

        $data = $request->validate([
            'username'     => ['required', 'string', 'max:100', Rule::unique('pengguna', 'username')->ignore($user->id_user, 'id_user')],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email'        => ['nullable', 'email', 'max:255', Rule::unique('pengguna', 'email')->ignore($user->id_user, 'id_user')],
            'role'         => ['required', 'in:Admin,Peserta'],
            'password'     => ['nullable', 'string', 'min:6'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil diperbarui.',
            'data'    => $user->fresh(),
        ]);
    }

    /** DELETE /api/pengguna/{id} (admin) */
    public function destroy(Request $request, $id)
    {
        $user = Pengguna::findOrFail($id);

        if ($user->id_user === $request->user()->id_user) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus akun yang sedang dipakai.',
            ], 422);
        }

        $user->delete();

        return response()->json(['success' => true, 'message' => 'Pengguna dihapus.']);
    }
}
