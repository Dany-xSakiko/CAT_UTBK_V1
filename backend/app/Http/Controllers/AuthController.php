<?php

namespace App\Http\Controllers;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/login
     * Body: { username, password, role? }
     * role opsional — kalau dikirim, harus cocok dengan role akun.
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'role'     => ['nullable', 'in:Admin,Peserta'],
        ]);

        /** @var Pengguna|null $user */
        $user = Pengguna::where('username', $data['username'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
        }

        if (! empty($data['role']) && $user->role !== $data['role']) {
            throw ValidationException::withMessages([
                'username' => ["Akun ini terdaftar sebagai {$user->role}. Pilih tab {$user->role} untuk masuk."],
            ]);
        }

        // satu sesi aktif per akun: cabut token lama
        $user->tokens()->delete();
        $token = $user->createToken('cat-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->profil($user),
        ]);
    }

    /** GET /api/me */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user'    => $this->profil($request->user()),
        ]);
    }

    /** POST /api/logout */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['success' => true, 'message' => 'Berhasil keluar.']);
    }

    private function profil(Pengguna $user): array
    {
        return [
            'id_user'      => $user->id_user,
            'username'     => $user->username,
            'nama_lengkap' => $user->nama_lengkap,
            'role'         => $user->role,
            'email'        => $user->email,
        ];
    }
}
