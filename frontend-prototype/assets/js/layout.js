/* ============================================================
   Layout — sidebar, topbar, guard peran
   ============================================================ */
(function () {
  'use strict';

  const CFG = window.CAT_CONFIG;
  const I = (n, s = 18) => window.UI.icon(n, s);

  const NAV_ADMIN = [
    { group: 'Ringkasan' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'dashboard.html' },
    { group: 'Manajemen Ujian' },
    { id: 'ujian', label: 'Data Ujian', icon: 'exam', href: 'ujian.html' },
    { id: 'soal', label: 'Bank Soal', icon: 'question', href: 'soal.html' },
    { group: 'Integritas' },
    { id: 'laporan', label: 'Laporan Pelanggaran', icon: 'shield', href: 'laporan.html' },
    { group: 'Pengaturan' },
    { id: 'pengguna', label: 'Data Pengguna', icon: 'users', href: 'pengguna.html' }
  ];

  const Layout = {
    /* ---------------------------------------------------------- guard */
    guard(role) {
      const user = window.Api.me();
      if (!user) {
        location.replace('../login.html?next=' + encodeURIComponent(location.pathname.split('/').pop()));
        return null;
      }
      if (role && user.role !== role) {
        location.replace(user.role === 'Admin' ? '../admin/dashboard.html' : '../peserta/dashboard.html');
        return null;
      }
      return user;
    },

    /* ---------------------------------------------------------- sidebar admin */
    renderAdmin({ page, title, crumbs }) {
      const user = this.guard('Admin');
      if (!user) return null;

      const nav = NAV_ADMIN.map(item => {
        if (item.group) return `<div class="nav-group"><div class="nav-title">${item.group}</div>`;
        const active = item.id === page ? ' active' : '';
        return `<a class="nav-link${active}" href="${item.href}">
          <span class="ico">${I(item.icon, 17)}</span><span>${item.label}</span>
        </a>`;
      }).join('') + '</div>';

      const side = document.getElementById('sidebar');
      if (side) {
        side.innerHTML = `
          <div class="brand">
            <div class="brand-mark">CAT</div>
            <div class="brand-text">
              <b>${window.UI.esc(CFG.APP_NAME)}</b>
              <span>Panel Admin</span>
            </div>
          </div>
          <nav class="nav">${nav}</nav>
          <div class="side-foot">
            <div class="side-user">
              <div class="avatar">${window.UI.inisial(user.nama_lengkap)}</div>
              <div class="who">
                <b>${window.UI.esc(user.nama_lengkap)}</b>
                <span>${window.UI.esc(user.role)}</span>
              </div>
              <button class="btn btn-ghost btn-icon" data-logout title="Keluar" style="margin-left:auto;color:#c3d2e3">${I('logout', 17)}</button>
            </div>
          </div>`;
      }

      const top = document.getElementById('topbar');
      if (top) {
        top.innerHTML = `
          <button class="btn btn-icon" data-menu aria-label="Menu">${I('menu', 18)}</button>
          <div>
            <div class="page-title">${window.UI.esc(title || '')}</div>
            ${crumbs ? `<div class="crumbs">${window.UI.esc(crumbs)}</div>` : ''}
          </div>
          <div class="spacer"></div>
          <a class="btn btn-sm" href="../peserta/dashboard.html" target="_blank" rel="noopener">
            ${I('eye', 15)} Lihat sisi peserta
          </a>
          <button class="btn btn-icon" data-logout title="Keluar">${I('logout', 18)}</button>`;
      }

      window.UI.$$('[data-logout]').forEach(b => b.addEventListener('click', () => {
        window.Api.logout();
        location.replace('../login.html');
      }));

      const menuBtn = document.querySelector('[data-menu]');
      if (menuBtn) menuBtn.addEventListener('click', () => side.classList.toggle('open'));

      if (CFG.DEMO_MODE) this.demoBanner();

      return user;
    },

    /* ---------------------------------------------------------- topbar peserta */
    renderPeserta({ page, examTitle, examSub }) {
      const user = this.guard('Peserta');
      if (!user) return null;

      const bar = document.getElementById('ptopbar');
      if (bar) {
        bar.innerHTML = `
          <a class="brand" href="dashboard.html" style="text-decoration:none;color:inherit">
            <div class="brand-mark">CAT</div>
            <div>
              <b>${window.UI.esc(CFG.APP_NAME)}</b>
              <span>${window.UI.esc(CFG.INSTANSI.split(' ').slice(-2).join(' '))}</span>
            </div>
          </a>
          <div class="divider"></div>
          <div class="exam-label">
            ${examTitle ? `<b>${window.UI.esc(examTitle)}</b><span>${window.UI.esc(examSub || '')}</span>` : '<b>Portal Peserta</b><span>Pilih ujian yang tersedia</span>'}
          </div>
          <div class="spacer"></div>
          <div class="p-user">
            <div class="who">
              <b>${window.UI.esc(user.nama_lengkap)}</b>
              <span>${window.UI.esc(user.username)}</span>
            </div>
            <div class="avatar">${window.UI.inisial(user.nama_lengkap)}</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-logout>${I('logout', 16)} Keluar</button>`;
      }

      window.UI.$$('[data-logout]').forEach(b => b.addEventListener('click', async () => {
        const ok = await window.UI.confirm({
          title: 'Keluar dari sistem?',
          message: 'Kamu akan kembali ke halaman login.',
          okText: 'Keluar',
          danger: true
        });
        if (!ok) return;
        window.Api.logout();
        location.replace('../login.html');
      }));

      if (CFG.DEMO_MODE) this.demoBanner();

      return user;
    },

    /* ---------------------------------------------------------- banner mode demo */
    demoBanner() {
      if (document.getElementById('demo-flag')) return;
      const flag = document.createElement('div');
      flag.id = 'demo-flag';
      flag.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:120;display:flex;align-items:center;gap:7px;' +
        'background:#0b2545;color:#c3d2e3;font-size:11.5px;font-weight:600;padding:6px 11px;border-radius:999px;' +
        'box-shadow:0 4px 14px rgba(11,37,69,.3);letter-spacing:.01em';
      flag.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#f59e0b"></span>
        Mode demo · data lokal`;
      flag.title = 'Data disimpan di localStorage. Set DEMO_MODE = false di assets/js/config.js untuk memakai API Laravel.';
      document.body.appendChild(flag);
    },

    /* ---------------------------------------------------------- util */
    setTitle(t) { document.title = t ? `${t} · ${CFG.APP_NAME}` : CFG.APP_NAME; }
  };

  window.Layout = Layout;
})();
