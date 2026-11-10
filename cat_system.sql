-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: cat_system
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jawaban_peserta`
--

DROP TABLE IF EXISTS `jawaban_peserta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jawaban_peserta` (
  `id_jawaban` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_rekam_jejak` bigint unsigned NOT NULL,
  `id_soal` bigint unsigned NOT NULL,
  `jawaban_dipilih` enum('A','B','C','D','E') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_benar_salah` tinyint(1) DEFAULT NULL,
  `waktu_dijawab` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_jawaban`),
  UNIQUE KEY `jawaban_peserta_id_rekam_jejak_id_soal_unique` (`id_rekam_jejak`,`id_soal`),
  KEY `jawaban_peserta_id_rekam_jejak_index` (`id_rekam_jejak`),
  KEY `jawaban_peserta_id_soal_index` (`id_soal`),
  CONSTRAINT `jawaban_peserta_id_rekam_jejak_foreign` FOREIGN KEY (`id_rekam_jejak`) REFERENCES `rekam_jejak` (`id_rekam_jejak`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `jawaban_peserta_id_soal_foreign` FOREIGN KEY (`id_soal`) REFERENCES `soal` (`id_soal`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_proctoring`
--

DROP TABLE IF EXISTS `log_proctoring`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_proctoring` (
  `id_log` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_rekam_jejak` bigint unsigned NOT NULL,
  `id_user` bigint unsigned NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `jenis_pelanggaran` enum('Normal','No Face','Multiple Faces','Looking Away','Suspicious Activity') COLLATE utf8mb4_unicode_ci NOT NULL,
  `bukti_screenshot` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`),
  KEY `log_proctoring_id_rekam_jejak_index` (`id_rekam_jejak`),
  KEY `log_proctoring_id_user_index` (`id_user`),
  KEY `log_proctoring_timestamp_index` (`timestamp`),
  KEY `log_proctoring_jenis_pelanggaran_index` (`jenis_pelanggaran`),
  CONSTRAINT `log_proctoring_id_rekam_jejak_foreign` FOREIGN KEY (`id_rekam_jejak`) REFERENCES `rekam_jejak` (`id_rekam_jejak`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `log_proctoring_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `pengguna` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pengguna`
--

DROP TABLE IF EXISTS `pengguna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pengguna` (
  `id_user` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Admin','Peserta') COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `pengguna_username_unique` (`username`),
  UNIQUE KEY `pengguna_email_unique` (`email`),
  KEY `pengguna_username_index` (`username`),
  KEY `pengguna_role_index` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rekam_jejak`
--

DROP TABLE IF EXISTS `rekam_jejak`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rekam_jejak` (
  `id_rekam_jejak` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` bigint unsigned NOT NULL,
  `id_ujian` bigint unsigned NOT NULL,
  `waktu_mulai` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `waktu_selesai` timestamp NULL DEFAULT NULL,
  `skor_akhir` decimal(5,2) DEFAULT NULL,
  `total_soal` int unsigned NOT NULL DEFAULT '0',
  `total_benar` int unsigned NOT NULL DEFAULT '0',
  `total_salah` int unsigned NOT NULL DEFAULT '0',
  `status_pengerjaan` enum('sedang_mengerjakan','selesai','diskualifikasi') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sedang_mengerjakan',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_rekam_jejak`),
  UNIQUE KEY `rekam_jejak_id_user_id_ujian_unique` (`id_user`,`id_ujian`),
  KEY `rekam_jejak_id_user_index` (`id_user`),
  KEY `rekam_jejak_id_ujian_index` (`id_ujian`),
  KEY `rekam_jejak_status_pengerjaan_index` (`status_pengerjaan`),
  CONSTRAINT `rekam_jejak_id_ujian_foreign` FOREIGN KEY (`id_ujian`) REFERENCES `ujian` (`id_ujian`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rekam_jejak_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `pengguna` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `soal`
--

DROP TABLE IF EXISTS `soal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `soal` (
  `id_soal` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_ujian` bigint unsigned NOT NULL,
  `nomor_urut` int unsigned NOT NULL,
  `teks_soal` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `gambar_soal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opsi_a` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_b` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_c` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_d` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_e` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kunci_jawaban` enum('A','B','C','D','E') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_soal`),
  UNIQUE KEY `soal_id_ujian_nomor_urut_unique` (`id_ujian`,`nomor_urut`),
  KEY `soal_id_ujian_index` (`id_ujian`),
  CONSTRAINT `soal_id_ujian_foreign` FOREIGN KEY (`id_ujian`) REFERENCES `ujian` (`id_ujian`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ujian`
--

DROP TABLE IF EXISTS `ujian`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ujian` (
  `id_ujian` bigint unsigned NOT NULL AUTO_INCREMENT,
  `judul_mata_kuliah` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `waktu_mulai` time NOT NULL,
  `waktu_selesai` time NOT NULL,
  `durasi_menit` int unsigned NOT NULL,
  `status_aktif` tinyint(1) NOT NULL DEFAULT '0',
  `acak_soal` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_ujian`),
  KEY `ujian_tanggal_index` (`tanggal`),
  KEY `ujian_status_aktif_index` (`status_aktif`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'cat_system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-10 17:18:59


-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: cat_system
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2024_01_01_000001_create_pengguna_table',1),(5,'2024_01_01_000002_create_ujian_table',1),(6,'2024_01_01_000003_create_soal_table',1),(7,'2024_01_01_000004_create_rekam_jejak_table',1),(8,'2024_01_01_000005_create_jawaban_peserta_table',1),(9,'2024_01_01_000006_create_log_proctoring_table',1),(10,'2026_10_20_050111_create_personal_access_tokens_table',1),(11,'2026_11_10_000001_add_gambar_soal_and_acak_soal',2);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `pengguna`
--

LOCK TABLES `pengguna` WRITE;
/*!40000 ALTER TABLE `pengguna` DISABLE KEYS */;
INSERT INTO `pengguna` (`id_user`, `username`, `password`, `nama_lengkap`, `role`, `email`, `created_at`, `updated_at`) VALUES (1,'admin','$2y$12$LMItuVpvD9O6E1eB4iOl7ukCSSD8mJuS8Oei.eur.alk2j9PVdBZi','Administrator System','Admin','admin@cat-system.test','2026-11-10 04:46:58','2026-11-10 04:46:58'),(2,'peserta_001','$2y$12$WfxmxNw6njIBqR8Gt0B6U.J/TzPEI5CNxJogcKxFjzBPTs2B8ecnG','Achmaddany Rozaqy','Peserta','dany@student.test','2026-11-10 04:46:58','2026-11-10 04:46:58'),(3,'peserta_002','$2y$12$V2niUa9jttENcchvqr00weO90NyV1RbtBUKoXAYYxWskxGOKeE.Ee','Shandy Prasetyo','Peserta','shandy@student.test','2026-11-10 04:46:58','2026-11-10 04:46:58'),(4,'peserta_003','$2y$12$7tT2z90szti0WCed/Pt2/O/OzskjGQJc1loSLJx3p2WpGdB4Wrnc2','Muhammad Tamimudin','Peserta','tamim@student.test','2026-11-10 04:46:58','2026-11-10 04:46:58'),(5,'peserta_004','$2y$12$aseJxL.vlmdiLUViudqpAuho9UfBCIKuOHpfNhlxWrIHO/kx63dCK','Galih Bagus Kurniawan','Peserta','galih@student.test','2026-11-10 04:46:58','2026-11-10 04:46:58');
/*!40000 ALTER TABLE `pengguna` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `ujian`
--

LOCK TABLES `ujian` WRITE;
/*!40000 ALTER TABLE `ujian` DISABLE KEYS */;
INSERT INTO `ujian` (`id_ujian`, `judul_mata_kuliah`, `tanggal`, `waktu_mulai`, `waktu_selesai`, `durasi_menit`, `status_aktif`, `acak_soal`, `created_at`, `updated_at`) VALUES (1,'Pemrograman Web Lanjut','2026-11-10','00:00:00','23:59:00',120,1,1,'2026-11-10 04:46:58','2026-11-10 04:46:58'),(2,'Basis Data','2026-11-10','00:00:00','23:59:00',120,1,1,'2026-11-10 04:46:58','2026-11-10 04:46:58'),(3,'Kecerdasan Buatan','2026-11-10','00:00:00','23:59:00',90,1,1,'2026-11-10 04:46:58','2026-11-10 09:21:55'),(4,'TPS Penalaran & Logika (Soal Bergambar)','2026-11-10','00:00:00','23:59:00',90,1,1,'2026-11-10 09:21:55','2026-11-10 09:26:11');
/*!40000 ALTER TABLE `ujian` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `soal`
--

LOCK TABLES `soal` WRITE;
/*!40000 ALTER TABLE `soal` DISABLE KEYS */;
INSERT INTO `soal` (`id_soal`, `id_ujian`, `nomor_urut`, `teks_soal`, `gambar_soal`, `opsi_a`, `opsi_b`, `opsi_c`, `opsi_d`, `opsi_e`, `kunci_jawaban`, `created_at`, `updated_at`) VALUES (1,1,1,'Perhatikan gambar struktur data pohon biner (Binary Search Tree) di atas. Jika dilakukan penelusuran secara In-Order (Left, Root, Right), maka urutan nilai node yang dihasilkan adalah…','soal/bank_utbk_1_e21ac43b.png','Node dikunjungi secara berurutan dari nilai terkecil hingga nilai terbesar (ascending)','Root selalu dikunjungi paling pertama sebelum seluruh subtree kiri','Root selalu dikunjungi paling terakhir setelah seluruh daun','Node dikunjungi per level dari atas ke bawah secara acak','Hanya node daun (leaf) yang dikunjungi','A','2026-11-10 04:46:58','2026-11-10 09:26:14'),(2,1,2,'Perhatikan diagram Venn pada gambar di atas! Dari 60 siswa peserta UTBK, 35 siswa menyukai Matematika (A), 30 siswa menyukai Fisika (B), dan 10 siswa tidak menyukai keduanya. Berapakah jumlah siswa yang berada pada daerah irisan kedua himpunan?','soal/bank_utbk_2_6b5f9413.png','10 siswa','15 siswa','20 siswa','25 siswa','30 siswa','B','2026-11-10 04:46:58','2026-11-10 09:26:16'),(3,1,3,'Berdasarkan gambar lapisan arsitektur jaringan OSI di atas, protokol HTTP, HTTPS, dan DNS bekerja pada lapisan (layer)…','soal/bank_utbk_3_d46be69e.png','Physical Layer (Layer 1)','Data Link Layer (Layer 2)','Network Layer (Layer 3)','Transport Layer (Layer 4)','Application Layer (Layer 7)','E','2026-11-10 04:46:58','2026-11-10 09:26:18'),(4,2,1,'Perhatikan simbol gerbang logika (logic gates) pada gambar di atas. Gerbang logika yang hanya menghasilkan keluaran bernilai 1 (TRUE) apabila kedua masukannya bernilai berbeda adalah…','soal/bank_utbk_5_75ddfab4.jpg','AND','OR','XOR (Exclusive OR)','NAND','BUFFER','C','2026-11-10 04:46:58','2026-11-10 09:26:21'),(5,2,2,'Perhatikan kurva distribusi normal baku pada gambar di atas. Berdasarkan aturan empiris (68–95–99,7), sekitar berapa persen data yang berada dalam rentang satu simpangan baku (±1σ) dari rata-rata (μ)?','soal/bank_utbk_6_4d35c54b.png','34,1%','50,0%','68,2%','95,4%','99,7%','C','2026-11-10 04:46:58','2026-11-10 09:26:23'),(6,1,4,'Perhatikan gambar Entity-Relationship Diagram (ERD) di atas. Dalam perancangan basis data relasional, simbol belah ketupat (diamond) pada notasi Chen merepresentasikan…','soal/bank_utbk_4_64224cfc.jpg','Entitas kuat (Strong Entity)','Atribut komposit','Relasi (Relationship) antar entitas','Primary Key tabel','Indeks sekunder','C','2026-11-10 05:14:47','2026-11-10 09:26:20'),(7,1,5,'Fungsi utama middleware pada arsitektur aplikasi web seperti Laravel adalah…',NULL,'Menyimpan data ke tabel database','Memfilter HTTP request sebelum/sesudah mencapai controller','Mengompilasi file CSS dan JavaScript','Mengatur koneksi jaringan ke DNS','Menggantikan fungsi model Eloquent','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(8,1,6,'Serangan keamanan yang menyisipkan skrip berbahaya ke halaman web yang dilihat pengguna lain disebut…',NULL,'SQL Injection','Cross-Site Scripting (XSS)','Denial of Service (DoS)','Man-in-the-Middle','Brute Force','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(9,1,7,'Mekanisme keamanan di Laravel untuk mencegah pemalsuan permintaan lintas situs adalah…',NULL,'CORS Token','CSRF Token','JWT Header','MD5 Checksum','Base64 Encoding','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(10,1,8,'Di React, hook yang digunakan untuk menyimpan state lokal pada functional component adalah…',NULL,'useEffect','useMemo','useState','useContext','useCallback','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(11,1,9,'Apa fungsi dependency array kosong `[]` pada `useEffect(fn, [])` di React?',NULL,'Menjalankan efek setiap kali komponen re-render','Menjalankan efek hanya sekali saat komponen pertama kali di-mount','Menonaktifkan efek sepenuhnya','Menjalankan efek hanya saat state berubah','Menghapus state saat komponen unmount','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(12,1,10,'Format pertukaran data ringan yang paling umum digunakan pada RESTful API modern adalah…',NULL,'SOAP','JSON','CSV','YAML','INI','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(13,1,11,'Header HTTP yang digunakan untuk mengirim Bearer token autentikasi ke server adalah…',NULL,'X-Requested-With','Accept-Language','Authorization','Content-Disposition','Cache-Control','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(14,1,12,'Masalah performa \"N+1 Query\" pada ORM Eloquent dapat diatasi dengan teknik…',NULL,'Lazy Loading','Eager Loading (`with()`)','Pagination manual','Raw Hashing','Session Caching','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(15,1,13,'Kode status HTTP 422 pada Laravel biasanya dikembalikan ketika…',NULL,'Server mengalami crash internal','Validasi input request gagal','Halaman tidak ditemukan','Token autentikasi kedaluwarsa','Batas rate limit terlampaui','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(16,1,14,'Kode status HTTP 429 menunjukkan bahwa…',NULL,'Terlalu banyak request dalam waktu singkat (Too Many Requests)','Ukuran file upload terlalu besar','Method HTTP tidak diizinkan','Resource telah dihapus permanen','Koneksi database terputus','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(17,1,15,'Pada CSS Flexbox, properti untuk meratakan item secara horizontal di sepanjang main axis adalah…',NULL,'align-items','justify-content','flex-wrap','align-content','place-self','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(18,1,16,'Penyimpanan di browser yang tidak memiliki waktu kedaluwarsa otomatis hingga dihapus adalah…',NULL,'Session Cookie','sessionStorage','localStorage','Memory Heap','Query String','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(19,1,17,'Di Laravel Sanctum, tabel yang menyimpan personal access token API adalah…',NULL,'oauth_tokens','api_keys','personal_access_tokens','user_sessions','sanctum_guards','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(20,1,18,'Fungsi `Promise.all([p1, p2])` pada JavaScript asinkron adalah…',NULL,'Menjalankan promise secara berurutan satu per satu','Menunggu semua promise selesai secara paralel dan mengembalikan array hasilnya','Mengambil hanya promise yang paling cepat selesai','Membatalkan semua promise yang gagal tanpa error','Mengubah fungsi sinkron menjadi generator','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(21,1,19,'Pada React Router, komponen untuk berpindah halaman secara deklaratif tanpa reload penuh adalah…',NULL,'<a>','<Link>','<RedirectPage>','<Form>','<Script>','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(22,1,20,'Apa tujuan penggunaan `key` yang unik saat me-render list elemen di React?',NULL,'Menentukan urutan z-index elemen','Membantu React mengenali item mana yang berubah, ditambah, atau dihapus','Mengenkripsi data di dalam DOM','Menerapkan style CSS otomatis','Menyimpan nilai ke localStorage','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(23,1,21,'Properti atribut cookie yang mencegah akses cookie melalui `document.cookie` di JavaScript adalah…',NULL,'Secure','SameSite=None','HttpOnly','Path=/','Max-Age','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(24,1,22,'Di Laravel, file konfigurasi koneksi database utama terletak pada…',NULL,'routes/web.php','config/database.php','public/index.php','bootstrap/providers.php','storage/logs/laravel.log','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(25,1,23,'Perintah untuk membuat symbolic link dari `storage/app/public` ke `public/storage` di Laravel adalah…',NULL,'php artisan storage:publish','php artisan storage:link','php artisan public:mount','php artisan asset:link','php artisan file:share','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(26,1,24,'Teknologi browser yang memungkinkan akses stream video kamera pengguna secara langsung adalah…',NULL,'WebSocket API','navigator.mediaDevices.getUserMedia()','IntersectionObserver','ServiceWorker','localStorage.getItem()','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(27,1,25,'Tipe konten (`Content-Type`) yang wajib dipakai saat mengunggah file gambar melalui form HTTP adalah…',NULL,'application/json','text/plain','multipart/form-data','application/x-www-form-urlencoded','image/svg+xml','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(28,1,26,'Fungsi `Hash::make($password)` di Laravel menggunakan algoritma hashing satu arah seperti…',NULL,'Base64','ROT13','Bcrypt / Argon2','CRC32','URL Encode','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(29,1,27,'Kebijakan keamanan browser yang membatasi request HTTP lintas domain disebut…',NULL,'CSRF Policy','Same-Origin Policy & CORS','Content Compression','DNS Prefetching','Strict Transport','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(30,1,28,'Di Vite, variabel environment yang boleh diakses di kode frontend harus memiliki awalan…',NULL,'REACT_APP_','NEXT_PUBLIC_','VITE_','PUBLIC_','APP_','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(31,1,29,'Apa kegunaan hook `useMemo` pada React?',NULL,'Menyimpan referensi elemen DOM','Memoisasi hasil perhitungan agar tidak dihitung ulang di setiap render jika dependensi tetap','Melakukan navigasi antar rute','Mengirim request HTTP otomatis','Mengatur judul dokumen HTML','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(32,1,30,'Method Eloquent untuk mencari satu record berdasarkan primary key atau langsung melempar 404 jika tidak ada adalah…',NULL,'first()','get()','findOrFail()','whereKey()','pluck()','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(33,1,31,'Pada arsitektur MVC, komponen yang bertanggung jawab atas logika bisnis dan representasi data tabel adalah…',NULL,'View','Model','Router','Blade','Middleware','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(34,1,32,'Apa fungsi dari `DB::transaction(function () { ... })` di Laravel?',NULL,'Mempercepat koneksi jaringan client','Memastikan seluruh operasi database di dalamnya bersifat atomik (commit semua atau rollback semua)','Menghapus semua tabel secara otomatis','Menyimpan query ke dalam file log','Mengubah database MySQL menjadi SQLite','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(35,1,33,'Elemen HTML5 yang digunakan untuk menggambar grafis atau memproses piksel frame video secara dinamis adalah…',NULL,'<svg>','<canvas>','<picture>','<figure>','<iframe>','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(36,1,34,'Event DOM yang terpicu ketika pengguna berpindah tab atau meminimalkan jendela browser adalah…',NULL,'resize','visibilitychange','contextmenu','dblclick','wheel','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(37,1,35,'Pada REST API, penggunaan kata benda jamak yang tepat untuk endpoint koleksi ujian adalah…',NULL,'GET /ambilSemuaUjian','GET /ujian','POST /hapusUjian','PUT /buatUjianBaru','GET /cek_tabel_ujian_db','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(38,1,36,'Di Laravel, validasi `\'email\' => \'unique:pengguna,email\'` berfungsi untuk…',NULL,'Memastikan format email memiliki domain .ac.id','Memastikan nilai email belum terdaftar pada kolom email di tabel pengguna','Mengirim email verifikasi otomatis','Mengubah email menjadi huruf kapital','Menghapus email duplikat di database','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(39,1,37,'Fungsi `Array.prototype.filter()` pada JavaScript mengembalikan…',NULL,'Satu elemen pertama yang cocok','Nilai boolean true atau false','Array baru berisi semua elemen yang memenuhi kondisi callback','Jumlah karakter di dalam array','Objek Map dari elemen array','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(40,1,38,'Apa perbedaan utama antara operator `==` dan `===` di JavaScript maupun PHP?',NULL,'`===` membandingkan nilai sekaligus tipe data tanpa koersi otomatis','`==` lebih cepat dan selalu lebih aman','`===` hanya bisa digunakan untuk tipe string','`==` digunakan untuk assignment variabel','Tidak ada perbedaan sama sekali','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(41,1,39,'Di CSS, satuan `vh` pada properti `min-height: 100vh` berarti…',NULL,'1% dari lebar parent element','1% dari tinggi viewport browser','100 piksel tetap','Ukuran font elemen root','Resolusi layar dalam DPI','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(42,1,40,'Manakah pernyataan yang benar mengenai Single Page Application (SPA)?',NULL,'Setiap klik menu memuat ulang seluruh dokumen HTML dari server','Navigasi halaman dilakukan di sisi client dengan memperbarui komponen DOM secara dinamis','SPA tidak dapat berkomunikasi dengan REST API','SPA hanya bisa dibuat tanpa JavaScript','SPA tidak mendukung tombol Back pada browser','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(43,1,41,'Apa fungsi dari `e.preventDefault()` pada event handler submit form di React?',NULL,'Menghapus seluruh isi input form','Mencegah browser melakukan reload halaman default saat form dikirim','Menutup koneksi internet sementara','Menghentikan eksekusi komponen React','Mengirim form dua kali berturut-turut','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(44,1,42,'Pada TensorFlow.js / BlazeFace di browser, tujuan Non-Maximum Suppression (NMS) adalah…',NULL,'Memperbesar ukuran file gambar','Menghilangkan kotak deteksi wajah yang tumpang tindih pada wajah yang sama','Mengubah warna video menjadi hitam putih','Menonaktifkan kamera secara otomatis','Menyimpan model AI ke database MySQL','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(45,1,43,'Metrik yang digunakan pada algoritma NMS untuk mengukur tingkat tumpang tindih dua kotak prediksi adalah…',NULL,'Mean Squared Error (MSE)','Intersection over Union (IoU)','Cosine Similarity','Peak Signal-to-Noise Ratio','Cross Entropy','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(46,1,44,'Di Laravel, fungsi helper `now()` mengembalikan objek waktu bertipe…',NULL,'stdClass','Illuminate\\Support\\Carbon','SimpleXMLElement','SplFileInfo','Closure','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(47,1,45,'Method Eloquent `updateOrCreate($attributes, $values)` berfungsi untuk…',NULL,'Menghapus record lama lalu membuat tabel baru','Memperbarui record jika cocok dengan `$attributes`, atau membuat record baru jika belum ada','Menggandakan seluruh baris di tabel','Menjalankan file migrasi dari awal','Mengabaikan validasi foreign key','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(48,1,46,'Dalam pengujian perangkat lunak, pengujian yang memverifikasi alur aplikasi dari antarmuka pengguna hingga database disebut…',NULL,'Unit Testing','End-to-End (E2E) Testing','Static Typing','Lexical Analysis','Code Minification','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(49,1,47,'Fungsi interceptor response pada Axios seperti `http.interceptors.response.use(...)` adalah…',NULL,'Mengganti bahasa pemrograman backend','Menangani seluruh response atau error API (mis. redirect otomatis saat status 401) secara terpusat','Mematikan fitur cache di sistem operasi','Mengompilasi JSX menjadi HTML','Menjalankan query SQL langsung dari browser','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(50,1,48,'Properti CSS `z-index` hanya bekerja secara efektif untuk mengatur tumpukan layar apabila elemen tersebut…',NULL,'Memiliki `display: inline`','Memiliki konteks posisi (mis. `position: relative/absolute/fixed/sticky` atau flex/grid item)','Berwarna transparan','Tidak memiliki border','Berada di luar tag `<body>`','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(51,1,49,'Perintah `npm run build` pada proyek frontend berbasis Vite menghasilkan…',NULL,'File migrasi database PHP','Bundel aset statis teroptimasi (HTML, CSS, JS) di folder `dist/` untuk produksi','Server MySQL baru di port 3306','Dokumentasi PDF otomatis','Container Docker untuk backend','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(52,1,50,'Mengapa validasi hak akses dan kepemilikan data wajib dilakukan di sisi backend meskipun tombol di frontend sudah disembunyikan?',NULL,'Agar tampilan CSS menjadi lebih berwarna','Karena request HTTP dapat dikirim langsung oleh pengguna (mis. lewat curl/DevTools) melewati tampilan frontend','Karena browser tidak bisa membaca JSON','Untuk memperbesar ukuran payload API','Agar tidak perlu menggunakan database','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(53,2,3,'Perhatikan gambar segitiga siku-siku pada teorema Pythagoras di atas. Jika panjang sisi alas a = 9 cm dan sisi tegak b = 12 cm, maka panjang sisi miring (hipotenusa) c adalah…','soal/bank_utbk_7_0e1ccb10.png','13 cm','14 cm','15 cm','18 cm','21 cm','C','2026-11-10 05:14:47','2026-11-10 09:26:24'),(54,2,4,'Perhatikan ilustrasi operasi PUSH dan POP pada struktur data Stack di atas. Prinsip antrean elemen yang diterapkan oleh Stack adalah…','soal/bank_utbk_8_594c1398.jpg','FIFO (First In, First Out)','LIFO (Last In, First Out)','Round Robin Scheduling','Shortest Job First','Random Access','B','2026-11-10 05:14:47','2026-11-10 09:26:25'),(55,2,5,'Jenis JOIN yang hanya menampilkan baris yang memiliki kecocokan di kedua tabel adalah…',NULL,'LEFT JOIN','RIGHT JOIN','INNER JOIN','CROSS JOIN','NATURAL OUTER','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(56,2,6,'Jika ingin menampilkan seluruh peserta beserta jumlah pelanggarannya termasuk peserta yang belum memiliki pelanggaran (0), maka digunakan…',NULL,'INNER JOIN','LEFT JOIN dari tabel pengguna ke log_proctoring','CROSS JOIN tanpa kondisi','DROP TABLE','UNION ALL tanpa kunci','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(57,2,7,'Empat sifat dasar transaksi database yang menjamin keandalan data dikenal dengan singkatan…',NULL,'CRUD','ACID (Atomicity, Consistency, Isolation, Durability)','SOLID','REST','FIFO','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(58,2,8,'Sifat *Atomicity* dalam transaksi database berarti…',NULL,'Data dapat diakses tanpa autentikasi','Seluruh operasi dalam transaksi berhasil semua, atau jika satu gagal maka dibatalkan semua','Setiap tabel hanya boleh memiliki satu kolom','Query selalu dieksekusi secara paralel','Data disimpan hanya di RAM','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(59,2,9,'Tujuan utama pembuatan INDEX pada kolom yang sering dicari di klausa `WHERE` atau `JOIN` adalah…',NULL,'Mempercepat pencarian data tanpa harus memindai seluruh baris tabel (Full Table Scan)','Mengenkripsi isi kolom','Menghapus baris duplikat secara otomatis','Mengurangi kapasitas harddisk hingga 90%','Menggantikan fungsi Primary Key','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(60,2,10,'Efek samping dari membuat terlalu banyak INDEX pada sebuah tabel adalah…',NULL,'Query `SELECT` menjadi tidak bisa dijalankan','Operasi tulis (`INSERT`, `UPDATE`, `DELETE`) menjadi lebih lambat dan memakan ruang simpan tambahan','Tabel tidak bisa di-backup','Semua kolom berubah menjadi tipe TEXT','Foreign key menjadi tidak aktif','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(61,2,11,'Bentuk normal pertama (1NF) dalam normalisasi basis data mensyaratkan bahwa…',NULL,'Setiap atribut bernilai atomik (tidak ada grup berulang/multi-value dalam satu sel)','Semua tabel harus digabung menjadi satu tabel besar','Tidak boleh ada Primary Key','Setiap tabel wajib memiliki minimal 10 kolom','Semua kolom bertipe VARCHAR','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(62,2,12,'Bentuk normal kedua (2NF) tercapai apabila tabel sudah memenuhi 1NF dan…',NULL,'Tidak memiliki ketergantungan fungsional parsial terhadap bagian dari composite primary key','Seluruh kolom boleh bernilai NULL','Tidak menggunakan Foreign Key sama sekali','Memiliki minimal dua trigger aktif','Menggunakan engine MyISAM','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(63,2,13,'Bentuk normal ketiga (3NF) menghilangkan…',NULL,'Primary Key pada tabel utama','Ketergantungan transitif (atribut non-kunci bergantung pada atribut non-kunci lainnya)','Semua relasi antar tabel','Indeks unik pada username','Penggunaan tipe data tanggal','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(64,2,14,'Pada relasi `ON DELETE CASCADE` di Foreign Key `jawaban_peserta.id_rekam_jejak`, apa yang terjadi jika baris induk di `rekam_jejak` dihapus?',NULL,'Penghapusan selalu ditolak dengan error','Semua baris jawaban yang terkait dengan rekam jejak tersebut ikut terhapus otomatis','Nilai `id_rekam_jejak` berubah menjadi angka acak','Tabel `jawaban_peserta` ikut terhapus (DROP)','Tidak terjadi perubahan apa pun','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(65,2,15,'Fungsi agregat SQL untuk menghitung rata-rata nilai dari sebuah kolom numerik adalah…',NULL,'SUM()','COUNT()','AVG()','MAX()','ROUND()','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(66,2,16,'Untuk menghitung jumlah pengguna unik yang mengikuti ujian tanpa menghitung duplikat, klausa yang tepat adalah…',NULL,'COUNT(*)','COUNT(DISTINCT id_user)','SUM(id_user)','AVG(id_user)','GROUP_CONCAT(id_user)','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(67,2,17,'Apa perbedaan utama antara perintah `DELETE` dan `TRUNCATE` pada SQL?',NULL,'`DELETE` dapat menggunakan klausa `WHERE` untuk menghapus baris tertentu, sedangkan `TRUNCATE` mengosongkan seluruh isi tabel','`TRUNCATE` dapat menggunakan klausa `WHERE`','`DELETE` menghapus struktur tabel beserta kolomnya','`TRUNCATE` hanya menghapus satu baris pertama','Keduanya identik dalam segala hal','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(68,2,18,'Serangan SQL Injection dapat dicegah secara efektif dengan menggunakan…',NULL,'Concatenation string langsung pada query SQL','Prepared Statements / Parameterized Queries (binding `?`)','Menyembunyikan URL di browser','Mengganti nama tabel setiap hari','Menghapus semua klausa WHERE','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(69,2,19,'Klausa `SELECT ... FOR UPDATE` di dalam transaksi InnoDB MySQL berfungsi untuk…',NULL,'Memperbarui seluruh baris menjadi NULL','Mengunci baris yang dibaca agar transaksi lain tidak memodifikasinya hingga transaksi selesai','Menghapus indeks pada tabel','Mengubah tipe data kolom secara permanen','Menyimpan hasil query ke file CSV','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(70,2,20,'Kondisi ketika dua transaksi saling menunggu kunci (lock) yang dipegang satu sama lain sehingga keduanya tidak bisa lanjut disebut…',NULL,'Starvation','Deadlock','livestream','Checkpointing','Sharding','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(71,2,21,'Tipe data MySQL yang tepat untuk menyimpan nilai skor presisi tetap seperti `85.50` tanpa galat pembulatan floating-point adalah…',NULL,'FLOAT','DECIMAL(5,2)','VARCHAR(2)','TINYINT','BLOB','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(72,2,22,'Constraint `UNIQUE (id_ujian, nomor_urut)` pada tabel `soal` menjamin bahwa…',NULL,'Nomor urut soal harus unik di seluruh database tanpa peduli ujiannya','Dalam satu ujian yang sama tidak boleh ada dua soal dengan nomor urut yang sama','Satu ujian hanya boleh memiliki satu soal','Kolom `nomor_urut` wajib bernilai negatif','Tabel `soal` tidak bisa di-update','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(73,2,23,'Perintah SQL `EXPLAIN SELECT ...` digunakan oleh pengembang untuk…',NULL,'Menerjemahkan query ke bahasa Indonesia','Melihat rencana eksekusi query (apakah memakai index, berapa estimasi baris yang dipindai)','Menjalankan backup database otomatis','Memperbaiki tabel yang rusak','Menghapus cache aplikasi','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(74,2,24,'Pada MySQL, storage engine default yang mendukung transaksi ACID dan Foreign Key adalah…',NULL,'MyISAM','MEMORY','InnoDB','CSV','BLACKHOLE','C','2026-11-10 05:14:47','2026-11-10 05:14:47'),(75,2,25,'Apa yang dimaksud dengan *View* dalam basis data relasional?',NULL,'Tabel fisik baru yang menggandakan seluruh data di disk','Tabel virtual yang isinya didefinisikan oleh sebuah query `SELECT`','Tampilan antarmuka grafis di browser','File konfigurasi jaringan MySQL','Hak akses khusus untuk menghapus database','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(76,2,26,'Dalam desain skema CAT UTBK, relasi antara tabel `ujian` dan tabel `soal` adalah…',NULL,'One-to-One (1:1)','One-to-Many (1:N) — satu ujian memiliki banyak soal','Many-to-Many tanpa tabel perantara','Tidak memiliki relasi','Self-referencing tunggal','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(77,2,27,'Relasi Many-to-Many antara entitas `pengguna` (peserta) dan `ujian` dipecah menggunakan tabel penghubung/transaksi yaitu…',NULL,'soal','rekam_jejak','migrations','personal_access_tokens','cache','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(78,2,28,'Urutan eksekusi logis klausa dalam query `SELECT` pada SQL yang benar adalah…',NULL,'SELECT -> FROM -> WHERE -> GROUP BY','FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT','ORDER BY -> LIMIT -> SELECT -> FROM','HAVING -> WHERE -> FROM -> SELECT','LIMIT -> GROUP BY -> WHERE -> FROM','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(79,2,29,'Apa hasil dari ekspresi `NULL = NULL` pada standar SQL ketika dievaluasi di klausa `WHERE`?',NULL,'TRUE','UNKNOWN (sehingga baris tidak terpilih; harus menggunakan `IS NULL`)','1','Melempar syntax error','Mengembalikan semua baris','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(80,2,30,'Fungsi SQL untuk menggantikan nilai `NULL` dengan nilai default tertentu (misal `0`) saat menampilkan data adalah…',NULL,'COALESCE(kolom, 0)','NULLIF(0, 0)','CONCAT(kolom)','SUBSTRING(kolom, 1)','CAST(kolom AS DATE)','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(81,2,31,'Dalam konteks basis data terdistribusi, *Replication* berarti…',NULL,'Membagi satu tabel menjadi kolom-kolom terpisah tanpa salinan','Menyalin dan menjaga sinkronisasi data dari server utama (Primary/Master) ke satu atau lebih server replika','Menghapus data lama setiap 5 menit','Menggabungkan seluruh database menjadi satu file teks','Menonaktifkan fitur jaringan pada database','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(82,2,32,'Teknik memecah tabel berukuran sangat besar secara horizontal ke beberapa server berdasarkan kunci partisi disebut…',NULL,'Normalization','Sharding / Horizontal Partitioning','Denormalization','Triggering','Indexing','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(83,2,33,'Teorema CAP pada sistem basis data terdistribusi menyatakan bahwa saat terjadi *Network Partition*, sistem harus memilih trade-off antara…',NULL,'CPU dan RAM','Consistency (Konsistensi) dan Availability (Ketersediaan)','HTML dan CSS','Primary Key dan Foreign Key','Tabel dan View','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(84,2,34,'Apa kegunaan dari *Write-Ahead Logging* (WAL / Redo Log) pada sistem manajemen basis data?',NULL,'Mencatat perubahan ke log terlebih dahulu sebelum ditulis ke halaman data guna menjamin *Durability* dan pemulihan saat crash','Menghapus riwayat login pengguna','Memperindah tampilan tabel di terminal','Mengubah query SQL menjadi kode Python','Membatasi jumlah tabel maksimal menjadi 10','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(85,2,35,'Level isolasi transaksi yang mencegah *Dirty Read* (membaca data yang belum di-commit transaksi lain) adalah minimal…',NULL,'READ UNCOMMITTED','READ COMMITTED','NONE','AUTO FLUSH','SERIAL BYPASS','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(86,2,36,'Fenomena ketika dalam satu transaksi yang sama, pembacaan ulang baris yang sama menghasilkan nilai berbeda karena transaksi lain melakukan `UPDATE` & `COMMIT` disebut…',NULL,'Dirty Read','Non-Repeatable Read','Syntax Error','Buffer Overflow','Foreign Key Violation','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(87,2,37,'Perintah SQL untuk menambahkan kolom baru `keterangan` ke tabel `log_proctoring` yang sudah ada adalah…',NULL,'UPDATE TABLE log_proctoring ADD keterangan TEXT','ALTER TABLE log_proctoring ADD COLUMN keterangan TEXT','INSERT COLUMN keterangan INTO log_proctoring','CREATE COLUMN keterangan ON log_proctoring','MODIFY log_proctoring NEW keterangan','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(88,2,38,'Pada klausa `ORDER BY tanggal DESC, waktu_mulai ASC`, bagaimana data diurutkan?',NULL,'Tanggal terbaru lebih dulu; jika tanggalnya sama, diurutkan dari waktu mulai paling awal','Tanggal terlama lebih dulu dan waktu mulai paling akhir','Secara acak setiap kali query dijalankan','Berdasarkan panjang karakter judul','Hanya mengurutkan 1 baris pertama','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(89,2,39,'Apa fungsi dari klausa `LIMIT 10 OFFSET 20` pada query paginasi SQL?',NULL,'Mengambil 20 baris pertama dimulai dari baris ke-10','Melewati 20 baris pertama lalu mengambil maksimal 10 baris berikutnya (halaman ke-3)','Menghapus 10 baris dari 20 tabel','Membatasi waktu eksekusi query maksimal 10 detik','Mengambil baris ke-10 dan baris ke-20 saja','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(90,2,40,'Mengapa penyimpanan file gambar berukuran besar (seperti bukti screenshot kamera) umumnya disimpan di filesystem/object storage dan hanya *path*-nya yang disimpan di kolom tabel?',NULL,'Karena SQL tidak memiliki tipe data string','Agar ukuran tabel database tetap ramping, backup cepat, dan query tidak terbebani pembacaan BLOB besar','Karena gambar tidak bisa memiliki nama file','Agar gambar otomatis terhapus setiap jam','Karena MySQL tidak mendukung lebih dari 100 baris','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(91,2,41,'Apa tujuan dari *Denormalisasi* yang terkontrol pada basis data analitik/pelaporan?',NULL,'Menghapus seluruh data transaksi','Mengurangi jumlah `JOIN` yang kompleks guna mempercepat pembacaan laporan dengan menerima sedikit redundansi yang terjaga','Membuat skema tidak memiliki tipe data','Menghilangkan kebutuhan indeks sama sekali','Mencegah pembuatan backup','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(92,2,42,'Pada tabel `rekam_jejak`, kolom `skor_akhir`, `total_benar`, dan `total_salah` disimpan meskipun bisa dihitung dari `jawaban_peserta`. Manfaat pendekatan ini adalah…',NULL,'Agar jawaban peserta tidak perlu disimpan','Rekap hasil & dashboard statistik dapat dibaca sangat cepat tanpa harus menghitung ulang seluruh butir jawaban setiap kali halaman dibuka','Supaya peserta tidak bisa melihat skor','Menghindari penggunaan Primary Key','Menggantikan tabel pengguna','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(93,2,43,'Perintah untuk mencabut hak akses tertentu dari user database pada SQL adalah…',NULL,'GRANT','REVOKE','DENY TABLE','ROLLBACK USER','DROP PRIVILEGE','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(94,2,44,'Karakter wildcard pada operator `LIKE` di SQL yang mewakili nol, satu, atau banyak karakter bebas adalah…',NULL,'`?`','`%`','`#`','`$`','`&`','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(95,2,45,'Jika sebuah query menggunakan `WHERE LOWER(username) = \"admin\"` pada kolom `username` yang memiliki indeks biasa, apa risikonya?',NULL,'Fungsi pada kolom dapat membuat indeks biasa tidak terpakai kecuali menggunakan functional index / collation case-insensitive','Database akan langsung berhenti bekerja','Semua baris di tabel akan terhapus','Password pengguna ikut tampil di layar','Query otomatis berubah menjadi `DELETE`','A','2026-11-10 05:14:47','2026-11-10 05:14:47'),(96,2,46,'Apa arti dari `utf8mb4` sebagai character set pada MySQL?',NULL,'Hanya mendukung karakter angka 0–9','Mendukung karakter UTF-8 penuh hingga 4 byte per karakter (termasuk simbol matematika & emoji)','Membatasi panjang kolom maksimal 4 huruf','Menyimpan teks dalam format terkompresi ZIP','Khusus untuk sistem operasi 4-bit','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(97,2,47,'Dalam proses backup MySQL, utilitas baris perintah standar untuk mengekspor struktur dan isi database ke file `.sql` adalah…',NULL,'mysqlimport','mysqldump','mysqladmin ping','php artisan serve','composer dump-autoload','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(98,2,48,'Apa yang terjadi jika kita mencoba memasukkan nilai `\'F\'` ke kolom `kunci_jawaban` yang bertipe `ENUM(\'A\',\'B\',\'C\',\'D\',\'E\')` dalam mode strict SQL?',NULL,'Nilai otomatis diubah menjadi `\'A\'` tanpa pesan','MySQL menolak penyimpanan dengan error *Data truncated / invalid enum value*','Tabel `soal` langsung dikosongkan','Kolom berubah tipe menjadi `INT`','Baris disimpan ke tabel lain','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(99,2,49,'Subquery yang bergantung pada nilai baris dari query luar dan dievaluasi berulang untuk setiap baris luar disebut…',NULL,'Uncorrelated Subquery','Correlated Subquery','Static View','Cartesian Sequence','Materialized Sequence','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(100,2,50,'Manakah cara terbaik untuk memastikan konsistensi skor ketika dua proses mencoba menyelesaikan sesi ujian yang sama secara bersamaan?',NULL,'Mengandalkan `setTimeout` di browser','Membungkus perhitungan di dalam `DB::transaction()` disertai `SELECT ... FOR UPDATE` (`lockForUpdate()`) pada baris `rekam_jejak`','Menghapus foreign key pada tabel','Menonaktifkan fitur auto-commit di semua tabel selamanya','Menyimpan skor hanya di `localStorage`','B','2026-11-10 05:14:47','2026-11-10 05:14:47'),(101,3,1,'Perhatikan gambar graf berbobot (weighted graph) di atas. Algoritma klasik yang digunakan untuk mencari jalur terpendek (shortest path) dari satu simpul awal ke simpul lainnya dengan bobot tepi non-negatif adalah…','soal/bank_utbk_9_45ae787d.png','Algoritma Bubble Sort','Algoritma Dijkstra','Algoritma K-Means Clustering','Algoritma Caesar Cipher','Algoritma Binary Search','B','2026-11-10 09:21:55','2026-11-10 09:26:27'),(102,3,2,'Perhatikan diagram arsitektur Client–Server pada gambar di atas. Dalam aplikasi web modern, komunikasi permintaan (request) dan tanggapan (response) antara browser client dengan server API umumnya menggunakan protokol…','soal/bank_utbk_10_60f3342c.png','SMTP','HTTP / HTTPS','SNMP','ICMP','ARP','B','2026-11-10 09:21:55','2026-11-10 09:26:28'),(103,3,3,'Perhatikan ilustrasi diagram himpunan JOIN SQL di atas. Untuk mengambil seluruh baris dari tabel kiri (Tabel A) beserta data yang cocok dari tabel kanan (Tabel B), atau NULL bila tidak ada kecocokan, jenis JOIN yang digunakan adalah…','soal/bank_utbk_11_6eb24c69.png','INNER JOIN','LEFT OUTER JOIN','RIGHT OUTER JOIN','CROSS JOIN','SELF JOIN','B','2026-11-10 09:21:55','2026-11-10 09:26:30'),(104,3,4,'Perhatikan gambar arsitektur Jaringan Saraf Tiruan (Artificial Neural Network) di atas. Lapisan yang berada di antara Input Layer dan Output Layer untuk mengekstraksi representasi fitur disebut…','soal/bank_utbk_12_6c929558.png','Transport Layer','Hidden Layer','Session Layer','Physical Layer','Foreign Layer','B','2026-11-10 09:21:55','2026-11-10 09:26:31'),(105,3,5,'Bentuk normal pertama (1NF) dalam normalisasi basis data mensyaratkan bahwa…',NULL,'Setiap atribut bernilai atomik (tidak ada grup berulang/multi-value dalam satu sel)','Semua tabel harus digabung menjadi satu tabel besar','Tidak boleh ada Primary Key','Setiap tabel wajib memiliki minimal 10 kolom','Semua kolom bertipe VARCHAR','A','2026-11-10 09:21:55','2026-11-10 09:21:55'),(106,3,6,'Dalam desain skema CAT UTBK, relasi antara tabel `ujian` dan tabel `soal` adalah…',NULL,'One-to-One (1:1)','One-to-Many (1:N) — satu ujian memiliki banyak soal','Many-to-Many tanpa tabel perantara','Tidak memiliki relasi','Self-referencing tunggal','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(107,3,7,'Di Laravel, validasi `\'email\' => \'unique:pengguna,email\'` berfungsi untuk…',NULL,'Memastikan format email memiliki domain .ac.id','Memastikan nilai email belum terdaftar pada kolom email di tabel pengguna','Mengirim email verifikasi otomatis','Mengubah email menjadi huruf kapital','Menghapus email duplikat di database','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(108,3,8,'Pada REST API, penggunaan kata benda jamak yang tepat untuk endpoint koleksi ujian adalah…',NULL,'GET /ambilSemuaUjian','GET /ujian','POST /hapusUjian','PUT /buatUjianBaru','GET /cek_tabel_ujian_db','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(109,3,9,'Apa fungsi dari `e.preventDefault()` pada event handler submit form di React?',NULL,'Menghapus seluruh isi input form','Mencegah browser melakukan reload halaman default saat form dikirim','Menutup koneksi internet sementara','Menghentikan eksekusi komponen React','Mengirim form dua kali berturut-turut','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(110,3,10,'Apa tujuan penggunaan `key` yang unik saat me-render list elemen di React?',NULL,'Menentukan urutan z-index elemen','Membantu React mengenali item mana yang berubah, ditambah, atau dihapus','Mengenkripsi data di dalam DOM','Menerapkan style CSS otomatis','Menyimpan nilai ke localStorage','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(111,3,11,'Apa hasil dari ekspresi `NULL = NULL` pada standar SQL ketika dievaluasi di klausa `WHERE`?',NULL,'TRUE','UNKNOWN (sehingga baris tidak terpilih; harus menggunakan `IS NULL`)','1','Melempar syntax error','Mengembalikan semua baris','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(112,3,12,'Fenomena ketika dalam satu transaksi yang sama, pembacaan ulang baris yang sama menghasilkan nilai berbeda karena transaksi lain melakukan `UPDATE` & `COMMIT` disebut…',NULL,'Dirty Read','Non-Repeatable Read','Syntax Error','Buffer Overflow','Foreign Key Violation','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(113,3,13,'Apa yang dimaksud dengan *View* dalam basis data relasional?',NULL,'Tabel fisik baru yang menggandakan seluruh data di disk','Tabel virtual yang isinya didefinisikan oleh sebuah query `SELECT`','Tampilan antarmuka grafis di browser','File konfigurasi jaringan MySQL','Hak akses khusus untuk menghapus database','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(114,3,14,'Manakah cara terbaik untuk memastikan konsistensi skor ketika dua proses mencoba menyelesaikan sesi ujian yang sama secara bersamaan?',NULL,'Mengandalkan `setTimeout` di browser','Membungkus perhitungan di dalam `DB::transaction()` disertai `SELECT ... FOR UPDATE` (`lockForUpdate()`) pada baris `rekam_jejak`','Menghapus foreign key pada tabel','Menonaktifkan fitur auto-commit di semua tabel selamanya','Menyimpan skor hanya di `localStorage`','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(115,3,15,'Properti atribut cookie yang mencegah akses cookie melalui `document.cookie` di JavaScript adalah…',NULL,'Secure','SameSite=None','HttpOnly','Path=/','Max-Age','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(116,3,16,'Fungsi utama middleware pada arsitektur aplikasi web seperti Laravel adalah…',NULL,'Menyimpan data ke tabel database','Memfilter HTTP request sebelum/sesudah mencapai controller','Mengompilasi file CSS dan JavaScript','Mengatur koneksi jaringan ke DNS','Menggantikan fungsi model Eloquent','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(117,3,17,'Untuk menghitung jumlah pengguna unik yang mengikuti ujian tanpa menghitung duplikat, klausa yang tepat adalah…',NULL,'COUNT(*)','COUNT(DISTINCT id_user)','SUM(id_user)','AVG(id_user)','GROUP_CONCAT(id_user)','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(118,3,18,'Fungsi `Array.prototype.filter()` pada JavaScript mengembalikan…',NULL,'Satu elemen pertama yang cocok','Nilai boolean true atau false','Array baru berisi semua elemen yang memenuhi kondisi callback','Jumlah karakter di dalam array','Objek Map dari elemen array','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(119,3,19,'Teknik memecah tabel berukuran sangat besar secara horizontal ke beberapa server berdasarkan kunci partisi disebut…',NULL,'Normalization','Sharding / Horizontal Partitioning','Denormalization','Triggering','Indexing','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(120,3,20,'Perintah untuk membuat symbolic link dari `storage/app/public` ke `public/storage` di Laravel adalah…',NULL,'php artisan storage:publish','php artisan storage:link','php artisan public:mount','php artisan asset:link','php artisan file:share','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(121,3,21,'Pada MySQL, storage engine default yang mendukung transaksi ACID dan Foreign Key adalah…',NULL,'MyISAM','MEMORY','InnoDB','CSV','BLACKHOLE','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(122,3,22,'Apa yang terjadi jika kita mencoba memasukkan nilai `\'F\'` ke kolom `kunci_jawaban` yang bertipe `ENUM(\'A\',\'B\',\'C\',\'D\',\'E\')` dalam mode strict SQL?',NULL,'Nilai otomatis diubah menjadi `\'A\'` tanpa pesan','MySQL menolak penyimpanan dengan error *Data truncated / invalid enum value*','Tabel `soal` langsung dikosongkan','Kolom berubah tipe menjadi `INT`','Baris disimpan ke tabel lain','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(123,3,23,'Perintah SQL untuk menambahkan kolom baru `keterangan` ke tabel `log_proctoring` yang sudah ada adalah…',NULL,'UPDATE TABLE log_proctoring ADD keterangan TEXT','ALTER TABLE log_proctoring ADD COLUMN keterangan TEXT','INSERT COLUMN keterangan INTO log_proctoring','CREATE COLUMN keterangan ON log_proctoring','MODIFY log_proctoring NEW keterangan','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(124,3,24,'Fungsi agregat SQL untuk menghitung rata-rata nilai dari sebuah kolom numerik adalah…',NULL,'SUM()','COUNT()','AVG()','MAX()','ROUND()','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(125,3,25,'Perintah untuk mencabut hak akses tertentu dari user database pada SQL adalah…',NULL,'GRANT','REVOKE','DENY TABLE','ROLLBACK USER','DROP PRIVILEGE','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(126,3,26,'Sifat *Atomicity* dalam transaksi database berarti…',NULL,'Data dapat diakses tanpa autentikasi','Seluruh operasi dalam transaksi berhasil semua, atau jika satu gagal maka dibatalkan semua','Setiap tabel hanya boleh memiliki satu kolom','Query selalu dieksekusi secara paralel','Data disimpan hanya di RAM','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(127,3,27,'Kunci unik yang secara utama mengidentifikasi setiap baris dalam sebuah tabel relasional disebut…',NULL,'Foreign Key','Primary Key','Candidate View','Secondary Trigger','Composite Cursor','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(128,3,28,'Manakah pernyataan yang benar mengenai Single Page Application (SPA)?',NULL,'Setiap klik menu memuat ulang seluruh dokumen HTML dari server','Navigasi halaman dilakukan di sisi client dengan memperbarui komponen DOM secara dinamis','SPA tidak dapat berkomunikasi dengan REST API','SPA hanya bisa dibuat tanpa JavaScript','SPA tidak mendukung tombol Back pada browser','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(129,3,29,'Method HTTP mana yang bersifat idempoten dan digunakan untuk memperbarui seluruh resource?',NULL,'POST','PUT','PATCH','CONNECT','TRACE','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(130,3,30,'Dalam konteks basis data terdistribusi, *Replication* berarti…',NULL,'Membagi satu tabel menjadi kolom-kolom terpisah tanpa salinan','Menyalin dan menjaga sinkronisasi data dari server utama (Primary/Master) ke satu atau lebih server replika','Menghapus data lama setiap 5 menit','Menggabungkan seluruh database menjadi satu file teks','Menonaktifkan fitur jaringan pada database','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(131,3,31,'Fungsi `Promise.all([p1, p2])` pada JavaScript asinkron adalah…',NULL,'Menjalankan promise secara berurutan satu per satu','Menunggu semua promise selesai secara paralel dan mengembalikan array hasilnya','Mengambil hanya promise yang paling cepat selesai','Membatalkan semua promise yang gagal tanpa error','Mengubah fungsi sinkron menjadi generator','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(132,3,32,'Di Laravel, perintah Artisan untuk membuat controller baru adalah…',NULL,'php artisan new:controller','php artisan create:controller','php artisan make:controller','php artisan build:controller','php artisan gen:controller','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(133,3,33,'Di Laravel, file konfigurasi koneksi database utama terletak pada…',NULL,'routes/web.php','config/database.php','public/index.php','bootstrap/providers.php','storage/logs/laravel.log','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(134,3,34,'Jika ingin menampilkan seluruh peserta beserta jumlah pelanggarannya termasuk peserta yang belum memiliki pelanggaran (0), maka digunakan…',NULL,'INNER JOIN','LEFT JOIN dari tabel pengguna ke log_proctoring','CROSS JOIN tanpa kondisi','DROP TABLE','UNION ALL tanpa kunci','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(135,3,35,'Subquery yang bergantung pada nilai baris dari query luar dan dievaluasi berulang untuk setiap baris luar disebut…',NULL,'Uncorrelated Subquery','Correlated Subquery','Static View','Cartesian Sequence','Materialized Sequence','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(136,3,36,'Properti CSS `z-index` hanya bekerja secara efektif untuk mengatur tumpukan layar apabila elemen tersebut…',NULL,'Memiliki `display: inline`','Memiliki konteks posisi (mis. `position: relative/absolute/fixed/sticky` atau flex/grid item)','Berwarna transparan','Tidak memiliki border','Berada di luar tag `<body>`','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(137,3,37,'Karakter wildcard pada operator `LIKE` di SQL yang mewakili nol, satu, atau banyak karakter bebas adalah…',NULL,'`?`','`%`','`#`','`$`','`&`','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(138,3,38,'Jenis JOIN yang hanya menampilkan baris yang memiliki kecocokan di kedua tabel adalah…',NULL,'LEFT JOIN','RIGHT JOIN','INNER JOIN','CROSS JOIN','NATURAL OUTER','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(139,3,39,'Metrik yang digunakan pada algoritma NMS untuk mengukur tingkat tumpang tindih dua kotak prediksi adalah…',NULL,'Mean Squared Error (MSE)','Intersection over Union (IoU)','Cosine Similarity','Peak Signal-to-Noise Ratio','Cross Entropy','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(140,3,40,'Di Vite, variabel environment yang boleh diakses di kode frontend harus memiliki awalan…',NULL,'REACT_APP_','NEXT_PUBLIC_','VITE_','PUBLIC_','APP_','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(141,3,41,'Kolom yang merujuk ke Primary Key pada tabel lain untuk menjaga integritas referensial disebut…',NULL,'Super Key','Foreign Key','Index Key','Check Constraint','Virtual Column','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(142,3,42,'Apa perbedaan utama antara operator `==` dan `===` di JavaScript maupun PHP?',NULL,'`===` membandingkan nilai sekaligus tipe data tanpa koersi otomatis','`==` lebih cepat dan selalu lebih aman','`===` hanya bisa digunakan untuk tipe string','`==` digunakan untuk assignment variabel','Tidak ada perbedaan sama sekali','A','2026-11-10 09:21:55','2026-11-10 09:21:55'),(143,3,43,'Empat sifat dasar transaksi database yang menjamin keandalan data dikenal dengan singkatan…',NULL,'CRUD','ACID (Atomicity, Consistency, Isolation, Durability)','SOLID','REST','FIFO','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(144,3,44,'Level isolasi transaksi yang mencegah *Dirty Read* (membaca data yang belum di-commit transaksi lain) adalah minimal…',NULL,'READ UNCOMMITTED','READ COMMITTED','NONE','AUTO FLUSH','SERIAL BYPASS','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(145,3,45,'Klausa SQL untuk memfilter hasil agregasi setelah `GROUP BY` adalah…',NULL,'WHERE','ORDER BY','HAVING','LIMIT','DISTINCT','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(146,3,46,'Header HTTP yang digunakan untuk mengirim Bearer token autentikasi ke server adalah…',NULL,'X-Requested-With','Accept-Language','Authorization','Content-Disposition','Cache-Control','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(147,3,47,'Di Laravel Sanctum, tabel yang menyimpan personal access token API adalah…',NULL,'oauth_tokens','api_keys','personal_access_tokens','user_sessions','sanctum_guards','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(148,3,48,'Serangan SQL Injection dapat dicegah secara efektif dengan menggunakan…',NULL,'Concatenation string langsung pada query SQL','Prepared Statements / Parameterized Queries (binding `?`)','Menyembunyikan URL di browser','Mengganti nama tabel setiap hari','Menghapus semua klausa WHERE','B','2026-11-10 09:21:55','2026-11-10 09:21:55'),(149,3,49,'Di React, hook yang digunakan untuk menyimpan state lokal pada functional component adalah…',NULL,'useEffect','useMemo','useState','useContext','useCallback','C','2026-11-10 09:21:55','2026-11-10 09:21:55'),(150,3,50,'Apa kepanjangan dari HTTP dalam komunikasi web?',NULL,'HyperText Transfer Protocol','Hyperlink Text Transmission Process','High Transfer Text Protocol','HyperText Transmission Platform','Host Transfer Text Protocol','A','2026-11-10 09:21:55','2026-11-10 09:21:55'),(201,4,1,'Perhatikan gambar struktur data pohon biner (Binary Search Tree) di atas. Jika dilakukan penelusuran secara In-Order (Left, Root, Right), maka urutan nilai node yang dihasilkan adalah…','soal/bank_utbk_1_e21ac43b.png','Node dikunjungi secara berurutan dari nilai terkecil hingga nilai terbesar (ascending)','Root selalu dikunjungi paling pertama sebelum seluruh subtree kiri','Root selalu dikunjungi paling terakhir setelah seluruh daun','Node dikunjungi per level dari atas ke bawah secara acak','Hanya node daun (leaf) yang dikunjungi','A','2026-11-10 09:26:14','2026-11-10 09:26:14'),(202,4,2,'Perhatikan diagram Venn pada gambar di atas! Dari 60 siswa peserta UTBK, 35 siswa menyukai Matematika (A), 30 siswa menyukai Fisika (B), dan 10 siswa tidak menyukai keduanya. Berapakah jumlah siswa yang berada pada daerah irisan kedua himpunan?','soal/bank_utbk_2_6b5f9413.png','10 siswa','15 siswa','20 siswa','25 siswa','30 siswa','B','2026-11-10 09:26:16','2026-11-10 09:26:16'),(203,4,3,'Berdasarkan gambar lapisan arsitektur jaringan OSI di atas, protokol HTTP, HTTPS, dan DNS bekerja pada lapisan (layer)…','soal/bank_utbk_3_d46be69e.png','Physical Layer (Layer 1)','Data Link Layer (Layer 2)','Network Layer (Layer 3)','Transport Layer (Layer 4)','Application Layer (Layer 7)','E','2026-11-10 09:26:18','2026-11-10 09:26:18'),(204,4,4,'Perhatikan gambar Entity-Relationship Diagram (ERD) di atas. Dalam perancangan basis data relasional, simbol belah ketupat (diamond) pada notasi Chen merepresentasikan…','soal/bank_utbk_4_64224cfc.jpg','Entitas kuat (Strong Entity)','Atribut komposit','Relasi (Relationship) antar entitas','Primary Key tabel','Indeks sekunder','C','2026-11-10 09:26:20','2026-11-10 09:26:20'),(205,4,5,'Perhatikan simbol gerbang logika (logic gates) pada gambar di atas. Gerbang logika yang hanya menghasilkan keluaran bernilai 1 (TRUE) apabila kedua masukannya bernilai berbeda adalah…','soal/bank_utbk_5_75ddfab4.jpg','AND','OR','XOR (Exclusive OR)','NAND','BUFFER','C','2026-11-10 09:26:21','2026-11-10 09:26:21'),(206,4,6,'Perhatikan kurva distribusi normal baku pada gambar di atas. Berdasarkan aturan empiris (68–95–99,7), sekitar berapa persen data yang berada dalam rentang satu simpangan baku (±1σ) dari rata-rata (μ)?','soal/bank_utbk_6_4d35c54b.png','34,1%','50,0%','68,2%','95,4%','99,7%','C','2026-11-10 09:26:23','2026-11-10 09:26:23'),(207,4,7,'Perhatikan gambar segitiga siku-siku pada teorema Pythagoras di atas. Jika panjang sisi alas a = 9 cm dan sisi tegak b = 12 cm, maka panjang sisi miring (hipotenusa) c adalah…','soal/bank_utbk_7_0e1ccb10.png','13 cm','14 cm','15 cm','18 cm','21 cm','C','2026-11-10 09:26:24','2026-11-10 09:26:24'),(209,4,9,'Perhatikan gambar graf berbobot (weighted graph) di atas. Algoritma klasik yang digunakan untuk mencari jalur terpendek (shortest path) dari satu simpul awal ke simpul lainnya dengan bobot tepi non-negatif adalah…','soal/bank_utbk_9_45ae787d.png','Algoritma Bubble Sort','Algoritma Dijkstra','Algoritma K-Means Clustering','Algoritma Caesar Cipher','Algoritma Binary Search','B','2026-11-10 09:26:27','2026-11-10 09:26:27'),(210,4,10,'Perhatikan diagram arsitektur Client–Server pada gambar di atas. Dalam aplikasi web modern, komunikasi permintaan (request) dan tanggapan (response) antara browser client dengan server API umumnya menggunakan protokol…','soal/bank_utbk_10_60f3342c.png','SMTP','HTTP / HTTPS','SNMP','ICMP','ARP','B','2026-11-10 09:26:28','2026-11-10 09:26:28'),(211,4,11,'Perhatikan ilustrasi diagram himpunan JOIN SQL di atas. Untuk mengambil seluruh baris dari tabel kiri (Tabel A) beserta data yang cocok dari tabel kanan (Tabel B), atau NULL bila tidak ada kecocokan, jenis JOIN yang digunakan adalah…','soal/bank_utbk_11_6eb24c69.png','INNER JOIN','LEFT OUTER JOIN','RIGHT OUTER JOIN','CROSS JOIN','SELF JOIN','B','2026-11-10 09:26:30','2026-11-10 09:26:30'),(212,4,12,'Perhatikan gambar arsitektur Jaringan Saraf Tiruan (Artificial Neural Network) di atas. Lapisan yang berada di antara Input Layer dan Output Layer untuk mengekstraksi representasi fitur disebut…','soal/bank_utbk_12_6c929558.png','Transport Layer','Hidden Layer','Session Layer','Physical Layer','Foreign Layer','B','2026-11-10 09:26:31','2026-11-10 09:26:31');
/*!40000 ALTER TABLE `soal` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-10 17:18:59
