/* ============================================================
   Ruang ujian peserta — timer, navigator, autosave, proctoring
   ============================================================ */
(function () {
  'use strict';

  const UI = window.UI;
  const Api = window.Api;
  const CFG = window.CAT_CONFIG;

  const user = window.Layout.renderPeserta({ page: 'ujian' });
  if (!user) return;

  const idUjian = UI.params('id') || UI.params('ujian');
  if (!idUjian) {
    location.replace('dashboard.html');
    return;
  }

  const HURUF = ['A', 'B', 'C', 'D', 'E'];

  const S = {
    rekam: null,
    ujian: null,
    soal: [],
    jawaban: {},        // id_soal -> 'A' | 'B' ...
    flagged: new Set(),
    idx: 0,
    deadline: 0,
    finished: false,
    vio: 0,
    timerId: null,
    warned: {}          // cooldown overlay
  };

  let flagKey = '';

  /* ---------------------------------------------------------- ikon */
  UI.$('#warnIcon').innerHTML = UI.icon('alert', 30, 2);
  UI.$('#btnFlag').innerHTML = UI.icon('flag', 15) + ' Tandai ragu-ragu';

  /* ---------------------------------------------------------- boot */
  async function boot() {
    let data;
    try {
      data = await Api.mulaiUjian(idUjian);
    } catch (err) {
      if (err.code === 'SUDAH_SELESAI' && err.id_rekam_jejak) {
        location.replace('hasil.html?rekam=' + err.id_rekam_jejak);
        return;
      }
      UI.$('#qText').innerHTML = `<span style="color:var(--red-600)">${UI.esc(err.message)}</span>`;
      UI.$('#optList').innerHTML = '';
      return;
    }

    S.rekam = data.rekam;
    S.ujian = data.ujian;
    S.soal = data.soal || [];
    S.deadline = data.deadline;
    (data.jawaban || []).forEach(j => { S.jawaban[j.id_soal] = j.jawaban_dipilih; });
    if (data.ujian && data.ujian.durasi_menit) {
      window.Layout.setTitle('Ujian · ' + data.ujian.judul_mata_kuliah);
      UI.$('#barTitle').textContent = data.ujian.judul_mata_kuliah;
      UI.$('#barSub').textContent = `${S.soal.length} soal · ${UI.durasi(data.ujian.durasi_menit)}`;
    }

    /* flag tersimpan lokal per attempt */
    flagKey = 'cat_flags_' + S.rekam.id_rekam_jejak;
    try {
      const raw = localStorage.getItem(flagKey);
      if (raw) JSON.parse(raw).forEach(n => S.flagged.add(Number(n)));
    } catch (e) { /* ignore */ }

    renderNav();
    renderSoal();
    startTimer();
    startProctor();
  }

  /* ---------------------------------------------------------- render soal */
  function renderSoal() {
    const s = S.soal[S.idx];
    if (!s) return;

    UI.$('#qNo').innerHTML = `${S.idx + 1} <span>/ ${S.soal.length}</span>`;
    UI.$('#qText').textContent = s.teks_soal || '';

    const dipilih = S.jawaban[s.id_soal];
    UI.$('#optList').innerHTML = HURUF.map(h => {
      const teks = s['opsi_' + h.toLowerCase()];
      if (teks == null || teks === '') return '';
      const on = dipilih === h;
      return `<label class="opt ${on ? 'is-checked' : ''}" data-opt="${h}">
        <input type="radio" name="jawaban" value="${h}" ${on ? 'checked' : ''}>
        <span class="key">${h}</span>
        <span class="txt">${UI.esc(teks)}</span>
      </label>`;
    }).join('');

    /* highlight tombol flag */
    const isFlag = S.flagged.has(Number(s.nomor_urut));
    UI.$('#btnFlag').style.color = isFlag ? 'var(--amber-600)' : '';
    UI.$('#btnFlag').style.background = isFlag ? 'var(--amber-100)' : '';
    UI.$('#btnFlag').style.borderColor = isFlag ? '#fedf89' : 'transparent';

    UI.$('#btnPrev').disabled = S.idx === 0;
    UI.$('#btnNext').textContent = S.idx === S.soal.length - 1 ? 'Soal terakhir' : 'Berikutnya';
    UI.$('#btnNext').disabled = S.idx === S.soal.length - 1;

    updateNav();
  }

  /* ---------------------------------------------------------- pilih jawaban */
  async function pilih(huruf) {
    const s = S.soal[S.idx];
    if (!s || S.finished) return;

    S.jawaban[s.id_soal] = huruf;

    /* UI langsung */
    UI.$$('#optList .opt').forEach(el => {
      el.classList.toggle('is-checked', el.dataset.opt === huruf);
    });
    updateNav();

    /* simpan */
    const note = UI.$('#autosaveNote');
    note.textContent = 'Menyimpan…';
    note.style.color = 'var(--ink-500)';
    try {
      await Api.simpanJawaban(S.rekam.id_rekam_jejak, s.id_soal, huruf);
      note.textContent = 'Tersimpan ' + UI.jamDetik(new Date().toISOString());
      note.style.color = 'var(--green-600)';
    } catch (err) {
      note.textContent = 'Gagal menyimpan — periksa koneksi';
      note.style.color = 'var(--red-600)';
    }
  }

  /* ---------------------------------------------------------- navigator */
  function renderNav() {
    UI.$('#navGrid').innerHTML = S.soal.map((s, i) => {
      const answered = !!S.jawaban[s.id_soal];
      const flag = S.flagged.has(Number(s.nomor_urut));
      return `<button data-i="${i}" class="${answered ? 'answered' : ''} ${flag ? 'flagged' : ''}">${i + 1}</button>`;
    }).join('');

    UI.$('#navGrid').onclick = (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      S.idx = Number(b.dataset.i);
      renderSoal();
    };
  }

  function updateNav() {
    const total = S.soal.length;
    const done = S.soal.filter(s => !!S.jawaban[s.id_soal]).length;

    UI.$('#navGrid').querySelectorAll('button[data-i]').forEach(b => {
      const s = S.soal[Number(b.dataset.i)];
      if (!s) return;
      b.classList.toggle('answered', !!S.jawaban[s.id_soal]);
      b.classList.toggle('flagged', S.flagged.has(Number(s.nomor_urut)));
      b.classList.toggle('current', Number(b.dataset.i) === S.idx);
    });

    UI.$('#sumDone').textContent = done;
    UI.$('#sumLeft').textContent = total - done;
    UI.$('#navCount').textContent = `${done}/${total}`;
  }

  /* ---------------------------------------------------------- navigasi */
  UI.$('#btnPrev').addEventListener('click', () => {
    if (S.idx > 0) { S.idx--; renderSoal(); }
  });
  UI.$('#btnNext').addEventListener('click', () => {
    if (S.idx < S.soal.length - 1) { S.idx++; renderSoal(); }
  });

  UI.$('#optList').addEventListener('click', (e) => {
    const opt = e.target.closest('.opt');
    if (!opt) return;
    e.preventDefault();
    pilih(opt.dataset.opt);
  });

  UI.$('#btnFlag').addEventListener('click', () => {
    const s = S.soal[S.idx];
    if (!s) return;
    const n = Number(s.nomor_urut);
    if (S.flagged.has(n)) S.flagged.delete(n); else S.flagged.add(n);
    try { localStorage.setItem(flagKey, JSON.stringify([...S.flagged])); } catch (e) { /* ignore */ }
    renderSoal();
  });

  /* ---------------------------------------------------------- keyboard */
  document.addEventListener('keydown', (e) => {
    if (S.finished) return;
    if (/input|textarea|select/i.test(e.target.tagName)) return;

    if (e.key === 'ArrowRight') { UI.$('#btnNext').click(); }
    else if (e.key === 'ArrowLeft') { UI.$('#btnPrev').click(); }
    else if (/^[1-5]$/.test(e.key)) {
      const h = HURUF[Number(e.key) - 1];
      if (S.soal[S.idx] && S.soal[S.idx]['opsi_' + h.toLowerCase()]) pilih(h);
    }
  });

  /* ---------------------------------------------------------- timer */
  function startTimer() {
    const el = UI.$('#timerVal');
    const box = UI.$('#timer');

    const tick = () => {
      const left = Math.floor((S.deadline - Date.now()) / 1000);
      if (left <= 0) {
        el.textContent = '00:00';
        stopTimer();
        if (!S.finished) {
          UI.toast('Waktu habis — jawaban dikirim otomatis.', 'warn', 6000);
          submit(true);
        }
        return;
      }
      el.textContent = UI.mmss(left);
      box.classList.toggle('is-warning', left <= 300 && left > 60);
      box.classList.toggle('is-danger', left <= 60);
    };

    tick();
    S.timerId = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (S.timerId) { clearInterval(S.timerId); S.timerId = null; }
  }

  /* ---------------------------------------------------------- proctoring */
  function setCamState(state, text) {
    const dot = UI.$('#camDot');
    const dot2 = UI.$('#camDot2');
    const txt = UI.$('#camText');
    const st = UI.$('#camStatus');

    [dot, dot2].forEach(d => {
      d.classList.remove('bad', 'warn');
      if (state === 'bad') d.classList.add('bad');
      if (state === 'warn') d.classList.add('warn');
      if (state === 'ok') d.style.background = '#22c55e';
      if (state === 'off') d.style.background = '#98a2b3';
    });

    txt.textContent = text;
    st.className = 'status-line ' + (state === 'ok' ? 'ok' : 'bad');
    st.textContent = text;
  }

  async function startProctor() {
    const video = UI.$('#camVideo');

    const res = await window.Proctor.start({
      video,
      id_user: user.id_user,
      id_rekam_jejak: S.rekam.id_rekam_jejak,

      onReady: ({ mode }) => {
        UI.$('#camMode').textContent = mode === 'faceapi' ? 'face-api' : mode === 'native' ? 'native' : 'manual';
        setCamState('ok', 'Kamera aktif — memantau');
      },

      onCameraError: (err) => {
        UI.$('#camOff').classList.remove('hidden');
        video.classList.add('hidden');
        UI.$('#camMode').textContent = 'off';
        setCamState('bad', 'Kamera tidak aktif');
        UI.toast('Kamera tidak dapat diakses: ' + (err.message || 'izin ditolak'), 'err', 6000);
      },

      onStatus: ({ status, faces }) => {
        if (status === 'Normal') {
          setCamState('ok', 'Wajah terdeteksi' + (faces > 0 ? ` (${faces})` : ''));
        }
      },

      onViolation: (v) => {
        if (S.finished) return;
        S.vio++;
        UI.$('#vioCount').textContent = S.vio;
        tampilkanPeringatan(v);
      }
    });

    if (res && res.ok === false) {
      /* sudah ditangani onCameraError */
    }
  }

  /* ---------------------------------------------------------- peringatan */
  const PESAN = {
    'No Face': 'Wajahmu tidak terdeteksi kamera. Duduk tegak di depan layar dan pastikan pencahayaan cukup.',
    'Multiple Faces': 'Terdeteksi lebih dari satu wajah dalam frame. Ujian harus dikerjakan sendiri.',
    'Looking Away': 'Kamu terdeteksi meninggalkan halaman ujian. Tetap berada di tab ini sampai selesai.',
    'Suspicious Activity': 'Aktivitas mencurigakan terdeteksi di sekitar area ujian.'
  };

  function tampilkanPeringatan(v) {
    const jenis = v.jenis || 'No Face';
    const sekarang = Date.now();
    /* overlay jangan muncul terus-menerus untuk jenis yang sama */
    if (S.warned[jenis] && sekarang - S.warned[jenis] < (CFG.WARN_COOLDOWN_MS || 12000)) return;
    S.warned[jenis] = sekarang;

    UI.$('#warnTitle').textContent = jenis;
    UI.$('#warnMsg').textContent = PESAN[jenis] || v.keterangan || 'Pelanggaran terdeteksi.';
    UI.$('#warnCounter').textContent =
      `Peringatan ${S.vio} dari ${CFG.MAX_WARNING_BEFORE_DQ} · ${UI.jamDetik(new Date().toISOString())}`;
    UI.$('#warnOverlay').classList.add('open');

    /* batas maksimal → diskualifikasi */
    if (S.vio >= (CFG.MAX_WARNING_BEFORE_DQ || 12)) {
      UI.$('#warnTitle').textContent = 'Ujian dihentikan';
      UI.$('#warnMsg').textContent = 'Jumlah pelanggaran telah melewati batas. Ujian dihentikan otomatis dan akan diperiksa panitia.';
      UI.$('#warnOk').textContent = 'Mengerti';
      UI.$('#warnOk').onclick = () => submit(true, true);
      return;
    }

    UI.$('#warnOk').onclick = () => UI.$('#warnOverlay').classList.remove('open');
  }

  /* ---------------------------------------------------------- panel kamera */
  UI.$('#camToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    const p = UI.$('#camPanel');
    p.classList.toggle('collapsed');
    UI.$('#camToggle').textContent = p.classList.contains('collapsed') ? '+' : '−';
  });

  /* ---------------------------------------------------------- selesai */
  function bukaKonfirmasi() {
    const total = S.soal.length;
    const done = S.soal.filter(s => !!S.jawaban[s.id_soal]).length;
    const left = total - done;
    const flag = S.flagged.size;

    UI.$('#fmTotal').textContent = total;
    UI.$('#fmDone').textContent = done;
    UI.$('#fmLeft').textContent = left;
    UI.$('#fmFlag').textContent = flag;
    UI.$('#fmVio').textContent = S.vio;
    UI.$('#fmWarn').classList.toggle('hidden', left === 0);

    UI.openModal('finishModal');
  }

  async function submit(auto, diskualifikasi) {
    if (S.finished) return;
    S.finished = true;
    stopTimer();
    UI.closeModal('finishModal');
    UI.$('#warnOverlay').classList.remove('open');
    window.Proctor.stop();

    UI.$('#btnFinish').disabled = true;
    UI.$('#btnFinish').textContent = 'Mengirim…';

    try {
      const res = await Api.selesaiUjian(S.rekam.id_rekam_jejak, {
        diskualifikasi: !!diskualifikasi,
        alasan: diskualifikasi ? 'Melebihi batas peringatan proctoring' : (auto ? 'Waktu habis' : null)
      });
      const idRekam = (res && res.hasil && res.hasil.id_rekam_jejak) || S.rekam.id_rekam_jejak;
      UI.toast('Jawaban terkirim.', 'ok', 2500);
      setTimeout(() => location.replace('hasil.html?rekam=' + idRekam), 600);
    } catch (err) {
      S.finished = false;
      UI.$('#btnFinish').disabled = false;
      UI.$('#btnFinish').textContent = 'Selesai ujian';
      UI.toast('Gagal mengirim: ' + err.message, 'err', 6000);
    }
  }

  UI.$('#btnFinish').addEventListener('click', bukaKonfirmasi);
  UI.$('#btnSubmit').addEventListener('click', () => submit(false, false));

  UI.bindModals();
  window.addEventListener('beforeunload', (e) => {
    if (!S.finished) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  boot();
})();
