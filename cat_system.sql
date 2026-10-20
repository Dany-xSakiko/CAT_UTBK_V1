-- phpMyAdmin SQL Dump
-- version 6.0.0-dev+20261009.f80ee5387c
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 10, 2026 at 12:28 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cat_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `jawaban_peserta`
--
CREATE TABLE `jawaban_peserta` (
  `id_jawaban` bigint UNSIGNED NOT NULL,
  `id_rekam_jejak` bigint UNSIGNED NOT NULL,
  `id_soal` bigint UNSIGNED NOT NULL,
  `jawaban_dipilih` enum('A','B','C','D','E') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_benar_salah` tinyint(1) DEFAULT NULL,
  `waktu_dijawab` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `log_proctoring`
--
CREATE TABLE `log_proctoring` (
  `id_log` bigint UNSIGNED NOT NULL,
  `id_rekam_jejak` bigint UNSIGNED NOT NULL,
  `id_user` bigint UNSIGNED NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `jenis_pelanggaran` enum('Normal','No Face','Multiple Faces','Looking Away','Suspicious Activity') COLLATE utf8mb4_unicode_ci NOT NULL,
  `bukti_screenshot` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengguna`
--
CREATE TABLE `pengguna` (
  `id_user` bigint UNSIGNED NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Admin','Peserta') COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengguna`
--

INSERT INTO `pengguna` (`id_user`, `username`, `password`, `nama_lengkap`, `role`, `email`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'Admin', 'admin@cat-system.test', '2026-10-10 12:26:39', '2026-10-10 12:26:39'),
(2, 'peserta_001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Achmaddany Rozaqy', 'Peserta', 'dany@student.test', '2026-10-10 12:26:39', '2026-10-10 12:26:39'),
(3, 'peserta_002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Shandy Prasetyo', 'Peserta', 'shandy@student.test', '2026-10-10 12:26:39', '2026-10-10 12:26:39');

-- --------------------------------------------------------

--
-- Table structure for table `rekam_jejak`
--
CREATE TABLE `rekam_jejak` (
  `id_rekam_jejak` bigint UNSIGNED NOT NULL,
  `id_user` bigint UNSIGNED NOT NULL,
  `id_ujian` bigint UNSIGNED NOT NULL,
  `waktu_mulai` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `waktu_selesai` timestamp NULL DEFAULT NULL,
  `skor_akhir` decimal(5,2) DEFAULT NULL,
  `total_soal` int UNSIGNED DEFAULT '0',
  `total_benar` int UNSIGNED DEFAULT '0',
  `total_salah` int UNSIGNED DEFAULT '0',
  `status_pengerjaan` enum('sedang_mengerjakan','selesai','diskualifikasi') COLLATE utf8mb4_unicode_ci DEFAULT 'sedang_mengerjakan',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `soal`
--
CREATE TABLE `soal` (
  `id_soal` bigint UNSIGNED NOT NULL,
  `id_ujian` bigint UNSIGNED NOT NULL,
  `nomor_urut` int UNSIGNED NOT NULL,
  `teks_soal` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_a` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_b` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_c` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_d` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_e` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kunci_jawaban` enum('A','B','C','D','E') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ujian`
--
CREATE TABLE `ujian` (
  `id_ujian` bigint UNSIGNED NOT NULL,
  `judul_mata_kuliah` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `waktu_mulai` time NOT NULL,
  `waktu_selesai` time NOT NULL,
  `durasi_menit` int UNSIGNED NOT NULL,
  `status_aktif` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ujian`
--

INSERT INTO `ujian` (`id_ujian`, `judul_mata_kuliah`, `tanggal`, `waktu_mulai`, `waktu_selesai`, `durasi_menit`, `status_aktif`, `created_at`, `updated_at`) VALUES
(1, 'Pemrograman Web Lanjut', '2026-10-15', '08:00:00', '10:00:00', 120, 1, '2026-10-10 12:26:39', '2026-10-10 12:26:39'),
(2, 'Basis Data', '2026-10-16', '13:00:00', '15:00:00', 120, 0, '2026-10-10 12:26:39', '2026-10-10 12:26:39');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `jawaban_peserta`
--
ALTER TABLE `jawaban_peserta`
  ADD PRIMARY KEY (`id_jawaban`),
  ADD UNIQUE KEY `unique_rekam_jejak_soal` (`id_rekam_jejak`,`id_soal`),
  ADD KEY `idx_rekam_jejak` (`id_rekam_jejak`),
  ADD KEY `idx_soal` (`id_soal`);

--
-- Indexes for table `log_proctoring`
--
ALTER TABLE `log_proctoring`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `idx_rekam_jejak` (`id_rekam_jejak`),
  ADD KEY `idx_user` (`id_user`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_jenis_pelanggaran` (`jenis_pelanggaran`);

--
-- Indexes for table `pengguna`
--
ALTER TABLE `pengguna`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `rekam_jejak`
--
ALTER TABLE `rekam_jejak`
  ADD PRIMARY KEY (`id_rekam_jejak`),
  ADD UNIQUE KEY `unique_user_ujian` (`id_user`,`id_ujian`),
  ADD KEY `idx_user` (`id_user`),
  ADD KEY `idx_ujian` (`id_ujian`),
  ADD KEY `idx_status` (`status_pengerjaan`);

--
-- Indexes for table `soal`
--
ALTER TABLE `soal`
  ADD PRIMARY KEY (`id_soal`),
  ADD UNIQUE KEY `unique_soal_ujian` (`id_ujian`,`nomor_urut`),
  ADD KEY `idx_ujian` (`id_ujian`);

--
-- Indexes for table `ujian`
--
ALTER TABLE `ujian`
  ADD PRIMARY KEY (`id_ujian`),
  ADD KEY `idx_tanggal` (`tanggal`),
  ADD KEY `idx_status` (`status_aktif`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `jawaban_peserta`
--
ALTER TABLE `jawaban_peserta`
  MODIFY `id_jawaban` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `log_proctoring`
--
ALTER TABLE `log_proctoring`
  MODIFY `id_log` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengguna`
--
ALTER TABLE `pengguna`
  MODIFY `id_user` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `rekam_jejak`
--
ALTER TABLE `rekam_jejak`
  MODIFY `id_rekam_jejak` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `soal`
--
ALTER TABLE `soal`
  MODIFY `id_soal` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ujian`
--
ALTER TABLE `ujian`
  MODIFY `id_ujian` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `jawaban_peserta`
--
ALTER TABLE `jawaban_peserta`
  ADD CONSTRAINT `jawaban_peserta_ibfk_1` FOREIGN KEY (`id_rekam_jejak`) REFERENCES `rekam_jejak` (`id_rekam_jejak`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `jawaban_peserta_ibfk_2` FOREIGN KEY (`id_soal`) REFERENCES `soal` (`id_soal`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `log_proctoring`
--
ALTER TABLE `log_proctoring`
  ADD CONSTRAINT `log_proctoring_ibfk_1` FOREIGN KEY (`id_rekam_jejak`) REFERENCES `rekam_jejak` (`id_rekam_jejak`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `log_proctoring_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `pengguna` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `rekam_jejak`
--
ALTER TABLE `rekam_jejak`
  ADD CONSTRAINT `rekam_jejak_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `pengguna` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `rekam_jejak_ibfk_2` FOREIGN KEY (`id_ujian`) REFERENCES `ujian` (`id_ujian`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `soal`
--
ALTER TABLE `soal`
  ADD CONSTRAINT `soal_ibfk_1` FOREIGN KEY (`id_ujian`) REFERENCES `ujian` (`id_ujian`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
