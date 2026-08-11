/**
 * game.js - 遊戲邏輯模組
 * 匯出為 Game 物件
 */
const Game = (() => {
  let _state = null;
  let _learner = null;
  let _allWords = [];
  let _timer = null;
  let _onTick = null;
  let _onEnd = null;

  const EXTRA_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

  function init(learner, words, { onTick, onEnd }) {
    _learner = learner;
    _allWords = words;
    _onTick = onTick || null;
    _onEnd = onEnd || null;

    _state = {
      timeLeft: 300,
      totalAnswered: 0,
      totalCorrect: 0,
      maxStreak: 0,
      currentStreak: 0,
      starsEarned: 0,
      wrongWords: [],
      paused: false
    };

    return _state;
  }

  function startTimer() {
    if (_timer) clearInterval(_timer);
    _timer = setInterval(() => {
      if (_state.paused) return;
      _state.timeLeft--;
      if (typeof _onTick === 'function') _onTick(_state.timeLeft);
      if (_state.timeLeft <= 0) {
        clearInterval(_timer);
        _timer = null;
        if (typeof _onEnd === 'function') _onEnd(_state);
      }
    }, 1000);
  }

  function pauseTimer() {
    if (_state) _state.paused = true;
  }

  function resumeTimer() {
    if (_state) _state.paused = false;
  }

  function getState() {
    return _state;
  }

  function cleanup() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  }

  // ── Question Generation ───────────────────────────────────

  function _getGameTypes() {
    const grade = _learner ? _learner.grade : 3;
    if (grade >= 5) {
      return ['choice', 'choice',
              'listen', 'listen', 'listen', 'listen', 'listen',
              'spelling_click', 'spelling_click', 'spelling_click', 'spelling_click',
              'spelling_type', 'spelling_type', 'spelling_type', 'spelling_type', 'spelling_type'];
      // 13% choice, 33% listen, 27% spelling_click, 27% spelling_type
    } else {
      return ['choice',
              'listen', 'listen',
              'spelling_click', 'spelling_click'];
      // 20% choice, 40% listen, 40% spelling_click
    }
  }

  function _selectNextWord(recentWrong) {
    if (!_allWords || _allWords.length === 0) return null;

    const now = Date.now();
    const weights = _allWords.map(word => {
      const key = word.en.toLowerCase();
      const wm = Storage.getWordMastery(_learner.id, key);
      let w = wm.weight || 5;

      // recentWrong 加分
      if (recentWrong && recentWrong.includes(key)) w += 5;

      // 超過24小時沒看 +2
      if (wm.lastSeen) {
        const last = new Date(wm.lastSeen).getTime();
        if (now - last > 24 * 60 * 60 * 1000) w += 2;
      } else {
        w += 2; // 從未看過也算超過24小時
      }

      // mastery >= 5 降低 weight
      if (wm.mastery >= 5) w = Math.max(1, w - 3);

      return Math.max(1, w);
    });

    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return _allWords[i];
    }
    return _allWords[_allWords.length - 1];
  }

  function _getDistractors(correctWord, count) {
    const pool = _allWords.filter(w => w.en !== correctWord.en);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateQuestion(recentWrong) {
    const word = _selectNextWord(recentWrong);
    if (!word) return null;

    const types = _getGameTypes();
    const gameType = types[Math.floor(Math.random() * types.length)];

    const question = {
      word,
      gameType,
      options: [],
      shuffledLetters: []
    };

    if (gameType === 'choice' || gameType === 'listen') {
      const distractors = _getDistractors(word, 3);
      const options = _shuffle([word, ...distractors]);
      question.options = options;
    }

    if (gameType === 'spelling_click') {
      const letters = word.en.toLowerCase().split('');
      const wordLen = letters.length;
      const extraCount = Math.max(2, 6 - wordLen);

      // Pick extra unique letters not already in the word
      const wordSet = new Set(letters);
      const extras = EXTRA_LETTERS
        .filter(l => !wordSet.has(l))
        .sort(() => Math.random() - 0.5)
        .slice(0, extraCount);

      question.shuffledLetters = _shuffle([...letters, ...extras]);
    }

    return question;
  }

  // ── Answer Processing ─────────────────────────────────────

  function processAnswer(question, userAnswer) {
    if (!question || !_state) return { correct: false, wordKey: '' };

    const word = question.word;
    const wordKey = word.en.toLowerCase();
    let correct = false;

    switch (question.gameType) {
      case 'choice':
      case 'listen':
        correct = (userAnswer || '').toLowerCase() === wordKey;
        break;
      case 'spelling_click':
      case 'spelling_type':
        correct = (userAnswer || '').toLowerCase().trim() === wordKey;
        break;
    }

    _state.totalAnswered++;

    if (correct) {
      _state.totalCorrect++;
      _state.currentStreak++;
      if (_state.currentStreak > _state.maxStreak) {
        _state.maxStreak = _state.currentStreak;
      }
      _state.starsEarned += (_state.currentStreak > 5 ? 2 : 1);
    } else {
      _state.currentStreak = 0;
      if (!_state.wrongWords.includes(wordKey)) {
        _state.wrongWords.push(wordKey);
      }
    }

    if (_learner) {
      Storage.updateWordMastery(_learner.id, wordKey, correct);
    }

    return { correct, wordKey };
  }

  return {
    init,
    startTimer,
    pauseTimer,
    resumeTimer,
    generateQuestion,
    processAnswer,
    getState,
    cleanup
  };
})();
