/* ============================================================
   Admin — laporan proctoring
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;

  const user = window.Layout.renderAdmin({ page: 'laporan', title: 'Laporan Proctoring', crumbs: 'Integritas ujian' });
  if (!user) return;

  window.Layout.setTitle('Laporan Proctoring');
  UI.$('#btnExport').innerHTML = UI.icon('download', 16) + ' Ekspor CSV';

  const WARNA = {
    'No Face': 'blue',
    'Multiple Faces': 'red',
    'Looking Away': 'amber',
    'Suspicious Activity': 'red'
  };

  let all = [];
  let filtered = [];

  /* ---------------------------------------------------------- muat */
  async function load() {
    try {
      const [logs, ujian] = await Promise.all([
        Api.laporanProctoring({}),
        Api.listUjian()
      ]);

      all = logs;

      const sel = UI.$('#fUjian');
      sel.innerHTML = '<option value="">Semua ujian</option>' + ujian.map(u =>
        `<option value="${u.id_ujian}">${UI.esc(u.judul_mata_kuliah)}</option>`
      ).join('');

      apply();
    } catch (err) {
      UI.$('#tbody').innerHTML = `<tr><td colspan="6"><div class="alert alert-danger" style="margin:16px">
        <span class="alert-ico">${UI.icon('alert', 18)}</span>
        <div><b>Gagal memuat laporan</b>${UI.esc(err.message)}</div></div></td></tr>`;
    }
  }

  /* ---------------------------------------------------------- filter + render */
  function apply() {
    const q = UI.$('#fCari').value.trim().toLowerCase();
    const jenis = UI.$('#fJenis').value;
    const idUjian = UI.$('#fUjian').value;

    filtered = all.slice();
    if (q) {
      filtered = filtered.filter(l =>
        String(l.nama_lengkap || '').toLowerCase().includes(q) ||
        String(l.username || '').toLowerCase().includes(q));
    }
    if (jenis) filtered = filtered.filter(l => l.jenis_pelanggaran === jenis);
    if (idUjian) filtered = filtered.filter(l => String(l.id_ujian) === String(idUjian));

    render();
  }

  function render() {
    const body = UI.$('#tbody');

    /* ringkasan */
    UI.$('#stTotal').textContent = filtered.length;
    const peserta = new Set(filtered.map(l => l.id_user));
    UI.$('#stPeserta').textContent = peserta.size;

    if (filtered.length) {
      const count = {};
      filtered.forEach(l => { count[l.jenis_pelanggaran] = (count[l.jenis_pelanggaran] || 0) + 1; });
      const top = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
      UI.$('#stDominan').textContent = `${top} (${count[top]})`;
    } else {
      UI.$('#stDominan').textContent = '—';
    }

    if (!filtered.length) {
      body.innerHTML = UI.empty(6, all.length ? 'Tidak ada pelanggaran yang cocok dengan filter.' : 'Belum ada pelanggaran tercatat.');
      UI.$('#footNote').textContent = '';
      return;
    }

    body.innerHTML = filtered.map(l => `<tr>
      <td class="small nowrap">
        <div class="num">${UI.jamDetik(l.timestamp)}</div>
        <div class="tiny muted">${UI.tanggal(l.timestamp)}</div>
      </td>
      <td>
        <div class="strong small">${UI.esc(l.nama_lengkap)}</div>
        <div class="tiny muted">${UI.esc(l.username)}</div>
      </td>
      <td><span class="badge badge-${WARNA[l.jenis_pelanggaran] || ''}">${UI.esc(l.jenis_pelanggaran)}</span></td>
      <td class="small">${UI.esc(l.judul_mata_kuliah || '—')}</td>
      <td class="small muted">${UI.esc(l.keterangan || '—')}</td>
      <td class="center">
        ${l.bukti_screenshot
          ? `<button class="btn btn-sm btn-ghost" data-img="${l.id_log}" title="Lihat bukti">${UI.icon('eye', 15)}</button>`
          : '<span class="tiny muted">—</span>'}
      </td>
    </tr>`).join('');

    UI.$('#footNote').textContent = `${filtered.length} dari ${all.length} kejadian ditampilkan.`;
  }

  /* ---------------------------------------------------------- modal bukti */
  UI.$('#tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-img]');
    if (!btn) return;
    const log = filtered.find(l => String(l.id_log) === btn.dataset.img);
    if (!log || !log.bukti_screenshot) return;

    UI.$('#bTitle').textContent = log.jenis_pelanggaran;
    UI.$('#bSub').textContent = `${log.nama_lengkap} · ${UI.jamDetik(log.timestamp)} · ${UI.tanggal(log.timestamp)}`;
    UI.$('#bBody').innerHTML =
      `<img src="${UI.esc(log.bukti_screenshot)}" alt="Bukti proctoring"
            style="max-width:100%;border-radius:10px;border:1px solid var(--border)"
            onerror="this.outerHTML='<div class=&quot;empty-note&quot;>Bukti gambar tidak tersedia.</div>'">`;
    UI.openModal('buktiModal');
  });

  /* ---------------------------------------------------------- ekspor CSV */
  UI.$('#btnExport').addEventListener('click', () => {
    if (!filtered.length) {
      UI.toast('Tidak ada data untuk diekspor.', 'warn');
      return;
    }

    const head = ['waktu', 'nama_lengkap', 'username', 'jenis_pelanggaran', 'ujian', 'keterangan'];
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;

    const lines = [head.join(',')].concat(filtered.map(l => [
      l.timestamp, l.nama_lengkap, l.username,
      l.jenis_pelanggaran, l.judul_mata_kuliah, l.keterangan
    ].map(esc).join(',')));

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-proctoring-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    UI.toast(`${filtered.length} baris diekspor.`, 'ok');
  });

  /* ---------------------------------------------------------- filter events */
  UI.$('#fCari').addEventListener('input', UI.debounce(apply, 200));
  UI.$('#fJenis').addEventListener('change', apply);
  UI.$('#fUjian').addEventListener('change', apply);
  UI.$('#btnReset').addEventListener('click', () => {
    UI.$('#fCari').value = '';
    UI.$('#fJenis').value = '';
    UI.$('#fUjian').value = '';
    apply();
  });

  UI.bindModals();
  load();
})();
