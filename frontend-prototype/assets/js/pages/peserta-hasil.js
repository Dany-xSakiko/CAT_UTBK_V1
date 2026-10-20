/* ============================================================
   Halaman hasil ujian peserta
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;

  const user = window.Layout.renderPeserta({ page: 'hasil' });
  if (!user) return;

  window.Layout.setTitle('Hasil Ujian');

  UI.$('#btnBack').innerHTML = UI.icon('arrowLeft', 15) + ' Kembali ke dashboard';

  const idRekam = UI.params('rekam');
  if (!idRekam) {
    location.replace('dashboard.html');
    return;
  }

  /* ---------------------------------------------------------- score ring */
  function ring(skor) {
    const r = 66, c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, Number(skor) || 0));
    const dash = (pct / 100) * c;
    const color = pct >= 75 ? 'var(--green-600)' : pct >= 50 ? 'var(--amber-600)' : 'var(--red-600)';

    return `
      <svg width="148" height="148" viewBox="0 0 148 148">
        <circle cx="74" cy="74" r="${r}" fill="none" stroke="#eef1f5" stroke-width="12"/>
        <circle cx="74" cy="74" r="${r}" fill="none" stroke="${color}" stroke-width="12"
                stroke-linecap="round" stroke-dasharray="${dash} ${c - dash}"
                style="transition:stroke-dasharray .6s ease"/>
      </svg>
      <div class="val">
        <div>
          <b style="color:${color}">${pct.toFixed(1)}</b>
          <span>skor</span>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------- muat */
  async function load() {
    let data;
    try {
      data = await Api.getHasil(idRekam);
    } catch (err) {
      UI.$('#resultTitle').textContent = 'Data tidak ditemukan';
      UI.$('#resultSub').textContent = err.message;
      return;
    }

    const { rekam, ujian, rincian, logs } = data;

    if (String(rekam.id_user) !== String(user.id_user) && user.role !== 'Admin') {
      UI.$('#resultTitle').textContent = 'Akses ditolak';
      UI.$('#resultSub').textContent = 'Hasil ini milik peserta lain.';
      return;
    }

    const skor = Number(rekam.skor_akhir) || 0;
    const dq = rekam.status_pengerjaan === 'diskualifikasi';
    const benar = rincian.filter(r => r.benar).length;
    const total = rincian.length;

    /* ---- hero ---- */
    UI.$('#scoreRing').innerHTML = ring(skor);
    UI.$('#scoreCaption').textContent = dq ? 'Ujian dihentikan' : 'Skor akhir';
    UI.$('#resultTitle').textContent = ujian ? ujian.judul_mata_kuliah : 'Hasil ujian';
    UI.$('#resultSub').innerHTML = dq
      ? '<span class="badge badge-red">Diskualifikasi</span> Ujian dihentikan karena pelanggaran melebihi batas.'
      : `Dikerjakan ${UI.tanggalPanjang(String(rekam.waktu_mulai).slice(0, 10))} · ${UI.jam(rekam.waktu_mulai)}–${rekam.waktu_selesai ? UI.jam(rekam.waktu_selesai) : '—'}`;

    UI.$('#rTotal').textContent = total;
    UI.$('#rBenar').textContent = benar;
    UI.$('#rSalah').textContent = total - benar;

    if (rekam.waktu_mulai && rekam.waktu_selesai) {
      const a = new Date(String(rekam.waktu_mulai).replace(' ', 'T')).getTime();
      const b = new Date(String(rekam.waktu_selesai).replace(' ', 'T')).getTime();
      const menit = Math.max(0, Math.round((b - a) / 60000));
      UI.$('#rDurasi').textContent = menit + ' menit';
    } else {
      UI.$('#rDurasi').textContent = '—';
    }

    UI.$('#headMeta').textContent = `Attempt #${rekam.id_rekam_jejak}`;

    /* ---- rincian ---- */
    const body = UI.$('#rincianBody');
    if (!rincian.length) {
      body.innerHTML = UI.empty(5, 'Tidak ada rincian soal.');
    } else {
      body.innerHTML = rincian.map(r => {
        const kosong = !r.jawaban_dipilih;
        const badge = r.benar
          ? '<span class="badge badge-green">Benar</span>'
          : kosong
            ? '<span class="badge">Kosong</span>'
            : '<span class="badge badge-red">Salah</span>';

        const teks = String(r.teks_soal || '').replace(/\s+/g, ' ').trim();
        const pendek = teks.length > 96 ? teks.slice(0, 96) + '…' : teks;

        return `<tr>
          <td class="num strong">${r.nomor_urut}</td>
          <td class="small">${UI.esc(pendek)}</td>
          <td class="center"><b>${r.jawaban_dipilih || '—'}</b></td>
          <td class="center" style="color:var(--green-600);font-weight:600">${r.kunci_jawaban || '—'}</td>
          <td>${badge}</td>
        </tr>`;
      }).join('');
    }
    UI.$('#rincianMeta').textContent = `${benar}/${total} benar`;

    /* ---- pelanggaran ---- */
    const badge = UI.$('#vioBadge');
    badge.textContent = logs.length;
    badge.className = 'badge ' + (logs.length === 0 ? 'badge-green' : logs.length > 3 ? 'badge-red' : 'badge-amber');

    const tl = UI.$('#vioTimeline');
    if (!logs.length) {
      tl.innerHTML = '<div class="muted small">Tidak ada pelanggaran tercatat. 🎉</div>';
    } else {
      const urut = logs.slice().sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
      tl.className = 'timeline';
      tl.innerHTML = urut.map(l => `
        <div class="tl-item ${l.jenis_pelanggaran === 'Suspicious Activity' || l.jenis_pelanggaran === 'Multiple Faces' ? 'bad' : ''}">
          <div class="tl-head">${UI.esc(l.jenis_pelanggaran)}</div>
          <div class="tl-meta">${UI.jamDetik(l.timestamp)} · ${UI.esc(l.keterangan || '—')}</div>
        </div>`).join('');
    }
  }

  load();
})();
