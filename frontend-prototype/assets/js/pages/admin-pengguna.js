/* ============================================================
   Admin — kelola pengguna (CRUD)
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;

  const user = window.Layout.renderAdmin({ page: 'pengguna', title: 'Data Pengguna', crumbs: 'Manajemen akun' });
  if (!user) return;

  window.Layout.setTitle('Data Pengguna');
  UI.$('#btnAdd').innerHTML = UI.icon('plus', 16) + ' Tambah pengguna';

  let rows = [];
  let editing = null;

  /* ---------------------------------------------------------- render */
  function render() {
    const q = UI.$('#fCari').value.trim().toLowerCase();
    const role = UI.$('#fRole').value;

    let data = rows.slice();
    if (q) {
      data = data.filter(u =>
        String(u.nama_lengkap || '').toLowerCase().includes(q) ||
        String(u.username || '').toLowerCase().includes(q));
    }
    if (role) data = data.filter(u => u.role === role);

    data.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'Admin' ? -1 : 1;
      return String(a.nama_lengkap || '').localeCompare(String(b.nama_lengkap || ''));
    });

    const body = UI.$('#tbody');
    if (!data.length) {
      body.innerHTML = UI.empty(7, rows.length ? 'Tidak ada pengguna yang cocok.' : 'Belum ada pengguna.');
    } else {
      body.innerHTML = data.map((u, i) => {
        const isAdmin = u.role === 'Admin';
        const isMe = String(u.id_user) === String(user.id_user);
        return `<tr>
          <td class="num muted">${i + 1}</td>
          <td>
            <div class="flex items-center gap-8">
              <span class="avatar sm">${UI.inisial(u.nama_lengkap)}</span>
              <div>
                <div class="strong small">${UI.esc(u.nama_lengkap)}${isMe ? ' <span class="badge" style="font-size:10px">kamu</span>' : ''}</div>
                <div class="tiny muted">ID #${u.id_user}</div>
              </div>
            </div>
          </td>
          <td class="small mono">${UI.esc(u.username)}</td>
          <td class="small muted">${u.email ? UI.esc(u.email) : '—'}</td>
          <td>${isAdmin
            ? '<span class="badge badge-amber">Admin</span>'
            : '<span class="badge badge-blue">Peserta</span>'}</td>
          <td class="small muted">
            ${u.total_ujian != null ? `${u.total_ujian} ujian` : '—'}
            ${u.jumlah_pelanggaran ? ` · <span style="color:var(--amber-600)">${u.jumlah_pelanggaran} pelanggaran</span>` : ''}
          </td>
          <td>
            <div class="actions">
              <button class="btn btn-sm btn-ghost" data-edit="${u.id_user}" title="Edit">${UI.icon('edit', 15)}</button>
              <button class="btn btn-sm btn-ghost" data-del="${u.id_user}" title="Hapus" style="color:var(--red-600)"
                      ${isMe ? 'disabled title="Tidak bisa menghapus akun sendiri"' : ''}>${UI.icon('trash', 15)}</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    }

    /* statistik ringkas */
    UI.$('#stTotal').textContent = rows.length;
    UI.$('#stPeserta').textContent = rows.filter(u => u.role === 'Peserta').length;
    UI.$('#stAdmin').textContent = rows.filter(u => u.role === 'Admin').length;
    UI.$('#footNote').textContent = `${data.length} dari ${rows.length} akun ditampilkan.`;
  }

  /* ---------------------------------------------------------- muat */
  async function load() {
    try {
      rows = await Api.listPengguna();
      render();
    } catch (err) {
      UI.$('#tbody').innerHTML = `<tr><td colspan="7"><div class="alert alert-danger" style="margin:16px">
        <span class="alert-ico">${UI.icon('alert', 18)}</span>
        <div><b>Gagal memuat</b>${UI.esc(err.message)}</div></div></td></tr>`;
    }
  }

  /* ---------------------------------------------------------- modal */
  function openForm(u) {
    editing = u || null;
    UI.$('#mTitle').textContent = u ? 'Edit pengguna' : 'Tambah pengguna';
    UI.$('#mSub').textContent = u ? `Akun #${u.id_user} · ${u.username}` : 'Akun baru langsung dapat digunakan untuk login.';
    UI.$('#nama').value = u ? u.nama_lengkap : '';
    UI.$('#username').value = u ? u.username : '';
    UI.$('#pass').value = '';
    UI.$('#role').value = u ? u.role : 'Peserta';
    UI.$('#email').value = u ? (u.email || '') : '';
    UI.$('#passHint').textContent = u
      ? 'Kosongkan bila tidak ingin mengubah password.'
      : 'Minimal 6 karakter.';
    UI.$$('#formUser .field').forEach(f => f.classList.remove('has-error'));
    UI.openModal('userModal');
  }

  /* ---------------------------------------------------------- simpan */
  UI.$('#btnSave').addEventListener('click', async () => {
    const payload = {
      nama_lengkap: UI.$('#nama').value.trim(),
      username: UI.$('#username').value.trim(),
      password: UI.$('#pass').value,
      role: UI.$('#role').value,
      email: UI.$('#email').value.trim() || null
    };

    let valid = true;
    UI.$('#fNama').classList.toggle('has-error', !payload.nama_lengkap);
    if (!payload.nama_lengkap) valid = false;

    const userOk = payload.username.length >= 3;
    UI.$('#fUsername').classList.toggle('has-error', !userOk);
    if (!userOk) valid = false;

    const passRequired = !editing;
    const passOk = passRequired ? payload.password.length >= 6 : (!payload.password || payload.password.length >= 6);
    UI.$('#fPass').classList.toggle('has-error', !passOk);
    if (!passOk) valid = false;
    if (!valid) return;

    const btn = UI.$('#btnSave');
    UI.loading(btn, true);
    try {
      if (editing) {
        const patch = { nama_lengkap: payload.nama_lengkap, role: payload.role, email: payload.email, username: payload.username };
        if (payload.password) patch.password = payload.password;
        await Api.updatePengguna(editing.id_user, patch);
        UI.toast('Data pengguna diperbarui.', 'ok');
      } else {
        if (!payload.password) payload.password = 'demo123';
        await Api.createPengguna(payload);
        UI.toast('Pengguna baru ditambahkan.', 'ok');
      }
      UI.closeModal('userModal');
      await load();
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
      const u = rows.find(x => String(x.id_user) === ed.dataset.edit);
      if (u) openForm(u);
      return;
    }

    if (del && !del.disabled) {
      const u = rows.find(x => String(x.id_user) === del.dataset.del);
      if (!u) return;
      if (String(u.id_user) === String(user.id_user)) {
        UI.toast('Tidak bisa menghapus akun sendiri.', 'warn');
        return;
      }
      const ok = await UI.confirm({
        title: 'Hapus akun?',
        message: `Akun "${u.nama_lengkap}" (${u.username}) akan dihapus permanen.`,
        okText: 'Hapus akun',
        danger: true
      });
      if (!ok) return;
      try {
        await Api.deletePengguna(u.id_user);
        UI.toast('Akun dihapus.', 'ok');
        await load();
      } catch (err) {
        UI.toast('Gagal menghapus: ' + err.message, 'err', 5000);
      }
    }
  });

  /* ---------------------------------------------------------- filter */
  UI.$('#fCari').addEventListener('input', UI.debounce(render, 200));
  UI.$('#fRole').addEventListener('change', render);
  UI.$('#btnReset').addEventListener('click', () => {
    UI.$('#fCari').value = '';
    UI.$('#fRole').value = '';
    render();
  });

  UI.$('#btnAdd').addEventListener('click', () => openForm(null));

  UI.bindModals();
  load();
})();
