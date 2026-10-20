/* ============================================================
   Halaman login
   ============================================================ */
(function () {
  'use strict';

  const CFG = window.CAT_CONFIG;
  const $ = (s) => document.querySelector(s);

  let role = 'Peserta';

  /* sudah login? langsung arahkan */
  const sesi = window.Api.me();
  if (sesi) {
    location.replace(sesi.role === 'Admin' ? 'admin/dashboard.html' : 'peserta/dashboard.html');
    return;
  }

  /* ---------------------------------------------------------- role switch */
  document.querySelectorAll('#roleSwitch button').forEach(btn => {
    btn.addEventListener('click', () => {
      role = btn.dataset.role;
      document.querySelectorAll('#roleSwitch button').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      $('#username').placeholder = role === 'Admin' ? 'contoh: admin' : 'contoh: peserta_001';
      const box = $('#demoBox');
      if (box) {
        box.innerHTML = role === 'Admin'
          ? '<b>Akun demo admin</b> — <code>admin</code> · password: <code>demo123</code>'
          : '<b>Akun demo peserta</b> — <code>peserta_001</code> s.d. <code>peserta_006</code> · password: <code>demo123</code>';
      }
      $('#username').focus();
    });
  });

  /* ---------------------------------------------------------- toggle password */
  $('#togglePass').addEventListener('click', () => {
    const p = $('#password');
    const show = p.type === 'password';
    p.type = show ? 'text' : 'password';
    $('#togglePass').setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    $('#togglePass').innerHTML = window.UI.icon(show ? 'eyeOff' : 'eye', 17);
  });

  /* ---------------------------------------------------------- error helper */
  function setError(fieldId, on, msg) {
    const f = document.getElementById(fieldId);
    if (!f) return;
    f.classList.toggle('has-error', !!on);
    if (msg) {
      const e = f.querySelector('.form-error');
      if (e) e.textContent = msg;
    }
  }

  function showAlert(msg) {
    const a = $('#loginAlert');
    $('#loginAlertMsg').textContent = msg;
    a.classList.remove('hidden');
  }

  function hideAlert() {
    $('#loginAlert').classList.add('hidden');
  }

  /* ---------------------------------------------------------- submit */
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = $('#username').value.trim();
    const password = $('#password').value;
    let valid = true;

    setError('fUser', false);
    setError('fPass', false);

    if (!username) { setError('fUser', true, 'Username wajib diisi.'); valid = false; }
    if (!password) { setError('fPass', true, 'Password wajib diisi.'); valid = false; }
    if (!valid) return;

    const btn = $('#btnLogin');
    btn.disabled = true;
    btn.innerHTML = 'Memeriksa akun…';

    try {
      const res = await window.Api.login(username, password);
      const user = res.user;

      if (user.role !== role) {
        window.Api.logout();
        showAlert(`Akun ini terdaftar sebagai ${user.role}. Pilih tab ${user.role} untuk masuk.`);
        return;
      }

      const next = new URLSearchParams(location.search).get('next');
      const home = user.role === 'Admin' ? 'admin/dashboard.html' : 'peserta/dashboard.html';
      location.replace(next && /^[\w\-.]+\.html$/.test(next)
        ? (user.role === 'Admin' ? 'admin/' : 'peserta/') + next
        : home);
    } catch (err) {
      showAlert(err.message || 'Tidak dapat masuk. Coba lagi.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Masuk';
    }
  });

  /* ---------------------------------------------------------- prefill demo */
  const params = new URLSearchParams(location.search);
  if (params.get('u')) $('#username').value = params.get('u');
  setTimeout(() => $('#username').focus(), 120);
})();
