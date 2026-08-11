/**
 * speech.js - 語音合成模組
 * 匯出為 Speech 物件
 */
const Speech = (() => {
  let _supported = false;
  let _rate = 1.0;
  let _synth = null;
  let _voices = [];

  // 偏好的高品質英文語音（依優先順序）
  const PREFERRED_VOICES = [
    'Google US English',
    'Microsoft Aria',
    'Microsoft Guy',
    'Microsoft David',
    'Microsoft Mark',
    'Samantha',
    'Alex',
    'Karen',
    'Daniel'
  ];

  function _loadVoices() {
    if (!_synth) return;
    const v = _synth.getVoices();
    if (v.length > 0) _voices = v;
  }

  function _getBestVoice() {
    if (_voices.length === 0) _loadVoices();
    const enVoices = _voices.filter(v => v.lang.startsWith('en'));
    if (enVoices.length === 0) return null;

    // 嘗試依偏好順序找最清晰的語音
    for (const pref of PREFERRED_VOICES) {
      const found = enVoices.find(v => v.name.includes(pref));
      if (found) return found;
    }
    // 退而求其次：優先 en-US，否則取第一個英文語音
    return enVoices.find(v => v.lang === 'en-US') || enVoices[0];
  }

  function init() {
    try {
      if ('speechSynthesis' in window) {
        _synth = window.speechSynthesis;
        _supported = true;

        // 立刻嘗試取得語音清單（某些瀏覽器同步可用）
        _loadVoices();

        // Chrome 等需要等 voiceschanged 事件才能取得全部語音
        _synth.addEventListener('voiceschanged', () => {
          _loadVoices();
        });
      }
    } catch (e) {
      _supported = false;
    }
    return _supported;
  }

  function speak(text, onEnd) {
    if (!_supported || !_synth) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    try {
      _synth.cancel();

      // 短暫延遲讓 cancel 生效（Chrome 有時需要）
      setTimeout(() => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'en-US';
        utt.rate = _rate;
        utt.pitch = 1.0;
        utt.volume = 1.0;

        // 指定最佳語音
        const bestVoice = _getBestVoice();
        if (bestVoice) utt.voice = bestVoice;

        if (typeof onEnd === 'function') {
          utt.onend = onEnd;
          utt.onerror = onEnd;
        }
        _synth.speak(utt);
      }, 80);
    } catch (e) {
      if (typeof onEnd === 'function') onEnd();
    }
  }

  function setRate(rate) {
    _rate = Number(rate) || 1.0;
  }

  function getRate() {
    return _rate;
  }

  function isSupported() {
    return _supported;
  }

  // 回傳可用的英文語音清單（供設定頁面使用）
  function getAvailableVoices() {
    _loadVoices();
    return _voices.filter(v => v.lang.startsWith('en'));
  }

  return { init, speak, setRate, getRate, isSupported, getAvailableVoices };
})();
