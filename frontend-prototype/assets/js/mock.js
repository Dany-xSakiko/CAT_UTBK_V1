/* ============================================================
   MockDB — basis data demo (localStorage)
   Struktur tabel mengikuti database/schema_cat_system.sql
   Dipakai hanya ketika CAT_CONFIG.DEMO_MODE = true
   ============================================================ */
(function () {
  'use strict';

  const CFG = window.CAT_CONFIG;
  const KEY = CFG.STORAGE.DB;

  /* ---------------------------------------------------------- util waktu */
  const pad = (n) => String(n).padStart(2, '0');
  const d2s = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const t2s = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const l2s = (d) => `${d2s(d)} ${t2s(d)}`;
  const shift = (days, jam = 8, menit = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(jam, menit, 0, 0);
    return d;
  };
  const iso = (d) => l2s(d).replace(' ', 'T');

  /* ---------------------------------------------------------- seed */
  function seed() {
    const today = new Date();

    /* ---- pengguna ---- */
    const pengguna = [
      { id_user: 1, username: 'admin', password: 'demo123', nama_lengkap: 'Administrator', role: 'Admin', email: 'admin@cat.utbk.test', created_at: iso(shift(-30, 7)) },
      { id_user: 2, username: 'peserta_001', password: 'demo123', nama_lengkap: 'Achmaddany Rozaqy', role: 'Peserta', email: 'dany@student.test', created_at: iso(shift(-20, 9)) },
      { id_user: 3, username: 'peserta_002', password: 'demo123', nama_lengkap: 'Shandy Prasetyo', role: 'Peserta', email: 'shandy@student.test', created_at: iso(shift(-20, 9)) },
      { id_user: 4, username: 'peserta_003', password: 'demo123', nama_lengkap: 'Muhammad Tamimudin', role: 'Peserta', email: 'tamim@student.test', created_at: iso(shift(-19, 10)) },
      { id_user: 5, username: 'peserta_004', password: 'demo123', nama_lengkap: 'Galih Bagus Kurniawan', role: 'Peserta', email: 'galih@student.test', created_at: iso(shift(-19, 10)) },
      { id_user: 6, username: 'peserta_005', password: 'demo123', nama_lengkap: 'Nadia Puspita Sari', role: 'Peserta', email: 'nadia@student.test', created_at: iso(shift(-12, 11)) },
      { id_user: 7, username: 'peserta_006', password: 'demo123', nama_lengkap: 'Rizky Maulana Akbar', role: 'Peserta', email: 'rizky@student.test', created_at: iso(shift(-12, 11)) }
    ];

    /* ---- ujian ---- */
    const ujian = [
      {
        id_ujian: 1, judul_mata_kuliah: 'Tes Potensi Skolastik — Penalaran Umum',
        tanggal: d2s(today), waktu_mulai: '07:30:00', waktu_selesai: '09:30:00',
        durasi_menit: 30, status_aktif: true, created_at: iso(shift(-10, 8))
      },
      {
        id_ujian: 2, judul_mata_kuliah: 'Tes Potensi Skolastik — Pengetahuan Kuantitatif',
        tanggal: d2s(shift(2)), waktu_mulai: '08:00:00', waktu_selesai: '10:00:00',
        durasi_menit: 30, status_aktif: false, created_at: iso(shift(-10, 8))
      },
      {
        id_ujian: 3, judul_mata_kuliah: 'Literasi Bahasa Indonesia',
        tanggal: d2s(shift(4)), waktu_mulai: '13:00:00', waktu_selesai: '15:00:00',
        durasi_menit: 25, status_aktif: false, created_at: iso(shift(-9, 8))
      },
      {
        id_ujian: 4, judul_mata_kuliah: 'Pemrograman Web Lanjut',
        tanggal: d2s(shift(-6)), waktu_mulai: '08:00:00', waktu_selesai: '10:00:00',
        durasi_menit: 30, status_aktif: false, created_at: iso(shift(-20, 8))
      }
    ];

    /* ---- soal ---- */
    let sid = 0;
    const S = (id_ujian, no, teks, a, b, c, d, e, kunci) => ({
      id_soal: ++sid, id_ujian, nomor_urut: no, teks_soal: teks,
      opsi_a: a, opsi_b: b, opsi_c: c, opsi_d: d, opsi_e: e,
      kunci_jawaban: kunci, created_at: iso(shift(-10, 9))
    });

    const soal = [
      /* ===== UJIAN 1 — Penalaran Umum ===== */
      S(1, 1,
        `Perhatikan pola bilangan berikut:\n\n3, 6, 11, 18, 27, …\n\nBilangan yang tepat untuk melanjutkan pola tersebut adalah …`,
        '34', '36', '38', '40', '42', 'C'),
      S(1, 2,
        `Semua mahasiswa wajib mengisi KRS setiap semester. Sebagian mahasiswa yang mengisi KRS juga mengikuti program KKN.\n\nKesimpulan yang paling tepat adalah …`,
        'Semua peserta KKN wajib mengisi KRS',
        'Sebagian peserta KKN adalah mahasiswa yang mengisi KRS',
        'Semua mahasiswa mengikuti program KKN',
        'Mahasiswa yang tidak mengisi KRS tidak mengikuti KKN',
        'Tidak dapat ditarik kesimpulan', 'B'),
      S(1, 3,
        `Jika hujan turun, maka jalan di depan kampus basah. Ternyata jalan di depan kampus tidak basah.\n\nKesimpulan yang sah adalah …`,
        'Hujan turun dengan deras',
        'Hujan tidak turun',
        'Jalan basah karena sebab lain',
        'Tidak dapat disimpulkan',
        'Hujan turun sebentar', 'B'),
      S(1, 4,
        `DOKTER : PASIEN = … : …`,
        'Guru : Murid', 'Petani : Sawah', 'Pilot : Pesawat', 'Hakim : Hukum', 'Penulis : Buku', 'A'),
      S(1, 5,
        `Perhatikan deret huruf berikut:\n\nA, C, F, J, O, …\n\nHuruf yang tepat untuk melanjutkan deret tersebut adalah …`,
        'R', 'S', 'T', 'U', 'V', 'D'),
      S(1, 6,
        `Sebuah pekerjaan dapat diselesaikan oleh 3 orang dalam 12 hari. Jika pekerjaan tersebut harus selesai dalam 9 hari, jumlah pekerja yang dibutuhkan adalah …`,
        '3 orang', '4 orang', '5 orang', '6 orang', '7 orang', 'B'),
      S(1, 7,
        `Sebuah baju dijual dengan harga Rp240.000 setelah mendapat diskon 20%. Harga awal baju tersebut adalah …`,
        'Rp280.000', 'Rp288.000', 'Rp300.000', 'Rp320.000', 'Rp336.000', 'C'),
      S(1, 8,
        `Lima mahasiswa — Andi, Budi, Citra, Dina, dan Eka — duduk berjajar. Andi duduk di ujung kiri. Citra tepat di sebelah kanan Budi. Dina tidak duduk di ujung.\n\nPernyataan yang pasti benar adalah …`,
        'Budi duduk di posisi kedua',
        'Citra duduk di posisi ketiga',
        'Eka duduk di ujung kanan',
        'Dina duduk di posisi ketiga',
        'Andi dan Dina duduk bersebelahan', 'A'),
      S(1, 9,
        `Bacalah paragraf berikut.\n\n“(1) Pemerintah terus mendorong percepatan transformasi digital di sektor pendidikan. (2) Namun, kesenjangan infrastruktur internet masih menjadi hambatan utama, terutama di daerah terpencil. (3) Tanpa pemerataan akses, kebijakan digitalisasi berpotensi memperlebar ketimpangan mutu pendidikan. (4) Oleh karena itu, pembangunan infrastruktur jaringan perlu diprioritaskan sebelum program digitalisasi diperluas.”\n\nGagasan utama paragraf tersebut adalah …`,
        'Pemerintah mendorong transformasi digital pendidikan',
        'Kesenjangan infrastruktur internet menghambat digitalisasi pendidikan',
        'Daerah terpencil belum memiliki akses internet',
        'Digitalisasi berpotensi memperlebar ketimpangan',
        'Pembangunan infrastruktur jaringan harus diprioritaskan', 'B'),
      S(1, 10,
        `Sebuah tim beranggotakan 5 orang akan dipilih dari 8 kandidat. Banyak susunan tim yang mungkin terbentuk adalah …`,
        '28', '40', '56', '70', '112', 'C'),

      /* ===== UJIAN 2 — Pengetahuan Kuantitatif ===== */
      S(2, 1,
        `Akar-akar persamaan kuadrat x² − 6x + 8 = 0 adalah …`,
        'x = 2 dan x = 4', 'x = −2 dan x = −4', 'x = 1 dan x = 8',
        'x = −1 dan x = −8', 'x = 0 dan x = 6', 'A'),
      S(2, 2,
        `Rata-rata nilai 10 mahasiswa adalah 78. Setelah satu mahasiswa baru bergabung dengan nilai 89, rata-rata menjadi …`,
        '78,5', '79,0', '79,5', '80,0', '80,5', 'B'),
      S(2, 3,
        `Dua dadu dilempar satu kali. Peluang munculnya jumlah mata dadu 9 adalah …`,
        '1/18', '1/9', '1/6', '5/36', '1/12', 'B'),
      S(2, 4,
        `Suku ke-6 dari barisan geometri 3, 6, 12, … adalah …`,
        '48', '64', '88', '96', '192', 'D'),
      S(2, 5,
        `Nilai minimum dari fungsi f(x) = x² − 4x + 7 adalah …`,
        '1', '2', '3', '4', '7', 'C'),
      S(2, 6,
        `Data: 4, 7, 7, 9, 11, 13, 15. Median dari data tersebut adalah …`,
        '7', '8', '9', '10', '11', 'C'),
      S(2, 7,
        `Sebuah lingkaran memiliki keliling 31,4 cm. Luas lingkaran tersebut adalah … (π = 3,14)`,
        '31,4 cm²', '62,8 cm²', '78,5 cm²', '100 cm²', '157 cm²', 'C'),
      S(2, 8,
        `Diketahui 2x + 3y = 18 dan x − y = 1. Nilai dari x + y adalah …`,
        '5', '6', '7', '8', '9', 'C'),

      /* ===== UJIAN 3 — Literasi Bahasa Indonesia ===== */
      S(3, 1,
        `Bacalah paragraf berikut.\n\n“Kualitas udara di kota-kota besar terus menurun dalam lima tahun terakhir. Peningkatan jumlah kendaraan bermotor menjadi penyebab utama. Selain itu, berkurangnya ruang terbuka hijau memperparah kondisi tersebut. Pemerintah daerah pun mulai menggalakkan penanaman pohon di sepanjang jalan protokol.”\n\nSimpulan yang tepat untuk paragraf tersebut adalah …`,
        'Kualitas udara menurun hanya karena kendaraan bermotor',
        'Ruang terbuka hijau tidak berpengaruh terhadap kualitas udara',
        'Penurunan kualitas udara disebabkan oleh kendaraan dan berkurangnya ruang hijau',
        'Pemerintah menggalakkan penanaman pohon untuk mempercantik kota',
        'Kualitas udara di desa juga menurun', 'C'),
      S(3, 2,
        `Makna kata “memperparah” pada paragraf tersebut adalah …`,
        'Mengurangi', 'Menambah baik', 'Membuat lebih buruk', 'Menghambat', 'Memperlambat', 'C'),
      S(3, 3,
        `Kalimat berikut yang merupakan opini adalah …`,
        'Ujian nasional dihapus pada tahun 2021',
        'Indonesia memiliki lebih dari 17.000 pulau',
        'Kebijakan tersebut seharusnya lebih berpihak pada pelajar',
        'Air mendidih pada suhu 100°C di tekanan normal',
        'Kemendikbud merilis data pada Senin lalu', 'C'),
      S(3, 4,
        `“Pemerintah telah membangun banyak infrastruktur. _____, akses masyarakat di pedalaman masih terbatas.”\n\nKonjungsi yang tepat untuk melengkapi kalimat tersebut adalah …`,
        'Oleh sebab itu', 'Namun', 'Karena itu', 'Selain itu', 'Dengan demikian', 'B'),
      S(3, 5,
        `Tujuan penulis pada teks yang memaparkan data penurunan kualitas udara beserta penyebabnya adalah …`,
        'Menghibur pembaca', 'Meyakinkan pembaca agar menanam pohon',
        'Menginformasikan kondisi dan penyebab masalah', 'Mengkritik pemerintah tanpa bukti',
        'Menceritakan pengalaman pribadi', 'C'),
      S(3, 6,
        `Penulisan kata baku yang benar adalah …`,
        'apotik, ijasah, praktek', 'apotek, ijazah, praktik',
        'apotik, ijazah, praktek', 'apotek, ijasah, praktek', 'apotik, ijasah, praktik', 'B'),

      /* ===== UJIAN 4 — Pemrograman Web Lanjut (arsip) ===== */
      S(4, 1,
        `Method HTTP yang paling tepat untuk mengambil data tanpa mengubah state adalah …`,
        'POST', 'GET', 'PUT', 'DELETE', 'PATCH', 'B'),
      S(4, 2,
        `Pada Laravel, file yang mengatur pemetaan URL ke controller disebut …`,
        'middleware.php', 'routes/web.php', 'config/app.php', 'app/Http/Kernel.php', 'bootstrap/app.php', 'B'),
      S(4, 3,
        `Kode status HTTP yang menandakan sumber daya berhasil dibuat adalah …`,
        '200', '201', '204', '301', '404', 'B')
    ];

    /* ---- rekam jejak ---- */
    const rekam_jejak = [
      {
        id_rekam_jejak: 1, id_user: 2, id_ujian: 4,
        waktu_mulai: iso(shift(-6, 8, 2)), waktu_selesai: iso(shift(-6, 8, 24)),
        skor_akhir: 100.00, total_soal: 3, total_benar: 3, total_salah: 0,
        status_pengerjaan: 'selesai', created_at: iso(shift(-6, 8, 2))
      },
      {
        id_rekam_jejak: 2, id_user: 3, id_ujian: 4,
        waktu_mulai: iso(shift(-6, 8, 5)), waktu_selesai: iso(shift(-6, 8, 28)),
        skor_akhir: 66.67, total_soal: 3, total_benar: 2, total_salah: 1,
        status_pengerjaan: 'selesai', created_at: iso(shift(-6, 8, 5))
      },
      {
        id_rekam_jejak: 3, id_user: 4, id_ujian: 4,
        waktu_mulai: iso(shift(-6, 8, 7)), waktu_selesai: iso(shift(-6, 8, 29)),
        skor_akhir: 66.67, total_soal: 3, total_benar: 2, total_salah: 1,
        status_pengerjaan: 'selesai', created_at: iso(shift(-6, 8, 7))
      },
      {
        id_rekam_jejak: 4, id_user: 5, id_ujian: 4,
        waktu_mulai: iso(shift(-6, 8, 9)), waktu_selesai: iso(shift(-6, 8, 21)),
        skor_akhir: 33.33, total_soal: 3, total_benar: 1, total_salah: 2,
        status_pengerjaan: 'selesai', created_at: iso(shift(-6, 8, 9))
      },
      {
        id_rekam_jejak: 5, id_user: 6, id_ujian: 4,
        waktu_mulai: iso(shift(-6, 8, 11)), waktu_selesai: null,
        skor_akhir: null, total_soal: 3, total_benar: 0, total_salah: 0,
        status_pengerjaan: 'diskualifikasi', created_at: iso(shift(-6, 8, 11))
      }
    ];

    /* ---- jawaban peserta (untuk rekam 1 & 2, sebagai riwayat) ---- */
    const jawaban_peserta = [
      { id_jawaban: 1, id_rekam_jejak: 1, id_soal: 22, jawaban_dipilih: 'B', status_benar_salah: true, waktu_dijawab: iso(shift(-6, 8, 9)) },
      { id_jawaban: 2, id_rekam_jejak: 1, id_soal: 23, jawaban_dipilih: 'B', status_benar_salah: true, waktu_dijawab: iso(shift(-6, 8, 15)) },
      { id_jawaban: 3, id_rekam_jejak: 1, id_soal: 24, jawaban_dipilih: 'B', status_benar_salah: true, waktu_dijawab: iso(shift(-6, 8, 22)) },
      { id_jawaban: 4, id_rekam_jejak: 2, id_soal: 22, jawaban_dipilih: 'B', status_benar_salah: true, waktu_dijawab: iso(shift(-6, 8, 10)) },
      { id_jawaban: 5, id_rekam_jejak: 2, id_soal: 23, jawaban_dipilih: 'A', status_benar_salah: false, waktu_dijawab: iso(shift(-6, 8, 18)) },
      { id_jawaban: 6, id_rekam_jejak: 2, id_soal: 24, jawaban_dipilih: 'B', status_benar_salah: true, waktu_dijawab: iso(shift(-6, 8, 26)) }
    ];

    /* ---- log proctoring ---- */
    const jenis = ['No Face', 'Multiple Faces', 'Looking Away', 'Suspicious Activity'];
    const log_proctoring = [];
    let lid = 0;
    const ev = [
      [1, 2, 'No Face', 'Wajah tidak terdeteksi selama 9 detik', -6, 8, 3, 'bukti-1.jpg'],
      [1, 2, 'Looking Away', 'Peserta menoleh ke arah kiri layar', -6, 8, 4, 'bukti-2.jpg'],
      [2, 3, 'Multiple Faces', 'Terdeteksi 2 wajah dalam frame', -6, 8, 6, 'bukti-3.jpg'],
      [3, 3, 'No Face', 'Wajah tidak terdeteksi selama 6 detik', -6, 8, 8, 'bukti-4.jpg'],
      [4, 4, 'Looking Away', 'Pandangan keluar dari area layar', -6, 8, 10, null],
      [5, 5, 'Multiple Faces', 'Terdeteksi 3 wajah dalam frame', -6, 8, 12, 'bukti-5.jpg'],
      [5, 5, 'Suspicious Activity', 'Objek menyerupai ponsel terdeteksi di frame', -6, 8, 13, 'bukti-6.jpg'],
      [7, 6, 'No Face', 'Peserta meninggalkan tempat duduk', -2, 9, 5, 'bukti-7.jpg']
    ];
    ev.forEach(([rek, user, jp, ket, d, h, m, img], i) => {
      log_proctoring.push({
        id_log: ++lid, id_rekam_jejak: rek, id_user: user,
        timestamp: iso(shift(d, h, m)),
        jenis_pelanggaran: jp,
        bukti_screenshot: img ? `/assets/img/bukti/${img}` : null,
        keterangan: ket,
        created_at: iso(shift(d, h, m))
      });
    });

    return {
      meta: { versi: 1, dibuat: iso(new Date()) },
      pengguna, ujian, soal, rekam_jejak, jawaban_peserta, log_proctoring
    };
  }

  /* ---------------------------------------------------------- storage */
  const DB = {
    _data: null,

    load() {
      if (this._data) return this._data;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.meta && parsed.meta.versi === 1) {
            this._data = parsed;
            return this._data;
          }
        }
      } catch (e) { /* data rusak → reset */ }
      this._data = seed();
      this.save();
      return this._data;
    },

    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this._data)); }
      catch (e) { console.warn('Gagal menyimpan DB demo:', e); }
    },

    reset() {
      localStorage.removeItem(KEY);
      this._data = seed();
      this.save();
      return this._data;
    },

    nextId(tabel, kolom) {
      const d = this.load()[tabel] || [];
      return d.reduce((max, r) => Math.max(max, Number(r[kolom]) || 0), 0) + 1;
    },

    /* helper query */
    find(tabel, fn) { return (this.load()[tabel] || []).find(fn) || null; },
    filter(tabel, fn) { return (this.load()[tabel] || []).filter(fn); },
    all(tabel) { return (this.load()[tabel] || []).slice(); },

    insert(tabel, row) {
      this.load()[tabel].push(row);
      this.save();
      return row;
    },

    update(tabel, kolom, id, patch) {
      const row = this.find(tabel, r => String(r[kolom]) === String(id));
      if (!row) return null;
      Object.assign(row, patch);
      this.save();
      return row;
    },

    remove(tabel, kolom, id) {
      const d = this.load()[tabel];
      const i = d.findIndex(r => String(r[kolom]) === String(id));
      if (i < 0) return false;
      d.splice(i, 1);
      this.save();
      return true;
    }
  };

  window.MockDB = DB;
})();
