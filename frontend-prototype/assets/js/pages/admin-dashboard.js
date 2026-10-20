/* ============================================================
   Dashboard admin
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;

  const user = window.Layout.renderAdmin({ page: 'dashboard', title: 'Dashboard', crumbs: 'Ringkasan sistem' });
  if (!user) return;

  window.Layout.setTitle('Dashboard Admin');

  UI.$('#icPeserta').innerHTML = UI.icon('users', 17);
  UI.$('#icUjian').innerHTML = UI.icon('exam', 17);
  UI.$('#icVio').innerHTML = UI.icon('shield', 17);
  UI.$('#icSkor').innerHTML = UI.icon('chart', 17);
  UI.$('#btnKelola').innerHTML = UI.icon('arrowRight', 15) + ' Kelola ujian';

  const JENIS_WARNA = {
    'No Face': 'blue',
    'Multiple Faces': 'red',
    'Looking Away': 'amber',
    'Suspicious Activity': 'red'
  };

  async function load() {
    try {
      const [stat, ujian, logs] = await Promise.all([
        Api.statistik(),
        Api.listUjian(),
        Api.laporanProctoring({})
      ]);

      /* ---- statistik ---- */
      UI.$('#stPeserta').textContent = stat.total_peserta;
      UI.$('#stPesertaSub').textContent = `${stat.total_admin} admin · ${stat.total_pengguna} akun`;
      UI.$('#stUjian').textContent = stat.ujian_aktif;
      UI.$('#stUjianSub').textContent = `dari ${stat.total_ujian} ujian · ${stat.total_soal} soal`;
      UI.$('#stVio').textContent = stat.total_pelanggaran;
      UI.$('#stVioSub').textContent = `${stat.total_rekam} attempt · ${stat.total_selesai} selesai`;
      UI.$('#stSkor').textContent = stat.rata_skor ? stat.rata_skor.toFixed(1) : '—';
      UI.$('#stSkorSub').textContent = stat.total_diskualifikasi
        ? `${stat.total_diskualifikasi} diskualifikasi`
        : 'tidak ada diskualifikasi';

      /* ---- pelanggaran terbaru ---- */
      const body = UI.$('#recentBody');
      if (!logs.length) {
        body.innerHTML = UI.empty(4, 'Belum ada pelanggaran tercatat.');
      } else {
        body.innerHTML = logs.slice(0, 7).map(l => `<tr>
          <td>
            <div class="strong small">${UI.esc(l.nama_lengkap)}</div>
            <div class="tiny muted">${UI.esc(l.username)}</div>
          </td>
          <td><span class="badge badge-${JENIS_WARNA[l.jenis_pelanggaran] || ''}">${UI.esc(l.jenis_pelanggaran)}</span></td>
          <td class="small">${UI.esc(l.judul_mata_kuliah || '—')}</td>
          <td class="small muted nowrap">${UI.jamDetik(l.timestamp)}<br>${UI.tanggal(l.timestamp)}</td>
        </tr>`).join('');
      }

      /* ---- distribusi jenis ---- */
      const total = stat.total_pelanggaran || 1;
      const dist = UI.$('#distBody');
      if (!stat.per_jenis.length) {
        dist.innerHTML = '<div class="muted small">Belum ada data.</div>';
      } else {
        dist.innerHTML = stat.per_jenis.map(j => {
          const pct = Math.round((j.jumlah / total) * 100);
          const cls = JENIS_WARNA[j.jenis] === 'red' ? 'high' : JENIS_WARNA[j.jenis] === 'amber' ? 'mid' : '';
          return `<div style="margin-bottom:14px">
            <div class="between" style="margin-bottom:5px">
              <span class="small strong">${UI.esc(j.jenis)}</span>
              <span class="small muted num">${j.jumlah} · ${pct}%</span>
            </div>
            <div class="sev-bar ${cls}"><i style="width:${Math.max(3, pct)}%"></i></div>
          </div>`;
        }).join('') + `<div class="tiny muted" style="margin-top:4px">Total ${stat.total_pelanggaran} kejadian dari ${stat.total_rekam} attempt.</div>`;
      }

      /* ---- daftar ujian ---- */
      const ub = UI.$('#ujianBody');
      if (!ujian.length) {
        ub.innerHTML = UI.empty(6, 'Belum ada ujian.');
      } else {
        ub.innerHTML = ujian.slice(0, 6).map(u => `<tr>
          <td class="strong small">${UI.esc(u.judul_mata_kuliah)}</td>
          <td class="small">${UI.tanggal(u.tanggal)}</td>
          <td class="small">${UI.durasi(u.durasi_menit)}</td>
          <td class="right num">${u.jumlah_soal ?? '—'}</td>
          <td class="right num">${u.jumlah_peserta ?? '—'}</td>
          <td>${u.status_aktif
            ? '<span class="badge badge-green badge-dot">Aktif</span>'
            : '<span class="badge">Nonaktif</span>'}</td>
        </tr>`).join('');
      }
    } catch (err) {
      UI.toast('Gagal memuat dashboard: ' + err.message, 'err', 5000);
    }
  }

  load();
})();
