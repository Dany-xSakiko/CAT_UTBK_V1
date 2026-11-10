<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('soal', 'gambar_soal')) {
            Schema::table('soal', function (Blueprint $table) {
                $table->string('gambar_soal')->nullable()->after('teks_soal');
            });
        }

        if (! Schema::hasColumn('ujian', 'acak_soal')) {
            Schema::table('ujian', function (Blueprint $table) {
                $table->boolean('acak_soal')->default(true)->after('status_aktif');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('soal', 'gambar_soal')) {
            Schema::table('soal', function (Blueprint $table) {
                $table->dropColumn('gambar_soal');
            });
        }

        if (Schema::hasColumn('ujian', 'acak_soal')) {
            Schema::table('ujian', function (Blueprint $table) {
                $table->dropColumn('acak_soal');
            });
        }
    }
};
