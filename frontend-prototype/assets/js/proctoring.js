/* ============================================================
   Proctor — kamera + deteksi wajah + pengiriman log
   Deteksi memakai face-api.js (tiny_face_detector, lokal/offline)
   ============================================================ */
(function () {
  'use strict';

  const CFG = window.CAT_CONFIG;

  const Proctor = {
    running: false,
    ready: false,
    cameraError: null,
    detectorMode: 'none',        // 'faceapi' | 'native' | 'none'
    lastStatus: 'Normal',
    _video: null,
    _canvas: null,
    _timer: null,
    _busy: false,
    _lastSent: {},               // cooldown per jenis pelanggaran
    _lastTs: 0,
    _opts: {},
    stats: { tick: 0, violations: 0, faces: 0, fps: 0 },

    /* ---------------------------------------------------------- load library */
    async _loadLib() {
      if (window.faceapi) return 'faceapi';

      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = '../assets/vendor/face-api.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Gagal memuat face-api.js'));
        document.head.appendChild(s);
      });

      await faceapi.nets.tinyFaceDetector.loadFromUri('../assets/vendor/weights');
      return 'faceapi';
    },

    /* ---------------------------------------------------------- start */
    async start(opts = {}) {
      this._opts = opts;
      const { video, canvas } = opts;
      if (!video) throw new Error('Elemen video tidak ditemukan.');

      this._video = video;
      this._video.muted = true;
      this._video.playsInline = true;
      this._video.setAttribute('playsinline', '');
      this._video.setAttribute('muted', '');

      this._canvas = canvas || document.createElement('canvas');
      this._canvas.width = CFG.PROCTOR_CAPTURE_WIDTH;
      this._canvas.height = Math.round(CFG.PROCTOR_CAPTURE_WIDTH * 0.75);

      /* 1. kamera */
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        this._video.srcObject = stream;
        await this._video.play().catch(() => {});
        this.cameraError = null;
      } catch (err) {
        this.cameraError = err;
        this.ready = false;
        this.detectorMode = 'none';
        if (this._opts.onCameraError) this._opts.onCameraError(err);
        return { ok: false, reason: 'camera', error: err };
      }

      /* 2. detektor */
      try {
        await this._loadLib();
        this.detectorMode = 'faceapi';
      } catch (e) {
        this.detectorMode = ('FaceDetector' in window) ? 'native' : 'none';
      }

      this.ready = true;
      this.running = true;
      this._lastTs = Date.now();

      /* 3. loop */
      const interval = Math.max(1000, Number(CFG.PROCTOR_INTERVAL_MS) || 3000);
      this._timer = setInterval(() => this._tick(), interval);
      setTimeout(() => this._tick(), 600);

      /* 4. tab switch = menoleh */
      this._visHandler = () => {
        if (document.hidden) {
          this._pendingAway = true;
        } else if (this._pendingAway) {
          this._pendingAway = false;
          this._emit('Looking Away', 'Peserta berpindah tab atau meninggalkan halaman ujian', true);
        }
      };
      document.addEventListener('visibilitychange', this._visHandler);

      if (this._opts.onReady) this._opts.onReady({ mode: this.detectorMode });
      return { ok: true, mode: this.detectorMode };
    },

    /* ---------------------------------------------------------- stop */
    stop() {
      this.running = false;
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      if (this._visHandler) {
        document.removeEventListener('visibilitychange', this._visHandler);
        this._visHandler = null;
      }
      const v = this._video;
      if (v && v.srcObject) {
        v.srcObject.getTracks().forEach(t => t.stop());
        v.srcObject = null;
      }
    },

    /* ---------------------------------------------------------- frame → dataURL */
    frame(quality) {
      const v = this._video, c = this._canvas;
      if (!v || !c || !v.videoWidth) return null;
      const w = c.width;
      const h = Math.round(w * (v.videoHeight / v.videoWidth));
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(v, 0, 0, w, h);
      return c.toDataURL('image/jpeg', quality || CFG.PROCTOR_JPEG_QUALITY);
    },

    /* ---------------------------------------------------------- deteksi */
    async _detect() {
      const v = this._video;
      if (!v || !v.videoWidth) return -1;

      if (this.detectorMode === 'faceapi' && window.faceapi) {
        const opt = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: Number(CFG.FACE_MIN_CONFIDENCE) || 0.4
        });
        const dets = await faceapi.detectAllFaces(v, opt);
        /* abaikan wajah yang terlalu kecil (gangguan latar belakang) */
        const minW = v.videoWidth * 0.11;
        const valid = dets.filter(d => d.box.width >= minW);
        return valid.length;
      }

      if (this.detectorMode === 'native') {
        try {
          const fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
          const faces = await fd.detect(v);
          return faces.length;
        } catch (e) {
          return -1;
        }
      }
      return -1;
    },

    /* ---------------------------------------------------------- tick */
    async _tick() {
      if (!this.running || this._busy) return;
      this._busy = true;
      const now = Date.now();
      try {
        const n = await this._detect();
        this.stats.tick++;

        let jenis = 'Normal';
        let ket = '';

        if (n < 0) {
          jenis = 'Normal';                       // detektor tidak tersedia → jangan tuduh
        } else if (n === 0) {
          jenis = 'No Face';
          ket = 'Wajah tidak terdeteksi pada frame kamera';
        } else if (n > 1) {
          jenis = 'Multiple Faces';
          ket = `Terdeteksi ${n} wajah dalam satu frame`;
        }

        this.lastStatus = jenis;
        this.stats.faces = n;

        if (this._opts.onStatus) {
          this._opts.onStatus({
            status: jenis,
            faces: n,
            mode: this.detectorMode,
            cameraOk: !this.cameraError
          });
        }

        if (jenis !== 'Normal') {
          this._emit(jenis, ket, false);
        }

        const dt = (now - this._lastTs) / 1000;
        this._lastTs = now;
        if (dt > 0) this.stats.fps = Math.round((1 / dt) * 10) / 10;
      } catch (e) {
        console.warn('Proctor tick error:', e);
      } finally {
        this._busy = false;
      }
    },

    /* ---------------------------------------------------------- kirim pelanggaran */
    async _emit(jenis, keterangan, force) {
      const key = jenis;
      const gap = force ? 2000 : Number(CFG.WARN_COOLDOWN_MS) || 12000;
      const now = Date.now();
      if (!force && this._lastSent[key] && (now - this._lastSent[key] < gap)) return;
      this._lastSent[key] = now;

      const shot = this.frame();
      this.stats.violations++;

      if (this._opts.onViolation) {
        this._opts.onViolation({ jenis, keterangan, screenshot: shot, waktu: new Date() });
      }

      if (!this._opts.id_rekam_jejak) return;
      try {
        await window.Api.kirimLog({
          id_rekam_jejak: this._opts.id_rekam_jejak,
          id_user: this._opts.id_user,
          jenis_pelanggaran: jenis,
          keterangan,
          bukti_screenshot: shot
        });
      } catch (e) {
        console.warn('Gagal mengirim log proctoring:', e.message);
      }
    },

    /* ---------------------------------------------------------- simulasi (demo / tanpa kamera) */
    simulate(jenis) {
      const ket = {
        'No Face': 'Simulasi: wajah tidak terdeteksi',
        'Multiple Faces': 'Simulasi: terdeteksi lebih dari satu wajah',
        'Looking Away': 'Simulasi: peserta menoleh dari layar',
        'Suspicious Activity': 'Simulasi: aktivitas mencurigakan terdeteksi'
      }[jenis] || 'Simulasi pelanggaran';
      return this._emit(jenis, ket, true);
    }
  };

  window.Proctor = Proctor;
})();
