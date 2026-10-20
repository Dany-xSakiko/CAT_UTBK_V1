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
        Schema::create('jawaban_peserta', function (Blueprint $table) {
            $table->id('id_jawaban');
            $table->unsignedBigInteger('id_rekam_jejak');
            $table->unsignedBigInteger('id_soal');
            $table->enum('jawaban_dipilih', ['A', 'B', 'C', 'D', 'E'])->nullable();
            $table->boolean('status_benar_salah')->nullable();
            $table->timestamp('waktu_dijawab')->nullable();
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('id_rekam_jejak')
                  ->references('id_rekam_jejak')
                  ->on('rekam_jejak')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('id_soal')
                  ->references('id_soal')
                  ->on('soal')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            // Indexes
            $table->index('id_rekam_jejak');
            $table->index('id_soal');
            $table->unique(['id_rekam_jejak', 'id_soal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jawaban_peserta');
    }
};
