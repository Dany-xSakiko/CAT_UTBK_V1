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
        Schema::create('log_proctoring', function (Blueprint $table) {
            $table->id('id_log');
            $table->unsignedBigInteger('id_rekam_jejak');
            $table->unsignedBigInteger('id_user');
            $table->timestamp('timestamp')->useCurrent();
            $table->enum('jenis_pelanggaran', [
                'Normal', 
                'No Face', 
                'Multiple Faces', 
                'Looking Away', 
                'Suspicious Activity'
            ]);
            $table->string('bukti_screenshot', 500)->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            // Foreign Keys
            $table->foreign('id_rekam_jejak')
                  ->references('id_rekam_jejak')
                  ->on('rekam_jejak')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('id_user')
                  ->references('id_user')
                  ->on('pengguna')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            // Indexes
            $table->index('id_rekam_jejak');
            $table->index('id_user');
            $table->index('timestamp');
            $table->index('jenis_pelanggaran');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_proctoring');
    }
};
