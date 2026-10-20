/* ============================================================
   Admin — bank soal (CRUD per ujian)
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;

  const user = window.Layout.renderAdmin({ page: 'soal', title: 'Bank Soal', crumbs: 'Manajemen ujian' });
  if (!user) return;

  window.Layout.setTitle('Bank Soal');
  UI.$('#btnAdd').innerHTML = UI.icon('plus', 16) + ' Tambah soal';
  UI.$('#infoIco').innerHTML = UI.icon('alert', 18);

  let ujianList = [];
  let soal = [];
  let editing = null;
  let idUjian = UI.params('ujian');

  /* ---------------------------------------------------------- populate select */
  async function loadUjian() {
    ujianList = await Api.listUjian();
    const sel = UI.$('#fUjian');

    if (!ujianList.length) {
      sel.innerHTML = '<option value="">— belum ada ujian —</option>';
      UI.$('#btnAdd').disabled = true;
      return;
    }

    sel.innerHTML = ujianList.map(u =>
      `<option value="${u.id_ujian}">${UI.esc(u.judul_mata_kuliah)} · ${UI.tanggal(u.tanggal)}</option>`
    ).join('');

    if (!idUjian) idUjian = String(ujianList[0].id_ujian);
    sel.value = idUjian;

    const u = ujianList.find(x => String(x.id_ujian) === String(idUjian));
    if (u) {
      UI.$('#cardTitle').textContent = 'Soal — ' + u.judul_mata_kuliah;
      UI.$('#infoText').innerHTML = `<b>${UI.esc(u.judul_mata_kuliah)}</b>
        ${UI.tanggal(u.tanggal)} · ${UI.jam(u.waktu_mulai)}–${UI.jam(u.waktu_selesai)} · durasi ${UI.durasi(u.durasi_menit)}
        ${u.status_aktif ? '· <span class="badge badge-green">Aktif</span>' : '· <span class="badge">Nonaktif</span>'}`;
      UI.$('#infoBox').classList.remove('hidden');
    }
  }

  /* ---------------------------------------------------------- render */
  function render() {
    const q = UI.$('#fCari').value.trim().toLowerCase();
    let data = soal.slice();
    if (q) data = data.filter(s => String(s.teks_soal).toLowerCase().includes(q));

    const body = UI.$('#tbody');
    UI.$('#cardMeta').textContent = `${soal.length} soal`;

    if (!data.length) {
      body.innerHTML = UI.empty(5, soal.length
        ? 'Tidak ada soal yang cocok dengan pencarian.'
        : 'Belum ada soal untuk ujian ini. Klik "Tambah soal".');
      return;
    }

    body.innerHTML = data.map(s => {
      const teks = String(s.teks_soal || '').replace(/\s+/g, ' ').trim();
      const pendek = teks.length > 110 ? teks.slice(0, 110) + '…' : teks;
      const opsiTerisi = ['a', 'b', 'c', 'd', 'e'].filter(k => s['opsi_' + k]).length;

      return `<tr>
        <td class="num strong">${s.nomor_urut}</td>
        <td>
          <div class="small">${UI.esc(pendek)}</div>
          <div class="tiny muted">ID #${s.id_soal}</div>
        </td>
        <td><span class="badge">${opsiTerisi} opsi</span></td>
        <td class="center"><span class="badge badge-blue">${UI.esc(s.kunci_jawaban)}</span></td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-ghost" data-edit="${s.id_soal}" title="Edit">${UI.icon('edit', 15)}</button>
            <button class="btn btn-sm btn-ghost" data-del="${s.id_soal}" title="Hapus" style="color:var(--red-600)">${UI.icon('trash', 15)}</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ---------------------------------------------------------- muat soal */
  async function loadSoal(withKey) {
    try {
      soal = await Api.listSoal(idUjian, withKey !== false);
      render();
    } catch (err) {
      UI.$('#tbody').innerHTML = `<tr><td colspan="5"><div class="alert alert-danger" style="margin:16px">
        <span class="alert-ico">${UI.icon('alert', 18)}</span>
        <div><b>Gagal memuat soal</b>${UI.esc(err.message)}</div></div></td></tr>`;
    }
  }

  /* ---------------------------------------------------------- modal */
  function openForm(s) {
    editing = s || null;
    UI.$('#mTitle').textContent = s ? `Edit soal #${s.nomor_urut}` : 'Tambah soal';
    const u = ujianList.find(x => String(x.id_ujian) === String(idUjian));
    UI.$('#mSub').textContent = u ? u.judul_mata_kuliah : '';

    UI.$('#nomor').value = s ? s.nomor_urut : '';
    UI.$('#teks').value = s ? s.teks_soal : '';
    ['a', 'b', 'c', 'd', 'e'].forEach(k => {
      UI.$('#opsi_' + k).value = s ? (s['opsi_' + k] || '') : '';
    });
    UI.$('#kunci').value = s ? s.kunci_jawaban : 'A';

    UI.$$('#formSoal .field').forEach(f => f.classList.remove('has-error'));
    UI.openModal('soalModal');
  }

  /* ---------------------------------------------------------- simpan */
  UI.$('#btnSave').addEventListener('click', async () => {
    const payload = {
      id_ujian: Number(idUjian),
      nomor_urut: UI.$('#nomor').value ? Number(UI.$('#nomor').value) : null,
      teks_soal: UI.$('#teks').value.trim(),
      opsi_a: UI.$('#opsi_a').value.trim(),
      opsi_b: UI.$('#opsi_b').value.trim(),
      opsi_c: UI.$('#opsi_c').value.trim(),
      opsi_d: UI.$('#opsi_d').value.trim(),
      opsi_e: UI.$('#opsi_e').value.trim() || null,
      kunci_jawaban: UI.$('#kunci').value
    };

    let valid = true;
    UI.$('#fTeks').classList.toggle('has-error', !payload.teks_soal);
    if (!payload.teks_soal) valid = false;

    const opsiOk = ['opsi_a', 'opsi_b', 'opsi_c', 'opsi_d'].every(k => !!payload[k]);
    UI.$('#fOpsi').classList.toggle('has-error', !opsiOk);
    if (!opsiOk) valid = false;
    if (!valid) return;

    const btn = UI.$('#btnSave');
    UI.loading(btn, true);
    try {
      if (editing) {
        await Api.updateSoal(editing.id_soal, payload);
        UI.toast('Soal diperbarui.', 'ok');
      } else {
        await Api.createSoal(payload);
        UI.toast('Soal ditambahkan.', 'ok');
      }
      UI.closeModal('soalModal');
      await loadSoal();
      await loadUjian();
    } catch (err) {
      UI.toast('Gagal menyimpan: ' + err.message, 'err', 5000);
    } finally {
      UI.loading(btn, false);
    }
  });

  /* ---------------------------------------------------------- aksi */
  UI.$('#tbody').addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');

    if (ed) {
      const s = soal.find(x => String(x.id_soal) === ed.dataset.edit);
      if (s) openForm(s);
      return;
    }

    if (del) {
      const s = soal.find(x => String(x.id_soal) === del.dataset.del);
      if (!s) return;
      const ok = await UI.confirm({
        title: `Hapus soal nomor ${s.nomor_urut}?`,
        message: 'Soal akan dihapus dari bank soal ujian ini.',
        okText: 'Hapus',
        danger: true
      });
      if (!ok) return;
      try {
        await Api.deleteSoal(s.id_soal);
        UI.toast('Soal dihapus.', 'ok');
        await loadSoal();
        await loadUjian();
      } catch (err) {
        UI.toast('Gagal menghapus: ' + err.message, 'err', 5000);
      }
    }
  });

  /* ---------------------------------------------------------- filter */
  UI.$('#fUjian').addEventListener('change', async () => {
    idUjian = UI.$('#fUjian').value;
    const u = ujianList.find(x => String(x.id_ujian) === String(idUjian));
    if (u) {
      UI.$('#cardTitle').textContent = 'Soal — ' + u.judul_mata_kuliah;
      UI.$('#infoText').innerHTML = `<b>${UI.esc(u.judul_mata_kuliah)}</b>
        ${UI.tanggal(u.tanggal)} · ${UI.jam(u.waktu_mulai)}–${UI.jam(u.waktu_selesai)} · durasi ${UI.durasi(u.durasi_menit)}
        ${u.status_aktif ? '· <span class="badge badge-green">Aktif</span>' : '· <span class="badge">Nonaktif</span>'}`;
    }
    history.replaceState(null, '', 'soal.html?ujian=' + idUjian);
    await loadSoal();
  });

  UI.$('#fCari').addEventListener('input', UI.debounce(render, 200));
  UI.$('#btnAdd').addEventListener('click', () => openForm(null));

  UI.bindModals();

  /* ---------------------------------------------------------- boot */
  (async function boot() {
    try {
      await loadUjian();
      if (!ujianList.length) {
        UI.$('#tbody').innerHTML = UI.empty(5, 'Belum ada ujian. Buat ujian dulu di halaman Data Ujian.');
        return;
      }
      await loadSoal();
    } catch (err) {
      UI.toast('Gagal memuat: ' + err.message, 'err', 5000);
    }
  })();
})();
