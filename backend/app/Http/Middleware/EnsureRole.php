<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Pakai: ->middleware('role:Admin') atau ->middleware('role:Admin,Peserta')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Halaman ini hanya untuk ' . implode(' / ', $roles) . '.',
            ], 403);
        }

        return $next($request);
    }
}
