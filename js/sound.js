/**
 * sound.js - 音效模組（Web Audio API 合成，無外部音檔）
 * 匯出為 Sound 物件
 * 提供點選 tick、答對、答錯三種音效，開關狀態存 localStorage。
 */
const Sound = (() => {
  const STORAGE_KEY = 'vocab_game_sound_v1';
  let _ctx = null;
  let _enabled = true;
  let _unlocked = false;

  function _loadEnabled() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      _enabled = v === null ? true : v === '1';
    } catch (e) { _enabled = true; }
  }

  function _saveEnabled() {
    try { localStorage.setItem(STORAGE_KEY, _enabled ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  function _ensureCtx() {
    if (_ctx) return _ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC();
    } catch (e) { _ctx = null; }
    return _ctx;
  }

  function init() {
    _loadEnabled();
    // 行動裝置與 Chrome 的 AudioContext 需在使用者手勢中 resume 才能出聲。
    const unlock = () => {
      if (_unlocked) return;
      const ctx = _ensureCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      _unlocked = true;
    };
    window.addEventListener('touchend', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true });
    return true;
  }

  // 播放單一音符：帶淡入淡出包絡，避免爆音
  function _beep({ freq, type = 'sine', start = 0, duration = 0.12, gain = 0.18 }) {
    const ctx = _ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  // 點選／輸入：短促的高音 tick
  function click() {
    if (!_enabled) return;
    _beep({ freq: 660, type: 'triangle', duration: 0.06, gain: 0.12 });
  }

  // 答對：上行兩音，明亮愉悅
  function correct() {
    if (!_enabled) return;
    _beep({ freq: 784, type: 'sine', start: 0, duration: 0.14, gain: 0.2 });    // G5
    _beep({ freq: 1047, type: 'sine', start: 0.12, duration: 0.2, gain: 0.2 }); // C6
  }

  // 答錯：低沉的下行短音
  function wrong() {
    if (!_enabled) return;
    _beep({ freq: 311, type: 'sawtooth', start: 0, duration: 0.16, gain: 0.14 });    // Eb4
    _beep({ freq: 233, type: 'sawtooth', start: 0.14, duration: 0.24, gain: 0.14 }); // Bb3
  }

  function setEnabled(on) {
    _enabled = !!on;
    _saveEnabled();
    if (_enabled) { _ensureCtx(); click(); } // 打開時給個回饋音
  }

  function toggle() {
    setEnabled(!_enabled);
    return _enabled;
  }

  function isEnabled() { return _enabled; }

  return { init, click, correct, wrong, setEnabled, toggle, isEnabled };
})();
