/* ============================================================
   UI Helpers — toast, modal, format, ikon
   ============================================================ */
(function () {
  'use strict';

  const UI = {};

  /* ---------------------------------------------------------- selektor */
  UI.$  = (sel, root = document) => root.querySelector(sel);
  UI.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------------------------------------------------- escape */
  UI.esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  UI.nl2br = (s) => UI.esc(s).replace(/\n/g, '<br>');

  /* ---------------------------------------------------------- format */
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  UI.pad = (n) => String(n).padStart(2, '0');

  UI.tanggal = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return iso;
    return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  };

  UI.tanggalPanjang = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return iso;
    return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  };

  UI.jam = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso.replace(' ', 'T'));
    if (isNaN(d)) return iso;
    return `${UI.pad(d.getHours())}:${UI.pad(d.getMinutes())}`;
  };

  UI.jamDetik = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso.replace(' ', 'T'));
    if (isNaN(d)) return iso;
    return `${UI.pad(d.getHours())}:${UI.pad(d.getMinutes())}:${UI.pad(d.getSeconds())}`;
  };

  UI.durasi = (menit) => {
    const m = Number(menit) || 0;
    if (m < 60) return `${m} menit`;
    const j = Math.floor(m / 60), s = m % 60;
    return s ? `${j} jam ${s} menit` : `${j} jam`;
  };

  UI.mmss = (totalDetik) => {
    const t = Math.max(0, Math.floor(totalDetik));
    const j = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return j > 0
      ? `${UI.pad(j)}:${UI.pad(m)}:${UI.pad(s)}`
      : `${UI.pad(m)}:${UI.pad(s)}`;
  };

  UI.relatif = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso.replace(' ', 'T'));
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return UI.tanggal(iso);
  };

  UI.inisial = (nama) => String(nama || '?')
    .trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();

  /* ---------------------------------------------------------- toast */
  UI.toast = (msg, type = 'ok', ms = 3200) => {
    let host = document.querySelector('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    const ico = type === 'err' ? UI.icon('alert', 16)
              : type === 'warn' ? UI.icon('alert', 16)
              : UI.icon('check', 16);
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="ico">${ico}</span><span>${UI.esc(msg)}</span>`;
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'opacity .2s, transform .2s';
      setTimeout(() => el.remove(), 220);
    }, ms);
  };

  /* ---------------------------------------------------------- modal */
  UI.openModal = (id) => {
    const m = typeof id === 'string' ? document.getElementById(id) : id;
    if (!m) return;
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    const focusable = m.querySelector('input, select, textarea, button');
    if (focusable) setTimeout(() => focusable.focus(), 60);
  };

  UI.closeModal = (id) => {
    const m = typeof id === 'string' ? document.getElementById(id) : id;
    if (!m) return;
    m.classList.remove('open');
    if (!document.querySelector('.modal-backdrop.open')) document.body.style.overflow = '';
  };

  UI.bindModals = () => {
    UI.$$('.modal-backdrop').forEach(bd => {
      bd.addEventListener('mousedown', (e) => { if (e.target === bd) UI.closeModal(bd); });
      UI.$$('[data-close]', bd).forEach(b => b.addEventListener('click', () => UI.closeModal(bd)));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const open = document.querySelector('.modal-backdrop.open');
        if (open) UI.closeModal(open);
      }
    });
  };

  UI.confirm = ({ title = 'Konfirmasi', message = '', okText = 'Ya, lanjutkan', danger = false }) => {
    return new Promise((resolve) => {
      const id = 'ui-confirm-' + Date.now();
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop open';
      wrap.id = id;
      wrap.innerHTML = `
        <div class="modal" style="max-width:440px">
          <div class="modal-head">
            <div>
              <h3>${UI.esc(title)}</h3>
              <div class="sub">${UI.esc(message)}</div>
            </div>
            <button class="x" data-no aria-label="Tutup">${UI.icon('x', 16)}</button>
          </div>
          <div class="modal-foot">
            <button class="btn" data-no>Batal</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${UI.esc(okText)}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      document.body.style.overflow = 'hidden';
      const done = (v) => { wrap.remove(); document.body.style.overflow = ''; resolve(v); };
      wrap.querySelector('[data-yes]').addEventListener('click', () => done(true));
      wrap.querySelectorAll('[data-no]').forEach(b => b.addEventListener('click', () => done(false)));
      wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) done(false); });
    });
  };

  /* ---------------------------------------------------------- ikon (inline SVG) */
  const PATHS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    exam: '<path d="M8 3h8a2 2 0 0 1 2 2v16l-6-4-6 4V5a2 2 0 0 1 2-2z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.1 1-1.1 1.8v.4"/><path d="M12 17h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-7 0-11-7-11-7a19 19 0 0 1 5.1-5.9"/><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a19.4 19.4 0 0 1-2.2 3.2"/><path d="M1 1l22 22"/>',
    arrowRight: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
    play: '<path d="M6 3l14 9-14 9z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 5-7"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/>',
    menu: '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
    chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
    chevronRight: '<path d="M9 18l6-6-6-6"/>',
    refresh: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10"/><path d="M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    dot: '<circle cx="12" cy="12" r="4"/>'
  };

  UI.icon = (name, size = 18, stroke = 1.8) => {
    const p = PATHS[name] || PATHS.dot;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  };

  /* ---------------------------------------------------------- tabel kosong */
  UI.empty = (kolom, pesan = 'Belum ada data') =>
    `<tr><td colspan="${kolom}"><div class="empty-state">
      <div class="ico">${UI.icon('file', 30, 1.4)}</div>
      <div>${UI.esc(pesan)}</div></div></td></tr>`;

  /* ---------------------------------------------------------- tombol loading */
  UI.loading = (btn, on, text = 'Menyimpan…') => {
    if (!btn) return;
    if (on) {
      btn.dataset.oldHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> ${UI.esc(text)}`;
    } else {
      btn.disabled = false;
      if (btn.dataset.oldHtml) btn.innerHTML = btn.dataset.oldHtml;
    }
  };

  /* ---------------------------------------------------------- debounce */
  UI.debounce = (fn, ms = 260) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  UI.params = (key) => new URLSearchParams(location.search).get(key);

  window.UI = UI;
})();
