/* ============================================================
   Admin — kelola ujian (CRUD)
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;

  const user = window.Layout.renderAdmin({ page: 'ujian', title: 'Data Ujian', crumbs: 'Manajemen ujian' });
  if (!user) return;

  window.Layout.setTitle('Data Ujian');

  UI.$('#btnAdd').innerHTML = UI.icon('plus', 16) + ' Tambah ujian';

  let rows = [];
  let editing = null;

  /* ---------------------------------------------------------- render tabel */
  function badge(u) {
    return u.status_aktif
      ? '<span class="badge badge-green badge-dot">Aktif</span>'
      : '<span class="badge">Nonaktif</span>';
  }

  function render() {
    const q = UI.$('#fCari').value.trim().toLowerCase();
    const st = UI.$('#fStatus').value;

    let data = rows.slice();
    if (q) data = data.filter(u => u.judul_mata_kuliah.toLowerCase().includes(q));
    if (st !== '') data = data.filter(u => String(Number(!!u.status_aktif)) === st);

    const body = UI.$('#tbody');
    if (!data.length) {
      body.innerHTML = UI.empty(9, rows.length ? 'Tidak ada ujian yang cocok dengan filter.' : 'Belum ada ujian. Tambahkan ujian pertama.');
    } else {
      body.innerHTML = data.map((u, i) => `<tr>
        <td class="num muted">${i + 1}</td>
        <td>
          <div class="strong">${UI.esc(u.judul_mata_kuliah)}</div>
          <div class="tiny muted">ID #${u.id_ujian}</div>
        </td>
        <td class="small nowrap">${UI.tanggal(u.tanggal)}</td>
        <td class="small nowrap num">${UI.jam(u.waktu_mulai)}–${UI.jam(u.waktu_selesai)}</td>
        <td class="small nowrap">${UI.durasi(u.durasi_menit)}</td>
        <td class="right num">
          <a href="soal.html?ujian=${u.id_ujian}" title="Kelola soal">${u.jumlah_soal ?? 0}</a>
        </td>
        <td class="right num">${u.jumlah_peserta ?? 0}</td>
        <td>${badge(u)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-ghost" data-toggle="${u.id_ujian}" title="${u.status_aktif ? 'Tutup' : 'Buka'} ujian">
              ${UI.icon(u.status_aktif ? 'lock' : 'play', 15)}
            </button>
            <button class="btn btn-sm btn-ghost" data-edit="${u.id_ujian}" title="Edit">${UI.icon('edit', 15)}</button>
            <button class="btn btn-sm btn-ghost" data-del="${u.id_ujian}" title="Hapus" style="color:var(--red-600)">${UI.icon('trash', 15)}</button>
          </div>
        </td>
      </tr>`).join('');
    }

    UI.$('#footNote').textContent = `${data.length} dari ${rows.length} ujian ditampilkan.`;
  }

  /* ---------------------------------------------------------- muat */
  async function load() {
    try {
      rows = await Api.listUjian();
      render();
    } catch (err) {
      UI.$('#tbody').innerHTML = `<tr><td colspan="9"><div class="alert alert-danger" style="margin:16px">
        <span class="alert-ico">${UI.icon('alert', 18)}</span>
        <div><b>Gagal memuat</b>${UI.esc(err.message)}</div></div></td></tr>`;
    }
  }

  /* ---------------------------------------------------------- modal */
  function openForm(u) {
    editing = u || null;
    UI.$('#mTitle').textContent = u ? 'Edit ujian' : 'Tambah ujian';
    UI.$('#mSub').textContent = u ? `Mengubah data ujian #${u.id_ujian}` : 'Isi detail ujian di bawah ini.';
    UI.$('#judul').value = u ? u.judul_mata_kuliah : '';
    UI.$('#tanggal').value = u ? String(u.tanggal).slice(0, 10) : new Date().toISOString().slice(0, 10);
    UI.$('#mulai').value = u ? String(u.waktu_mulai).slice(0, 5) : '08:00';
    UI.$('#selesai').value = u ? String(u.waktu_selesai).slice(0, 5) : '09:00';
    UI.$('#durasi').value = u ? u.durasi_menit : 30;
    UI.$('#aktif').checked = u ? !!u.status_aktif : false;
    UI.$$('#formUjian .field').forEach(f => f.classList.remove('has-error'));
    UI.openModal('formModal');
  }

  /* ---------------------------------------------------------- simpan */
  UI.$('#btnSave').addEventListener('click', async () => {
    const payload = {
      judul_mata_kuliah: UI.$('#judul').value.trim(),
      tanggal: UI.$('#tanggal').value,
      waktu_mulai: UI.$('#mulai').value || '08:00',
      waktu_selesai: UI.$('#selesai').value || '09:00',
      durasi_menit: Number(UI.$('#durasi').value),
      status_aktif: UI.$('#aktif').checked
    };

    let valid = true;
    UI.$('#fJudul').classList.toggle('has-error', !payload.judul_mata_kuliah);
    if (!payload.judul_mata_kuliah) valid = false;
    UI.$('#fTanggal').classList.toggle('has-error', !payload.tanggal);
    if (!payload.tanggal) valid = false;
    const durasiOk = payload.durasi_menit >= 1 && payload.durasi_menit <= 300;
    UI.$('#fDurasi').classList.toggle('has-error', !durasiOk);
    if (!durasiOk) valid = false;
    if (!valid) return;

    const btn = UI.$('#btnSave');
    UI.loading(btn, true);
    try {
      if (editing) {
        await Api.updateUjian(editing.id_ujian, payload);
        UI.toast('Ujian diperbarui.', 'ok');
      } else {
        await Api.createUjian(payload);
        UI.toast('Ujian baru ditambahkan.', 'ok');
      }
      UI.closeModal('formModal');
      await load();
    } catch (err) {
      UI.toast('Gagal menyimpan: ' + err.message, 'err', 5000);
    } finally {
      UI.loading(btn, false);
    }
  });

  /* ---------------------------------------------------------- aksi tabel */
  UI.$('#tbody').addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    const tg = e.target.closest('[data-toggle]');

    if (ed) {
      const u = rows.find(x => String(x.id_ujian) === ed.dataset.edit);
      if (u) openForm(u);
      return;
    }

    if (tg) {
      const u = rows.find(x => String(x.id_ujian) === tg.dataset.toggle);
      if (!u) return;
      try {
        await Api.updateUjian(u.id_ujian, { ...u, status_aktif: !u.status_aktif });
        UI.toast(u.status_aktif ? 'Ujian ditutup.' : 'Ujian dibuka untuk peserta.', 'ok');
        await load();
      } catch (err) {
        UI.toast('Gagal mengubah status: ' + err.message, 'err', 5000);
      }
      return;
    }

    if (del) {
      const u = rows.find(x => String(x.id_ujian) === del.dataset.del);
      if (!u) return;
      const ok = await UI.confirm({
        title: 'Hapus ujian?',
        message: `"${u.judul_mata_kuliah}" beserta ${u.jumlah_soal || 0} soal dan riwayat pengerjaannya akan dihapus permanen.`,
        okText: 'Hapus permanen',
        danger: true
      });
      if (!ok) return;
      try {
        await Api.deleteUjian(u.id_ujian);
        UI.toast('Ujian dihapus.', 'ok');
        await load();
      } catch (err) {
        UI.toast('Gagal menghapus: ' + err.message, 'err', 5000);
      }
    }
  });

  /* ---------------------------------------------------------- filter */
  UI.$('#fCari').addEventListener('input', UI.debounce(render, 200));
  UI.$('#fStatus').addEventListener('change', render);
  UI.$('#btnReset').addEventListener('click', () => {
    UI.$('#fCari').value = '';
    UI.$('#fStatus').value = '';
    render();
  });

  UI.$('#btnAdd').addEventListener('click', () => openForm(null));

  UI.bindModals();
  load();
})();
