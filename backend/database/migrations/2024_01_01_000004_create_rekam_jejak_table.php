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
        Schema::create('rekam_jejak', function (Blueprint $table) {
            $table->id('id_rekam_jejak');
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_ujian');
            $table->timestamp('waktu_mulai')->useCurrent();
            $table->timestamp('waktu_selesai')->nullable();
            $table->decimal('skor_akhir', 5, 2)->nullable();
            $table->unsignedInteger('total_soal')->default(0);
            $table->unsignedInteger('total_benar')->default(0);
            $table->unsignedInteger('total_salah')->default(0);
            $table->enum('status_pengerjaan', ['sedang_mengerjakan', 'selesai', 'diskualifikasi'])
                  ->default('sedang_mengerjakan');
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('id_user')
                  ->references('id_user')
                  ->on('pengguna')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('id_ujian')
                  ->references('id_ujian')
                  ->on('ujian')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            // Indexes
            $table->index('id_user');
            $table->index('id_ujian');
            $table->index('status_pengerjaan');
            $table->unique(['id_user', 'id_ujian']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rekam_jejak');
    }
};
