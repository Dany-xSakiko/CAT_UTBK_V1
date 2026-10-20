<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Truncate tables (development only)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('log_proctoring')->truncate();
        DB::table('jawaban_peserta')->truncate();
        DB::table('rekam_jejak')->truncate();
        DB::table('soal')->truncate();
        DB::table('ujian')->truncate();
        DB::table('pengguna')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Seed data
        $this->seedPengguna();
        $this->seedUjian();
        $this->seedSoal();
        $this->seedRekamJejak();
        $this->seedJawabanPeserta();
        $this->seedLogProctoring();

        $this->command->info('✅ Database seeding completed successfully!');
    }

    private function seedPengguna()
    {
        DB::table('pengguna')->insert([
            [
                'username' => 'admin',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Administrator System',
                'role' => 'Admin',
                'email' => 'admin@cat-system.test',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'username' => 'peserta_001',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Achmaddany Rozaqy',
                'role' => 'Peserta',
                'email' => 'dany@student.test',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'username' => 'peserta_002',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Shandy Prasetyo',
                'role' => 'Peserta',
                'email' => 'shandy@student.test',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'username' => 'peserta_003',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Muhammad Tamimudin',
                'role' => 'Peserta',
                'email' => 'tamim@student.test',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'username' => 'peserta_004',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Galih Bagus Kurniawan',
                'role' => 'Peserta',
                'email' => 'galih@student.test',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('✓ Pengguna seeded');
    }

    private function seedUjian()
    {
        DB::table('ujian')->insert([
            [
                'judul_mata_kuliah' => 'Pemrograman Web Lanjut',
                'tanggal' => '2026-10-15',
                'waktu_mulai' => '08:00:00',
                'waktu_selesai' => '10:00:00',
                'durasi_menit' => 120,
                'status_aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'judul_mata_kuliah' => 'Basis Data',
                'tanggal' => '2026-10-16',
                'waktu_mulai' => '13:00:00',
                'waktu_selesai' => '15:00:00',
                'durasi_menit' => 120,
                'status_aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'judul_mata_kuliah' => 'Kecerdasan Buatan',
                'tanggal' => '2026-10-17',
                'waktu_mulai' => '08:00:00',
                'waktu_selesai' => '09:30:00',
                'durasi_menit' => 90,
                'status_aktif' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('✓ Ujian seeded');
    }

    private function seedSoal()
    {
        // Soal untuk Pemrograman Web Lanjut
        $soalWebLanjut = [
            [
                'id_ujian' => 1,
                'nomor_urut' => 1,
                'teks_soal' => 'Apa kepanjangan dari MVC?',
                'opsi_a' => 'Model View Controller',
                'opsi_b' => 'Model Visual Control',
                'opsi_c' => 'Modern View Controller',
                'opsi_d' => 'Module View Code',
                'opsi_e' => 'Model Virtual Container',
                'kunci_jawaban' => 'A',
            ],
            [
                'id_ujian' => 1,
                'nomor_urut' => 2,
                'teks_soal' => 'Framework Laravel menggunakan bahasa pemrograman apa?',
                'opsi_a' => 'JavaScript',
                'opsi_b' => 'Python',
                'opsi_c' => 'PHP',
                'opsi_d' => 'Ruby',
                'opsi_e' => 'Java',
                'kunci_jawaban' => 'C',
            ],
            [
                'id_ujian' => 1,
                'nomor_urut' => 3,
                'teks_soal' => 'Apa fungsi dari Middleware di Laravel?',
                'opsi_a' => 'Menghubungkan database',
                'opsi_b' => 'Memfilter HTTP request',
                'opsi_c' => 'Menampilkan view',
                'opsi_d' => 'Membuat model',
                'opsi_e' => 'Routing URL',
                'kunci_jawaban' => 'B',
            ],
        ];

        // Soal untuk Basis Data
        $soalBasisData = [
            [
                'id_ujian' => 2,
                'nomor_urut' => 1,
                'teks_soal' => 'Perintah SQL untuk mengambil data adalah?',
                'opsi_a' => 'INSERT',
                'opsi_b' => 'UPDATE',
                'opsi_c' => 'DELETE',
                'opsi_d' => 'SELECT',
                'opsi_e' => 'CREATE',
                'kunci_jawaban' => 'D',
            ],
            [
                'id_ujian' => 2,
                'nomor_urut' => 2,
                'teks_soal' => 'Apa kepanjangan dari DBMS?',
                'opsi_a' => 'Data Base Management System',
                'opsi_b' => 'Digital Base Management System',
                'opsi_c' => 'Data Binary Management Service',
                'opsi_d' => 'Database Business Management',
                'opsi_e' => 'Data Block Management',
                'kunci_jawaban' => 'A',
            ],
        ];

        foreach (array_merge($soalWebLanjut, $soalBasisData) as $soal) {
            DB::table('soal')->insert(array_merge($soal, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $this->command->info('✓ Soal seeded');
    }

    private function seedRekamJejak()
    {
        DB::table('rekam_jejak')->insert([
            [
                'id_user' => 2, // Achmaddany
                'id_ujian' => 1, // Pemrograman Web
                'waktu_mulai' => now()->subHours(2),
                'waktu_selesai' => now()->subHour(),
                'skor_akhir' => 85.50,
                'total_soal' => 3,
                'total_benar' => 2,
                'total_salah' => 1,
                'status_pengerjaan' => 'selesai',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_user' => 3, // Shandy
                'id_ujian' => 1, // Pemrograman Web
                'waktu_mulai' => now()->subHours(2),
                'waktu_selesai' => now()->subMinutes(30),
                'skor_akhir' => 92.00,
                'total_soal' => 3,
                'total_benar' => 3,
                'total_salah' => 0,
                'status_pengerjaan' => 'selesai',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_user' => 4, // Tamim
                'id_ujian' => 2, // Basis Data
                'waktu_mulai' => now()->subMinutes(45),
                'waktu_selesai' => null,
                'skor_akhir' => null,
                'total_soal' => 0,
                'total_benar' => 0,
                'total_salah' => 0,
                'status_pengerjaan' => 'sedang_mengerjakan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('✓ Rekam Jejak seeded');
    }

    private function seedJawabanPeserta()
    {
        // Jawaban Achmaddany
        DB::table('jawaban_peserta')->insert([
            [
                'id_rekam_jejak' => 1,
                'id_soal' => 1,
                'jawaban_dipilih' => 'A',
                'status_benar_salah' => true,
                'waktu_dijawab' => now()->subHours(2)->addMinutes(5),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_rekam_jejak' => 1,
                'id_soal' => 2,
                'jawaban_dipilih' => 'C',
                'status_benar_salah' => true,
                'waktu_dijawab' => now()->subHours(2)->addMinutes(10),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_rekam_jejak' => 1,
                'id_soal' => 3,
                'jawaban_dipilih' => 'A',
                'status_benar_salah' => false,
                'waktu_dijawab' => now()->subHours(2)->addMinutes(15),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('✓ Jawaban Peserta seeded');
    }

    private function seedLogProctoring()
    {
        $logs = [
            // Achmaddany - banyak pelanggaran
            ['id_rekam_jejak' => 1, 'id_user' => 2, 'timestamp' => now()->subHours(2)->addMinutes(3), 'jenis_pelanggaran' => 'Normal'],
            ['id_rekam_jejak' => 1, 'id_user' => 2, 'timestamp' => now()->subHours(2)->addMinutes(6), 'jenis_pelanggaran' => 'No Face'],
            ['id_rekam_jejak' => 1, 'id_user' => 2, 'timestamp' => now()->subHours(2)->addMinutes(9), 'jenis_pelanggaran' => 'No Face'],
            ['id_rekam_jejak' => 1, 'id_user' => 2, 'timestamp' => now()->subHours(2)->addMinutes(12), 'jenis_pelanggaran' => 'Multiple Faces'],
            ['id_rekam_jejak' => 1, 'id_user' => 2, 'timestamp' => now()->subHours(2)->addMinutes(15), 'jenis_pelanggaran' => 'Normal'],
            ['id_rekam_jejak' => 1, 'id_user' => 2, 'timestamp' => now()->subHours(2)->addMinutes(18), 'jenis_pelanggaran' => 'Looking Away'],
            
            // Shandy - sedikit pelanggaran
            ['id_rekam_jejak' => 2, 'id_user' => 3, 'timestamp' => now()->subHours(2)->addMinutes(2), 'jenis_pelanggaran' => 'Normal'],
            ['id_rekam_jejak' => 2, 'id_user' => 3, 'timestamp' => now()->subHours(2)->addMinutes(5), 'jenis_pelanggaran' => 'Normal'],
            ['id_rekam_jejak' => 2, 'id_user' => 3, 'timestamp' => now()->subHours(2)->addMinutes(8), 'jenis_pelanggaran' => 'No Face'],
            ['id_rekam_jejak' => 2, 'id_user' => 3, 'timestamp' => now()->subHours(2)->addMinutes(11), 'jenis_pelanggaran' => 'Normal'],
            
            // Tamim - sedang mengerjakan
            ['id_rekam_jejak' => 3, 'id_user' => 4, 'timestamp' => now()->subMinutes(42), 'jenis_pelanggaran' => 'Normal'],
            ['id_rekam_jejak' => 3, 'id_user' => 4, 'timestamp' => now()->subMinutes(39), 'jenis_pelanggaran' => 'Normal'],
            ['id_rekam_jejak' => 3, 'id_user' => 4, 'timestamp' => now()->subMinutes(36), 'jenis_pelanggaran' => 'Multiple Faces'],
        ];

        foreach ($logs as $log) {
            DB::table('log_proctoring')->insert(array_merge($log, [
                'bukti_screenshot' => null,
                'keterangan' => 'Deteksi otomatis dari AI',
                'created_at' => $log['timestamp'],
            ]));
        }

        $this->command->info('✓ Log Proctoring seeded');
    }
}
