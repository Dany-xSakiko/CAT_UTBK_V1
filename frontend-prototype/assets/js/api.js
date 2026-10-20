/* ============================================================
   Api — lapisan data tunggal
   DEMO_MODE = true  → localStorage (MockDB)
   DEMO_MODE = false → HTTP ke CAT_CONFIG.API_BASE (Laravel)
   ============================================================ */
(function () {
  'use strict';

  const CFG = window.CAT_CONFIG;
  const SESSION_KEY = CFG.STORAGE.SESSION;

  /* Peta endpoint untuk backend Laravel — dipakai saat DEMO_MODE = false.
     Sesuaikan dengan routes/api.php milikmu. */
  const EP = {
    login:        { m: 'POST', p: '/login' },
    me:           { m: 'GET',  p: '/me' },

    ujian:        { m: 'GET',  p: '/ujian' },
    ujianDetail:  { m: 'GET',  p: '/ujian/:id' },
    ujianCreate:  { m: 'POST', p: '/ujian' },
    ujianUpdate:  { m: 'PUT',  p: '/ujian/:id' },
    ujianDelete:  { m: 'DELETE', p: '/ujian/:id' },

    soal:         { m: 'GET',  p: '/soal' },
    soalCreate:   { m: 'POST', p: '/soal' },
    soalUpdate:   { m: 'PUT',  p: '/soal/:id' },
    soalDelete:   { m: 'DELETE', p: '/soal/:id' },

    pengguna:     { m: 'GET',  p: '/pengguna' },
    penggunaCreate: { m: 'POST', p: '/pengguna' },
    penggunaUpdate: { m: 'PUT',  p: '/pengguna/:id' },
    penggunaDelete: { m: 'DELETE', p: '/pengguna/:id' },

    mulai:        { m: 'POST', p: '/ujian/:id/mulai' },
    jawab:        { m: 'POST', p: '/rekam/:id/jawab' },
    selesai:      { m: 'POST', p: '/rekam/:id/selesai' },
    rekamDetail:  { m: 'GET',  p: '/rekam/:id' },

    logProctor:   { m: 'POST', p: '/proctoring/log/base64' },
    logList:      { m: 'GET',  p: '/proctoring/logs/:id' },

    laporan:      { m: 'GET',  p: '/admin/laporan/proctoring/eloquent' },
    statistik:    { m: 'GET',  p: '/admin/statistik/pelanggaran' }
  };

  const path = (tpl, params = {}) =>
    tpl.replace(/:(\w+)/g, (_, k) => encodeURIComponent(params[k] ?? ''));

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* Waktu lokal "YYYY-MM-DDTHH:mm:ss" — naive, tanpa zona waktu.
     Samakan dengan format yang dipakai Laravel (app timezone) dan MockDB.
     Jangan pakai toISOString() di sini: itu UTC, sehingga deadline ujian
     meleset sebesar offset zona waktu (di WIB: 7 jam → timer langsung habis). */
  const nowLocal = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T` +
           `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  /* ---------------------------------------------------------- session */
  const Session = {
    get() {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
      catch (e) { return null; }
    },
    set(data) { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); },
    clear() { localStorage.removeItem(SESSION_KEY); },
    user() { const s = this.get(); return s ? s.user : null; }
  };

  /* ---------------------------------------------------------- HTTP */
  async function http(method, url, body, isForm) {
    const headers = { Accept: 'application/json' };
    const s = Session.get();
    if (s && s.token) headers['Authorization'] = 'Bearer ' + s.token;

    let payload = body;
    if (body && !isForm) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const res = await fetch(CFG.API_BASE + url, {
      method, headers, body: payload,
      credentials: 'same-origin'
    });

    let data = null;
    try { data = await res.json(); } catch (e) { /* bukan json */ }

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `Request gagal (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.errors = data && data.errors;
      throw err;
    }
    return data;
  }

  /* ---------------------------------------------------------- demo helpers */
  const DB = () => window.MockDB;

  function sanitizeSoal(s, withKey) {
    const o = {
      id_soal: s.id_soal, id_ujian: s.id_ujian, nomor_urut: s.nomor_urut,
      teks_soal: s.teks_soal,
      opsi_a: s.opsi_a, opsi_b: s.opsi_b, opsi_c: s.opsi_c,
      opsi_d: s.opsi_d, opsi_e: s.opsi_e
    };
    if (withKey) o.kunci_jawaban = s.kunci_jawaban;
    return o;
  }

  function hitungSkor(idRekam) {
    const db = DB();
    const jawab = db.filter('jawaban_peserta', j => j.id_rekam_jejak === idRekam);
    const soalUjian = db.filter('soal', s => {
      const r = db.find('rekam_jejak', x => x.id_rekam_jejak === idRekam);
      return r && s.id_ujian === r.id_ujian;
    });
    let benar = 0, salah = 0;
    soalUjian.forEach(s => {
      const j = jawab.find(x => x.id_soal === s.id_soal);
      if (j && j.jawaban_dipilih) {
        const ok = j.jawaban_dipilih === s.kunci_jawaban;
        j.status_benar_salah = ok;
        ok ? benar++ : salah++;
      }
    });
    db.save();
    const total = soalUjian.length || 1;
    return {
      total_soal: soalUjian.length,
      total_benar: benar,
      total_salah: salah,
      skor_akhir: Math.round((benar / total) * 10000) / 100
    };
  }

  /* Simpan screenshot demo dengan batas kuota */
  function simpanBukti(dataUrl) {
    if (!dataUrl) return null;
    const db = DB();
    const logs = db.all('log_proctoring').filter(l => l.bukti_screenshot && l.bukti_screenshot.startsWith('data:'));
    if (logs.length >= 20) {
      logs.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
      logs.slice(0, logs.length - 19).forEach(l => { l.bukti_screenshot = null; });
    }
    return dataUrl;
  }

  /* ---------------------------------------------------------- API objek */
  const Api = {
    mode: CFG.DEMO_MODE ? 'demo' : 'live',
    Session,
    endpoints: EP,

    /* ---------------- AUTH ---------------- */
    async login(username, password) {
      if (CFG.DEMO_MODE) {
        await sleep(220);
        const u = DB().find('pengguna', p => p.username.toLowerCase() === String(username).toLowerCase().trim());
        if (!u || u.password !== password) {
          const e = new Error('Username atau password salah.');
          e.status = 401;
          throw e;
        }
        const user = { id_user: u.id_user, username: u.username, nama_lengkap: u.nama_lengkap, role: u.role, email: u.email };
        const token = 'demo.' + btoa(u.username + ':' + Date.now());
        Session.set({ token, user, login_at: new Date().toISOString() });
        return { success: true, token, user };
      }
      const r = await http(EP.login.m, EP.login.p, { username, password });
      const user = r.user || r.data;
      Session.set({ token: r.token || r.access_token, user, login_at: new Date().toISOString() });
      return { success: true, user };
    },

    logout() {
      Session.clear();
    },

    me() {
      return Session.user();
    },

    /* ---------------- UJIAN ---------------- */
    async listUjian(opts = {}) {
      if (CFG.DEMO_MODE) {
        await sleep(80);
        let rows = DB().all('ujian');
        if (opts.aktifOnly) rows = rows.filter(u => !!u.status_aktif);
        if (opts.q) {
          const q = opts.q.toLowerCase();
          rows = rows.filter(u => u.judul_mata_kuliah.toLowerCase().includes(q));
        }
        rows.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)) || b.id_ujian - a.id_ujian);
        return rows.map(u => {
          const soalCount = DB().filter('soal', s => s.id_ujian === u.id_ujian).length;
          const peserta = DB().filter('rekam_jejak', r => r.id_ujian === u.id_ujian).length;
          return { ...u, jumlah_soal: soalCount, jumlah_peserta: peserta };
        });
      }
      const r = await http(EP.ujian.m, EP.ujian.p + (opts.aktifOnly ? '?aktif=1' : ''));
      return r.data || r;
    },

    async getUjian(id) {
      if (CFG.DEMO_MODE) {
        await sleep(60);
        const u = DB().find('ujian', x => String(x.id_ujian) === String(id));
        if (!u) throw new Error('Ujian tidak ditemukan');
        return { ...u, jumlah_soal: DB().filter('soal', s => s.id_ujian === u.id_ujian).length };
      }
      const r = await http(EP.ujianDetail.m, path(EP.ujianDetail.p, { id }));
      return r.data || r;
    },

    async createUjian(payload) {
      if (CFG.DEMO_MODE) {
        await sleep(160);
        const id = DB().nextId('ujian', 'id_ujian');
        const row = {
          id_ujian: id,
          judul_mata_kuliah: payload.judul_mata_kuliah,
          tanggal: payload.tanggal,
          waktu_mulai: payload.waktu_mulai,
          waktu_selesai: payload.waktu_selesai,
          durasi_menit: Number(payload.durasi_menit) || 0,
          status_aktif: !!payload.status_aktif,
          created_at: nowLocal()
        };
        DB().insert('ujian', row);
        return row;
      }
      return http(EP.ujianCreate.m, EP.ujianCreate.p, payload);
    },

    async updateUjian(id, payload) {
      if (CFG.DEMO_MODE) {
        await sleep(160);
        const row = DB().update('ujian', 'id_ujian', id, {
          judul_mata_kuliah: payload.judul_mata_kuliah,
          tanggal: payload.tanggal,
          waktu_mulai: payload.waktu_mulai,
          waktu_selesai: payload.waktu_selesai,
          durasi_menit: Number(payload.durasi_menit) || 0,
          status_aktif: !!payload.status_aktif
        });
        if (!row) throw new Error('Ujian tidak ditemukan');
        return row;
      }
      return http(EP.ujianUpdate.m, path(EP.ujianUpdate.p, { id }), payload);
    },

    async deleteUjian(id) {
      if (CFG.DEMO_MODE) {
        await sleep(140);
        const idn = String(id);
        DB().load().soal = DB().filter('soal', s => String(s.id_ujian) !== idn);
        DB().load().rekam_jejak = DB().filter('rekam_jejak', r => String(r.id_ujian) !== idn);
        DB().remove('ujian', 'id_ujian', id);
        DB().save();
        return { success: true };
      }
      return http(EP.ujianDelete.m, path(EP.ujianDelete.p, { id }));
    },

    /* ---------------- SOAL ---------------- */
    async listSoal(idUjian, withKey = false) {
      if (CFG.DEMO_MODE) {
        await sleep(80);
        const rows = DB().filter('soal', s => String(s.id_ujian) === String(idUjian))
          .sort((a, b) => a.nomor_urut - b.nomor_urut);
        return rows.map(s => sanitizeSoal(s, withKey));
      }
      const r = await http(EP.soal.m, EP.soal.p + '?id_ujian=' + encodeURIComponent(idUjian));
      return r.data || r;
    },

    async createSoal(payload) {
      if (CFG.DEMO_MODE) {
        await sleep(150);
        const idUjian = Number(payload.id_ujian);
        const existing = DB().filter('soal', s => s.id_ujian === idUjian);
        const no = payload.nomor_urut ? Number(payload.nomor_urut)
          : existing.reduce((m, s) => Math.max(m, s.nomor_urut), 0) + 1;
        if (existing.some(s => s.nomor_urut === no)) {
          throw new Error(`Nomor urut ${no} sudah dipakai pada ujian ini.`);
        }
        const row = {
          id_soal: DB().nextId('soal', 'id_soal'),
          id_ujian: idUjian, nomor_urut: no,
          teks_soal: payload.teks_soal,
          opsi_a: payload.opsi_a, opsi_b: payload.opsi_b,
          opsi_c: payload.opsi_c, opsi_d: payload.opsi_d,
          opsi_e: payload.opsi_e,
          kunci_jawaban: String(payload.kunci_jawaban).toUpperCase(),
          created_at: nowLocal()
        };
        DB().insert('soal', row);
        return row;
      }
      return http(EP.soalCreate.m, EP.soalCreate.p, payload);
    },

    async updateSoal(id, payload) {
      if (CFG.DEMO_MODE) {
        await sleep(150);
        const cur = DB().find('soal', s => String(s.id_soal) === String(id));
        if (!cur) throw new Error('Soal tidak ditemukan');
        const no = Number(payload.nomor_urut || cur.nomor_urut);
        const bentrok = DB().filter('soal', s => s.id_ujian === cur.id_ujian && s.nomor_urut === no && s.id_soal !== cur.id_soal);
        if (bentrok.length) throw new Error(`Nomor urut ${no} sudah dipakai pada ujian ini.`);
        const row = DB().update('soal', 'id_soal', id, {
          nomor_urut: no,
          teks_soal: payload.teks_soal,
          opsi_a: payload.opsi_a, opsi_b: payload.opsi_b,
          opsi_c: payload.opsi_c, opsi_d: payload.opsi_d,
          opsi_e: payload.opsi_e,
          kunci_jawaban: String(payload.kunci_jawaban).toUpperCase()
        });
        return row;
      }
      return http(EP.soalUpdate.m, path(EP.soalUpdate.p, { id }), payload);
    },

    async deleteSoal(id) {
      if (CFG.DEMO_MODE) {
        await sleep(130);
        DB().remove('soal', 'id_soal', id);
        return { success: true };
      }
      return http(EP.soalDelete.m, path(EP.soalDelete.p, { id }));
    },

    /* ---------------- PENGGUNA ---------------- */
    async listPengguna() {
      if (CFG.DEMO_MODE) {
        await sleep(70);
        return DB().all('pengguna').map(({ password, ...u }) => u);
      }
      const r = await http(EP.pengguna.m, EP.pengguna.p);
      return r.data || r;
    },

    async createPengguna(payload) {
      if (CFG.DEMO_MODE) {
        await sleep(160);
        const dup = DB().find('pengguna', p => p.username.toLowerCase() === String(payload.username).toLowerCase());
        if (dup) throw new Error('Username sudah dipakai.');
        const row = {
          id_user: DB().nextId('pengguna', 'id_user'),
          username: payload.username,
          password: payload.password || 'demo123',
          nama_lengkap: payload.nama_lengkap,
          role: payload.role,
          email: payload.email || null,
          created_at: nowLocal()
        };
        DB().insert('pengguna', row);
        const { password, ...safe } = row;
        return safe;
      }
      return http(EP.penggunaCreate.m, EP.penggunaCreate.p, payload);
    },

    async updatePengguna(id, payload) {
      if (CFG.DEMO_MODE) {
        await sleep(160);
        const patch = {
          nama_lengkap: payload.nama_lengkap,
          role: payload.role,
          email: payload.email || null
        };
        if (payload.username) patch.username = payload.username;
        if (payload.password) patch.password = payload.password;
        const row = DB().update('pengguna', 'id_user', id, patch);
        if (!row) throw new Error('Pengguna tidak ditemukan');
        const { password, ...safe } = row;
        return safe;
      }
      return http(EP.penggunaUpdate.m, path(EP.penggunaUpdate.p, { id }), payload);
    },

    async deletePengguna(id) {
      if (CFG.DEMO_MODE) {
        await sleep(130);
        DB().remove('pengguna', 'id_user', id);
        return { success: true };
      }
      return http(EP.penggunaDelete.m, path(EP.penggunaDelete.p, { id }));
    },

    /* ---------------- PENGERJAAN UJIAN ---------------- */
    async mulaiUjian(idUjian) {
      if (CFG.DEMO_MODE) {
        await sleep(200);
        const user = Api.me();
        if (!user) throw new Error('Sesi habis, silakan login ulang.');
        const ujian = DB().find('ujian', u => String(u.id_ujian) === String(idUjian));
        if (!ujian) throw new Error('Ujian tidak ditemukan.');
        if (!ujian.status_aktif) throw new Error('Ujian sedang tidak aktif.');

        let rekam = DB().find('rekam_jejak',
          r => String(r.id_user) === String(user.id_user) && String(r.id_ujian) === String(idUjian));

        if (rekam && rekam.status_pengerjaan === 'selesai') {
          const e = new Error('Kamu sudah menyelesaikan ujian ini.');
          e.code = 'SUDAH_SELESAI';
          e.id_rekam_jejak = rekam.id_rekam_jejak;
          throw e;
        }
        if (!rekam) {
          rekam = {
            id_rekam_jejak: DB().nextId('rekam_jejak', 'id_rekam_jejak'),
            id_user: user.id_user, id_ujian: Number(idUjian),
            waktu_mulai: nowLocal(),
            waktu_selesai: null, skor_akhir: null,
            total_soal: DB().filter('soal', s => String(s.id_ujian) === String(idUjian)).length,
            total_benar: 0, total_salah: 0,
            status_pengerjaan: 'sedang_mengerjakan',
            created_at: nowLocal()
          };
          DB().insert('rekam_jejak', rekam);
        }

        const soal = DB().filter('soal', s => String(s.id_ujian) === String(idUjian))
          .sort((a, b) => a.nomor_urut - b.nomor_urut)
          .map(s => sanitizeSoal(s, false));

        const jawaban = DB().filter('jawaban_peserta', j => j.id_rekam_jejak === rekam.id_rekam_jejak)
          .map(j => ({ id_soal: j.id_soal, jawaban_dipilih: j.jawaban_dipilih }));

        const startedAt = new Date(String(rekam.waktu_mulai).replace(' ', 'T')).getTime();
        const deadline = startedAt + (Number(ujian.durasi_menit) * 60000);

        return { rekam, ujian, soal, jawaban, deadline, durasi_menit: ujian.durasi_menit };
      }

      const r = await http(EP.mulai.m, path(EP.mulai.p, { id: idUjian }));
      return r.data || r;
    },

    async simpanJawaban(idRekam, idSoal, jawaban) {
      if (CFG.DEMO_MODE) {
        const existing = DB().find('jawaban_peserta',
          j => j.id_rekam_jejak === Number(idRekam) && j.id_soal === Number(idSoal));
        const now = nowLocal();
        if (existing) {
          existing.jawaban_dipilih = jawaban;
          existing.waktu_dijawab = now;
        } else {
          DB().insert('jawaban_peserta', {
            id_jawaban: DB().nextId('jawaban_peserta', 'id_jawaban'),
            id_rekam_jejak: Number(idRekam),
            id_soal: Number(idSoal),
            jawaban_dipilih: jawaban,
            status_benar_salah: null,
            waktu_dijawab: now,
            created_at: now
          });
        }
        DB().save();
        return { success: true };
      }
      return http(EP.jawab.m, path(EP.jawab.p, { id: idRekam }), { id_soal: idSoal, jawaban_dipilih: jawaban });
    },

    async selesaiUjian(idRekam, opts = {}) {
      if (CFG.DEMO_MODE) {
        await sleep(420);
        const skor = hitungSkor(Number(idRekam));
        const row = DB().update('rekam_jejak', 'id_rekam_jejak', idRekam, {
          waktu_selesai: nowLocal(),
          status_pengerjaan: opts.diskualifikasi ? 'diskualifikasi' : 'selesai',
          ...skor
        });
        return { success: true, hasil: { ...row, ...skor } };
      }
      return http(EP.selesai.m, path(EP.selesai.p, { id: idRekam }), {
        diskualifikasi: !!opts.diskualifikasi,
        alasan: opts.alasan || null
      });
    },

    async getHasil(idRekam) {
      if (CFG.DEMO_MODE) {
        await sleep(180);
        const rekam = DB().find('rekam_jejak', r => String(r.id_rekam_jejak) === String(idRekam));
        if (!rekam) throw new Error('Data hasil tidak ditemukan.');
        const ujian = DB().find('ujian', u => u.id_ujian === rekam.id_ujian);
        const soal = DB().filter('soal', s => s.id_ujian === rekam.id_ujian)
          .sort((a, b) => a.nomor_urut - b.nomor_urut);
        const jawaban = DB().filter('jawaban_peserta', j => j.id_rekam_jejak === rekam.id_rekam_jejak);
        const logs = DB().filter('log_proctoring', l => l.id_rekam_jejak === rekam.id_rekam_jejak)
          .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));

        const rincian = soal.map(s => {
          const j = jawaban.find(x => x.id_soal === s.id_soal);
          return {
            id_soal: s.id_soal, nomor_urut: s.nomor_urut, teks_soal: s.teks_soal,
            opsi: { A: s.opsi_a, B: s.opsi_b, C: s.opsi_c, D: s.opsi_d, E: s.opsi_e },
            kunci_jawaban: s.kunci_jawaban,
            jawaban_dipilih: j ? j.jawaban_dipilih : null,
            benar: !!(j && j.jawaban_dipilih === s.kunci_jawaban)
          };
        });

        return { rekam, ujian, rincian, logs };
      }
      const r = await http(EP.rekamDetail.m, path(EP.rekamDetail.p, { id: idRekam }));
      return r.data || r;
    },

    async riwayatPeserta(idUser) {
      if (CFG.DEMO_MODE) {
        await sleep(90);
        return DB().filter('rekam_jejak', r => String(r.id_user) === String(idUser))
          .map(r => {
            const u = DB().find('ujian', x => x.id_ujian === r.id_ujian) || {};
            const logs = DB().filter('log_proctoring', l => l.id_rekam_jejak === r.id_rekam_jejak).length;
            return { ...r, judul_mata_kuliah: u.judul_mata_kurikulum || u.judul_mata_kuliah || '-', tanggal: u.tanggal, jumlah_pelanggaran: logs };
          })
          .sort((a, b) => String(b.waktu_mulai).localeCompare(String(a.waktu_mulai)));
      }
      return http('GET', `/peserta/${idUser}/riwayat`).then(r => r.data || r);
    },

    /* ---------------- PROCTORING ---------------- */
    async kirimLog(payload) {
      /* payload: { id_rekam_jejak, id_user, jenis_pelanggaran, keterangan, bukti_screenshot (dataURL) } */
      if (CFG.DEMO_MODE) {
        const bukti = simpanBukti(payload.bukti_screenshot);
        const row = {
          id_log: DB().nextId('log_proctoring', 'id_log'),
          id_rekam_jejak: Number(payload.id_rekam_jejak),
          id_user: Number(payload.id_user),
          timestamp: nowLocal(),
          jenis_pelanggaran: payload.jenis_pelanggaran,
          bukti_screenshot: bukti,
          keterangan: payload.keterangan || null,
          created_at: nowLocal()
        };
        DB().insert('log_proctoring', row);
        return { success: true, data: row };
      }
      return http(EP.logProctor.m, EP.logProctor.p, {
        id_rekam_jejak: payload.id_rekam_jejak,
        id_user: payload.id_user,
        jenis_pelanggaran: payload.jenis_pelanggaran,
        keterangan: payload.keterangan || null,
        bukti_screenshot_base64: payload.bukti_screenshot || null
      });
    },

    async listLogs(idRekam) {
      if (CFG.DEMO_MODE) {
        await sleep(70);
        return DB().filter('log_proctoring', l => String(l.id_rekam_jejak) === String(idRekam))
          .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
      }
      const r = await http(EP.logList.m, path(EP.logList.p, { id: idRekam }));
      return r.data || r;
    },

    /* ---------------- ADMIN: LAPORAN & STATISTIK ---------------- */
    async laporanProctoring(filter = {}) {
      if (CFG.DEMO_MODE) {
        await sleep(140);
        let rows = DB().all('log_proctoring').map(l => {
          const u = DB().find('pengguna', p => p.id_user === l.id_user) || {};
          const r = DB().find('rekam_jejak', x => x.id_rekam_jejak === l.id_rekam_jejak) || {};
          const uj = DB().find('ujian', x => x.id_ujian === r.id_ujian) || {};
          return {
            ...l,
            nama_lengkap: u.nama_lengkap || 'Tidak diketahui',
            username: u.username || '-',
            judul_mata_kuliah: uj.judul_mata_kuliah || '-'
          };
        });
        if (filter.jenis) rows = rows.filter(r => r.jenis_pelanggaran === filter.jenis);
        if (filter.id_user) rows = rows.filter(r => String(r.id_user) === String(filter.id_user));
        if (filter.id_ujian) {
          const ids = DB().filter('rekam_jejak', x => String(x.id_ujian) === String(filter.id_ujian))
            .map(x => x.id_rekam_jejak);
          rows = rows.filter(r => ids.includes(r.id_rekam_jejak));
        }
        if (filter.q) {
          const q = filter.q.toLowerCase();
          rows = rows.filter(r => r.nama_lengkap.toLowerCase().includes(q) || r.username.toLowerCase().includes(q));
        }
        rows.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
        return rows;
      }
      const qs = new URLSearchParams(filter).toString();
      const r = await http(EP.laporan.m, EP.laporan.p + (qs ? '?' + qs : ''));
      return r.data || r;
    },

    async statistik() {
      if (CFG.DEMO_MODE) {
        await sleep(120);
        const db = DB();
        const peserta = db.filter('pengguna', p => p.role === 'Peserta');
        const logs = db.all('log_proctoring');
        const rekam = db.all('rekam_jejak');
        const selesai = rekam.filter(r => r.status_pengerjaan === 'selesai');

        const perPeserta = peserta.map(p => {
          const logsP = logs.filter(l => l.id_user === p.id_user);
          return {
            id_user: p.id_user, nama_lengkap: p.nama_lengkap, username: p.username,
            total_pelanggaran: logsP.length,
            no_face: logsP.filter(l => l.jenis_pelanggaran === 'No Face').length,
            multiple_faces: logsP.filter(l => l.jenis_pelanggaran === 'Multiple Faces').length,
            looking_away: logsP.filter(l => l.jenis_pelanggaran === 'Looking Away').length,
            suspicious: logsP.filter(l => l.jenis_pelanggaran === 'Suspicious Activity').length,
            terakhir: logsP.length ? logsP.map(l => l.timestamp).sort().slice(-1)[0] : null
          };
        }).sort((a, b) => b.total_pelanggaran - a.total_pelanggaran);

        const perJenis = ['No Face', 'Multiple Faces', 'Looking Away', 'Suspicious Activity']
          .map(j => ({ jenis: j, jumlah: logs.filter(l => l.jenis_pelanggaran === j).length }))
          .sort((a, b) => b.jumlah - a.jumlah);

        const skor = selesai.map(r => Number(r.skor_akhir) || 0);

        return {
          total_pengguna: db.all('pengguna').length,
          total_peserta: peserta.length,
          total_admin: db.all('pengguna').filter(p => p.role === 'Admin').length,
          total_ujian: db.all('ujian').length,
          ujian_aktif: db.all('ujian').filter(u => u.status_aktif).length,
          total_soal: db.all('soal').length,
          total_pelanggaran: logs.length,
          total_rekam: rekam.length,
          total_selesai: selesai.length,
          total_diskualifikasi: rekam.filter(r => r.status_pengerjaan === 'diskualifikasi').length,
          rata_skor: skor.length ? Math.round((skor.reduce((a, b) => a + b, 0) / skor.length) * 100) / 100 : 0,
          per_jenis: perJenis,
          per_peserta: perPeserta,
          pelanggaran_terbaru: logs.map(l => {
            const u = db.find('pengguna', p => p.id_user === l.id_user) || {};
            return { ...l, nama_lengkap: u.nama_lengkap || '-' };
          }).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 6)
        };
      }
      const r = await http(EP.statistik.m, EP.statistik.p);
      return r.data || r;
    },

    /* ---------------- util ---------------- */
    resetDemo() {
      if (!CFG.DEMO_MODE) throw new Error('Reset hanya tersedia pada mode demo.');
      DB().reset();
      Session.clear();
    }
  };

  window.Api = Api;
})();
