/* =========================================================
   効果音（音声ファイル不要・WebAudioで合成）
   ブラウザの自動再生制限があるため、最初の操作時に resume する
   ========================================================= */
const Sfx = {
  ctx: null,
  enabled: true,

  ensure: function () {
    if (!this.enabled) { return null; }
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.enabled = false; return null; }
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') { this.ctx.resume(); }
    return this.ctx;
  },

  /* 単音を鳴らす */
  tone: function (freq, endFreq, dur, type, vol, delay) {
    const ctx = this.ensure();
    if (!ctx) { return; }

    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  /* ハートが出た */
  heart: function () {
    this.tone(620, 1040, 0.09, 'sine', 0.14, 0);
  },

  /* つかまえた */
  catch: function () {
    this.tone(784, 784, 0.09, 'triangle', 0.13, 0);
    this.tone(988, 988, 0.09, 'triangle', 0.13, 0.06);
    this.tone(1175, 1175, 0.09, 'triangle', 0.13, 0.12);
    this.tone(1568, 2093, 0.18, 'triangle', 0.12, 0.18);
  },

  /* 指を離したけど、ハートの中にいなかった */
  whiff: function () {
    this.tone(420, 240, 0.18, 'triangle', 0.11, 0);
  },

  /* 3秒たってハートが消えた */
  lost: function () {
    this.tone(330, 300, 0.10, 'sawtooth', 0.09, 0);
    this.tone(220, 90, 0.30, 'sawtooth', 0.11, 0.09);
  },

  /* キャラが現れた */
  appear: function () {
    this.tone(500, 900, 0.08, 'sine', 0.07, 0);
  },

  /* ハートの残り時間が少ない */
  warn: function () {
    this.tone(980, 980, 0.05, 'square', 0.05, 0);
  },

  ui: function () {
    this.tone(660, 990, 0.09, 'square', 0.10, 0);
  },

  count: function () {
    this.tone(520, 520, 0.09, 'square', 0.10, 0);
  },

  start: function () {
    this.tone(660, 990, 0.16, 'square', 0.13, 0);
    this.tone(990, 1320, 0.18, 'square', 0.11, 0.10);
  },

  /* 称号発表：上位は明るく、一番下はしょんぼり */
  rank: function (isGood) {
    if (isGood) {
      this.tone(523, 523, 0.12, 'triangle', 0.13, 0);
      this.tone(659, 659, 0.12, 'triangle', 0.13, 0.10);
      this.tone(784, 784, 0.34, 'triangle', 0.14, 0.20);
    } else {
      this.tone(392, 392, 0.14, 'triangle', 0.11, 0);
      this.tone(330, 330, 0.14, 'triangle', 0.11, 0.12);
      this.tone(262, 220, 0.42, 'triangle', 0.12, 0.24);
    }
  },

  /* 「両想い」の特別演出のファンファーレ */
  love: function () {
    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      this.tone(notes[i], notes[i], 0.16, 'triangle', 0.13, i * 0.09);
    }
    this.tone(1047, 1047, 0.6, 'triangle', 0.10, 0.40);
    this.tone(1319, 1319, 0.6, 'triangle', 0.10, 0.40);
    this.tone(1568, 1568, 0.6, 'triangle', 0.09, 0.40);
    this.tone(2093, 2637, 0.30, 'sine', 0.07, 0.75);
  },

  finish: function () {
    this.tone(660, 660, 0.14, 'triangle', 0.13, 0);
    this.tone(520, 520, 0.14, 'triangle', 0.13, 0.14);
    this.tone(880, 880, 0.30, 'triangle', 0.13, 0.28);
  }
};
