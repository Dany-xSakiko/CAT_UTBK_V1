/* ============================================================
   Dashboard peserta
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;

  const user = window.Layout.renderPeserta({ page: 'dashboard' });
  if (!user) return;

  window.Layout.setTitle('Dashboard Peserta');

  /* ---------------------------------------------------------- ikon statis */
  UI.$('#icAktif').innerHTML = UI.icon('exam', 17);
  UI.$('#icSelesai').innerHTML = UI.icon('check', 17);
  UI.$('#icRata').innerHTML = UI.icon('chart', 17);
  UI.$('#icLanggar').innerHTML = UI.icon('shield', 17);
  UI.$('#icInfo').innerHTML = UI.icon('alert', 18);
  UI.$('#btnRefresh').innerHTML = UI.icon('refresh', 15) + ' Muat ulang';

  UI.$('#welcomeTitle').textContent = 'Halo, ' + String(user.nama_lengkap).split(' ')[0] + '!';
  UI.$('#todayPill').innerHTML = UI.icon('calendar', 13) + ' ' + UI.tanggalPanjang(new Date().toISOString().slice(0, 10));

  /* ---------------------------------------------------------- render kartu ujian */
  function statusOf(ujian, rekam) {
    if (rekam && rekam.status_pengerjaan === 'selesai') return { key: 'selesai', label: 'Selesai', cls: 'badge-green' };
    if (rekam && rekam.status_pengerjaan === 'diskualifikasi') return { key: 'dq', label: 'Diskualifikasi', cls: 'badge-red' };
    if (rekam && rekam.status_pengerjaan === 'sedang_mengerjakan') return { key: 'jalan', label: 'Sedang dikerjakan', cls: 'badge-amber' };
    if (ujian.status_aktif) return { key: 'buka', label: 'Dibuka', cls: 'badge-blue' };
    return { key: 'tutup', label: 'Belum dibuka', cls: '' };
  }

  function examCard(ujian, rekam) {
    const st = statusOf(ujian, rekam);
    const aktif = st.key === 'buka' || st.key === 'jalan';

    let btn;
    if (st.key === 'selesai' || st.key === 'dq') {
      btn = `<a class="btn btn-sm" href="hasil.html?rekam=${rekam.id_rekam_jejak}">${UI.icon('eye', 15)} Lihat hasil</a>`;
    } else if (st.key === 'jalan') {
      btn = `<a class="btn btn-primary btn-sm" href="ujian.html?id=${ujian.id_ujian}">${UI.icon('play', 14)} Lanjutkan</a>`;
    } else if (st.key === 'buka') {
      btn = `<a class="btn btn-primary btn-sm" href="ujian.html?id=${ujian.id_ujian}">${UI.icon('play', 14)} Mulai ujian</a>`;
    } else {
      btn = `<button class="btn btn-sm" disabled>Belum dibuka</button>`;
    }

    return `
      <article class="exam-card ${aktif ? 'is-active' : ''}">
        <div class="top">
          <h3>${UI.esc(ujian.judul_mata_kuliah)}</h3>
          <span class="badge ${st.cls} badge-dot">${st.label}</span>
        </div>
        <div class="exam-meta">
          <div class="row">${UI.icon('calendar', 15)} ${UI.tanggal(ujian.tanggal)}</div>
          <div class="row">${UI.icon('clock', 15)} ${UI.jam(ujian.waktu_mulai)}–${UI.jam(ujian.waktu_selesai)} · ${UI.durasi(ujian.durasi_menit)}</div>
          <div class="row">${UI.icon('question', 15)} ${ujian.jumlah_soal} soal pilihan ganda</div>
        </div>
        ${rekam && rekam.skor_akhir != null
          ? `<div class="small" style="color:var(--green-600);font-weight:600">Skor akhir: ${Number(rekam.skor_akhir).toFixed(2)}</div>`
          : ''}
        <div class="flex gap-8" style="margin-top:auto">${btn}</div>
      </article>`;
  }

  /* ---------------------------------------------------------- render riwayat */
  function riwayatRow(r) {
    const st = r.status_pengerjaan === 'selesai'
      ? '<span class="badge badge-green">Selesai</span>'
      : r.status_pengerjaan === 'diskualifikasi'
        ? '<span class="badge badge-red">Diskualifikasi</span>'
        : '<span class="badge badge-amber">Berjalan</span>';

    const langgar = Number(r.jumlah_pelanggaran) || 0;
    const langgarHtml = langgar === 0
      ? '<span class="muted small">0</span>'
      : `<span class="badge ${langgar > 3 ? 'badge-red' : 'badge-amber'}">${langgar}</span>`;

    return `<tr>
      <td class="strong">${UI.esc(r.judul_mata_kuliah)}</td>
      <td class="small">${UI.tanggal(r.tanggal || r.waktu_mulai)}</td>
      <td class="small num">${UI.jam(r.waktu_mulai)}</td>
      <td class="small num">${r.waktu_selesai ? UI.jam(r.waktu_selesai) : '—'}</td>
      <td class="right strong num">${r.skor_akhir != null ? Number(r.skor_akhir).toFixed(2) : '—'}</td>
      <td class="right">${langgarHtml}</td>
      <td>${st}</td>
      <td class="right">
        <a class="btn btn-sm btn-ghost" href="hasil.html?rekam=${r.id_rekam_jejak}">${UI.icon('eye', 15)}</a>
      </td>
    </tr>`;
  }

  /* ---------------------------------------------------------- muat data */
  async function load() {
    const host = UI.$('#examList');
    try {
      const [ujianList, riwayat] = await Promise.all([
        Api.listUjian(),
        Api.riwayatPeserta(user.id_user)
      ]);

      /* peta rekam per ujian */
      const byUjian = {};
      riwayat.forEach(r => {
        const cur = byUjian[r.id_ujian];
        /* utamakan yang sedang dikerjakan / terbaru */
        if (!cur || String(r.waktu_mulai) > String(cur.waktu_mulai)) byUjian[r.id_ujian] = r;
      });

      /* ---- kartu ujian ---- */
      const relevan = ujianList.filter(u => u.status_aktif || byUjian[u.id_ujian]);
      if (!relevan.length) {
        host.innerHTML = `<div class="card card-pad center muted small">
          Belum ada ujian yang dibuka. Hubungi panitia bila menurutmu ini keliru.</div>`;
      } else {
        /* ujian aktif lebih dulu */
        relevan.sort((a, b) => Number(!!b.status_aktif) - Number(!!a.status_aktif));
        host.innerHTML = `<div class="exam-grid">${relevan.map(u => examCard(u, byUjian[u.id_ujian])).join('')}</div>`;
      }

      /* ---- statistik ---- */
      const selesai = riwayat.filter(r => r.status_pengerjaan === 'selesai');
      const skor = selesai.map(r => Number(r.skor_akhir) || 0);
      UI.$('#stAktif').textContent = ujianList.filter(u => u.status_aktif).length;
      UI.$('#stSelesai').textContent = selesai.length;
      UI.$('#stRata').textContent = skor.length
        ? (skor.reduce((a, b) => a + b, 0) / skor.length).toFixed(1)
        : '—';
      const totalLanggar = riwayat.reduce((a, r) => a + (Number(r.jumlah_pelanggaran) || 0), 0);
      UI.$('#stLanggar').textContent = totalLanggar;
      UI.$('#stLanggarSub').textContent = totalLanggar === 0 ? 'tidak ada catatan' : 'perlu diperhatikan';
      if (totalLanggar > 3) UI.$('#stLanggar').style.color = 'var(--red-600)';

      /* ---- riwayat ---- */
      const body = UI.$('#riwayatBody');
      if (!riwayat.length) {
        body.innerHTML = UI.empty(8, 'Belum ada riwayat ujian.');
      } else {
        body.innerHTML = riwayat.map(riwayatRow).join('');
      }
      UI.$('#riwayatCount').textContent = riwayat.length ? `${riwayat.length} entri` : '';
    } catch (err) {
      host.innerHTML = `<div class="alert alert-danger">
        <span class="alert-ico">${UI.icon('alert', 18)}</span>
        <div><b>Gagal memuat data</b>${UI.esc(err.message)}</div></div>`;
    }
  }

  UI.$('#btnRefresh').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    UI.loading(b, true, 'Memuat…');
    await load();
    UI.loading(b, false);
    UI.toast('Data diperbarui', 'ok', 1800);
  });

  load();
})();
