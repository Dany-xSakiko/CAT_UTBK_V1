-- ============================================
-- Schema Database Sistem CAT
-- Computer Assisted Test dengan Deteksi Kecurangan
-- ============================================

-- Tabel 1: PENGGUNA
-- Menyimpan data akun Admin dan Peserta
CREATE TABLE pengguna (
    id_user BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Peserta') NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel 2: UJIAN
-- Menyimpan data ujian yang diselenggarakan
CREATE TABLE ujian (
    id_ujian BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    judul_mata_kuliah VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    waktu_mulai TIME NOT NULL,
    waktu_selesai TIME NOT NULL,
    durasi_menit INT UNSIGNED NOT NULL,
    status_aktif BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tanggal (tanggal),
    INDEX idx_status (status_aktif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel 3: SOAL
-- Menyimpan soal pilihan ganda dan kunci jawaban
CREATE TABLE soal (
    id_soal BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ujian BIGINT UNSIGNED NOT NULL,
    nomor_urut INT UNSIGNED NOT NULL,
    teks_soal TEXT NOT NULL,
    opsi_a TEXT NOT NULL,
    opsi_b TEXT NOT NULL,
    opsi_c TEXT NOT NULL,
    opsi_d TEXT NOT NULL,
    opsi_e TEXT NOT NULL,
    kunci_jawaban ENUM('A', 'B', 'C', 'D', 'E') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ujian) REFERENCES ujian(id_ujian) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    INDEX idx_ujian (id_ujian),
    UNIQUE KEY unique_soal_ujian (id_ujian, nomor_urut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel 4: REKAM_JEJAK
-- Tabel induk yang mencatat setiap aktivitas peserta pada ujian
CREATE TABLE rekam_jejak (
    id_rekam_jejak BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_user BIGINT UNSIGNED NOT NULL,
    id_ujian BIGINT UNSIGNED NOT NULL,
    waktu_mulai TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_selesai TIMESTAMP NULL,
    skor_akhir DECIMAL(5,2) NULL,
    total_soal INT UNSIGNED DEFAULT 0,
    total_benar INT UNSIGNED DEFAULT 0,
    total_salah INT UNSIGNED DEFAULT 0,
    status_pengerjaan ENUM('sedang_mengerjakan', 'selesai', 'diskualifikasi') DEFAULT 'sedang_mengerjakan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES pengguna(id_user) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    FOREIGN KEY (id_ujian) REFERENCES ujian(id_ujian) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    INDEX idx_user (id_user),
    INDEX idx_ujian (id_ujian),
    INDEX idx_status (status_pengerjaan),
    UNIQUE KEY unique_user_ujian (id_user, id_ujian)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel 5: JAWABAN_PESERTA
-- Turunan REKAM_JEJAK, menyimpan jawaban yang dipilih peserta
CREATE TABLE jawaban_peserta (
    id_jawaban BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_rekam_jejak BIGINT UNSIGNED NOT NULL,
    id_soal BIGINT UNSIGNED NOT NULL,
    jawaban_dipilih ENUM('A', 'B', 'C', 'D', 'E') NULL,
    status_benar_salah BOOLEAN NULL,
    waktu_dijawab TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rekam_jejak) REFERENCES rekam_jejak(id_rekam_jejak) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    FOREIGN KEY (id_soal) REFERENCES soal(id_soal) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    INDEX idx_rekam_jejak (id_rekam_jejak),
    INDEX idx_soal (id_soal),
    UNIQUE KEY unique_rekam_jejak_soal (id_rekam_jejak, id_soal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel 6: LOG_PROCTORING
-- Turunan REKAM_JEJAK, menyimpan pelanggaran hasil deteksi kamera
CREATE TABLE log_proctoring (
    id_log BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_rekam_jejak BIGINT UNSIGNED NOT NULL,
    id_user BIGINT UNSIGNED NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    jenis_pelanggaran ENUM('Normal', 'No Face', 'Multiple Faces', 'Looking Away', 'Suspicious Activity') NOT NULL,
    bukti_screenshot VARCHAR(500) NULL,
    keterangan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rekam_jejak) REFERENCES rekam_jejak(id_rekam_jejak) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    FOREIGN KEY (id_user) REFERENCES pengguna(id_user) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    INDEX idx_rekam_jejak (id_rekam_jejak),
    INDEX idx_user (id_user),
    INDEX idx_timestamp (timestamp),
    INDEX idx_jenis_pelanggaran (jenis_pelanggaran)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data untuk Testing
-- ============================================

-- Insert Admin User
INSERT INTO pengguna (username, password, nama_lengkap, role, email) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'Admin', 'admin@cat-system.test'),
('peserta_001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Achmaddany Rozaqy', 'Peserta', 'dany@student.test'),
('peserta_002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Shandy Prasetyo', 'Peserta', 'shandy@student.test');

-- Insert Sample Ujian
INSERT INTO ujian (judul_mata_kuliah, tanggal, waktu_mulai, waktu_selesai, durasi_menit, status_aktif) VALUES
('Pemrograman Web Lanjut', '2026-10-15', '08:00:00', '10:00:00', 120, TRUE),
('Basis Data', '2026-10-16', '13:00:00', '15:00:00', 120, FALSE);
