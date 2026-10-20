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
        Schema::create('soal', function (Blueprint $table) {
            $table->id('id_soal');
            $table->unsignedBigInteger('id_ujian');
            $table->unsignedInteger('nomor_urut');
            $table->text('teks_soal');
            $table->text('opsi_a');
            $table->text('opsi_b');
            $table->text('opsi_c');
            $table->text('opsi_d');
            $table->text('opsi_e');
            $table->enum('kunci_jawaban', ['A', 'B', 'C', 'D', 'E']);
            $table->timestamps();
            
            // Foreign Key
            $table->foreign('id_ujian')
                  ->references('id_ujian')
                  ->on('ujian')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            // Indexes
            $table->index('id_ujian');
            $table->unique(['id_ujian', 'nomor_urut']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('soal');
    }
};
