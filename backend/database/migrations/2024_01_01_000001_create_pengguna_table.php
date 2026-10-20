<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pengguna', function (Blueprint $table) {
            $table->id('id_user');
            $table->string('username', 100)->unique();
            $table->string('password');
            $table->string('nama_lengkap');
            $table->enum('role', ['Admin', 'Peserta']);
            $table->string('email')->unique()->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('username');
            $table->index('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengguna');
    }
};
