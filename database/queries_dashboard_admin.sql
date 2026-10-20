-- ============================================
-- CONTOH QUERY SQL MURNI
-- Untuk Dashboard Admin
-- ============================================

-- Query 1: Laporan Log Proctoring Lengkap
-- Menampilkan semua log dengan informasi peserta dan ujian
SELECT 
    lp.id_log AS id_log,
    p.nama_lengkap AS nama_peserta,
    p.username AS username_peserta,
    lp.timestamp AS waktu_kejadian,
    lp.jenis_pelanggaran AS jenis_pelanggaran,
    lp.bukti_screenshot AS path_bukti_screenshot,
    lp.keterangan AS keterangan,
    u.judul_mata_kuliah AS mata_kuliah,
    u.tanggal AS tanggal_ujian,
    rj.skor_akhir AS skor
FROM log_proctoring lp
INNER JOIN pengguna p 
    ON lp.id_user = p.id_user
INNER JOIN rekam_jejak rj 
    ON lp.id_rekam_jejak = rj.id_rekam_jejak
INNER JOIN ujian u 
    ON rj.id_ujian = u.id_ujian
ORDER BY lp.timestamp DESC;


-- Query 2: Laporan Hanya Pelanggaran (Bukan Normal)
-- Filter untuk menampilkan hanya log yang berisi pelanggaran
SELECT 
    lp.id_log,
    p.nama_lengkap AS nama_peserta,
    p.username,
    lp.timestamp AS waktu_kejadian,
    lp.jenis_pelanggaran,
    lp.bukti_screenshot AS path_bukti_screenshot,
    u.judul_mata_kuliah
FROM log_proctoring lp
INNER JOIN pengguna p ON lp.id_user = p.id_user
INNER JOIN rekam_jejak rj ON lp.id_rekam_jejak = rj.id_rekam_jejak
INNER JOIN ujian u ON rj.id_ujian = u.id_ujian
WHERE lp.jenis_pelanggaran IN ('No Face', 'Multiple Faces', 'Looking Away', 'Suspicious Activity')
ORDER BY lp.timestamp DESC;


-- Query 3: Statistik Pelanggaran Per Peserta
-- Hitung total pelanggaran masing-masing jenis per peserta
SELECT 
    p.id_user,
    p.nama_lengkap,
    p.username,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'No Face' THEN 1 END) as total_no_face,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'Multiple Faces' THEN 1 END) as total_multiple_faces,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'Looking Away' THEN 1 END) as total_looking_away,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'Suspicious Activity' THEN 1 END) as total_suspicious,
    COUNT(CASE WHEN lp.jenis_pelanggaran != 'Normal' THEN 1 END) as total_pelanggaran
FROM pengguna p
LEFT JOIN log_proctoring lp ON p.id_user = lp.id_user
WHERE p.role = 'Peserta'
GROUP BY p.id_user, p.nama_lengkap, p.username
HAVING total_pelanggaran > 0
ORDER BY total_pelanggaran DESC;


-- Query 4: Laporan Per Ujian
-- Menampilkan statistik pelanggaran per ujian
SELECT 
    u.id_ujian,
    u.judul_mata_kuliah,
    u.tanggal,
    COUNT(DISTINCT lp.id_user) as jumlah_peserta_terdeteksi,
    COUNT(lp.id_log) as total_log,
    COUNT(CASE WHEN lp.jenis_pelanggaran != 'Normal' THEN 1 END) as total_pelanggaran,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'No Face' THEN 1 END) as total_no_face,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'Multiple Faces' THEN 1 END) as total_multiple_faces
FROM ujian u
LEFT JOIN rekam_jejak rj ON u.id_ujian = rj.id_ujian
LEFT JOIN log_proctoring lp ON rj.id_rekam_jejak = lp.id_rekam_jejak
GROUP BY u.id_ujian, u.judul_mata_kuliah, u.tanggal
ORDER BY u.tanggal DESC;


-- Query 5: Detail Log Satu Peserta
-- Menampilkan semua aktivitas log dari satu peserta
SELECT 
    lp.id_log,
    lp.timestamp AS waktu_kejadian,
    lp.jenis_pelanggaran,
    lp.bukti_screenshot,
    u.judul_mata_kuliah,
    u.tanggal AS tanggal_ujian,
    rj.skor_akhir
FROM log_proctoring lp
INNER JOIN rekam_jejak rj ON lp.id_rekam_jejak = rj.id_rekam_jejak
INNER JOIN ujian u ON rj.id_ujian = u.id_ujian
WHERE lp.id_user = ? -- Parameter: ID User yang ingin dilihat
ORDER BY lp.timestamp DESC;


-- Query 6: Peserta dengan Pelanggaran Terbanyak (Top 10)
-- Untuk highlight peserta yang perlu diperhatikan
SELECT 
    p.id_user,
    p.nama_lengkap,
    p.username,
    p.email,
    COUNT(lp.id_log) as total_pelanggaran
FROM pengguna p
INNER JOIN log_proctoring lp ON p.id_user = lp.id_user
WHERE lp.jenis_pelanggaran != 'Normal'
GROUP BY p.id_user, p.nama_lengkap, p.username, p.email
ORDER BY total_pelanggaran DESC
LIMIT 10;


-- Query 7: Log Proctoring Hari Ini
-- Filter log yang terjadi hari ini saja
SELECT 
    lp.id_log,
    p.nama_lengkap AS nama_peserta,
    lp.timestamp AS waktu_kejadian,
    lp.jenis_pelanggaran,
    u.judul_mata_kuliah
FROM log_proctoring lp
INNER JOIN pengguna p ON lp.id_user = p.id_user
INNER JOIN rekam_jejak rj ON lp.id_rekam_jejak = rj.id_rekam_jejak
INNER JOIN ujian u ON rj.id_ujian = u.id_ujian
WHERE DATE(lp.timestamp) = CURDATE()
ORDER BY lp.timestamp DESC;
