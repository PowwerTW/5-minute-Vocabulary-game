/**
 * app.js - 主控制器
 * 整合所有模組
 */

// ── App Version ───────────────────────────────────────────────
// 版本號單一來源：改這裡即可。首頁會自動顯示。
const APP_VERSION = 'v1.4.2';

// ── Global State ──────────────────────────────────────────────

const AppState = {
  currentLearner: null,
  currentQuestion: null,
  recentWrong: [],
  selectedLetters: [],
  gameWords: [],
  answerLocked: false,
  gameDuration: 300,
  reviewMode: false,
  reviewWords: [],
  pendingVariant: null,
  examMode: false,
  wasExam: false,
  lastExamWords: []
};

// ── Helpers ────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast toast-' + type + ' toast-show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = 'toast';
  }, 2000);
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
    // Scroll to top
    window.scrollTo(0, 0);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// ── View: Learner Select ───────────────────────────────────────

function renderLearnerSelect() {
  const learners = Storage.getLearners();
  const list = document.getElementById('learner-list');
  const hint = document.getElementById('no-learner-hint');

  if (!list) return;

  if (learners.length === 0) {
    list.innerHTML = '';
    if (hint) hint.style.display = 'block';
  } else {
    if (hint) hint.style.display = 'none';
    list.innerHTML = learners.map(l => {
      return `<div class="learner-card card" data-id="${l.id}">
        <div class="learner-card-avatar">📖</div>
        <div class="learner-card-name">${escHtml(l.name)}</div>
        <div class="learner-card-stars">⭐ ${l.stars}</div>
      </div>`;
    }).join('');

    list.querySelectorAll('.learner-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const learner = Storage.getLearner(id);
        if (!learner) return;
        AppState.currentLearner = learner;
        showView('view-home');
        renderHome();
      });
    });
  }
}

function initLearnerSelectView() {
  const btnAdd = document.getElementById('btn-add-learner');
  const form = document.getElementById('add-learner-form');
  const btnConfirm = document.getElementById('btn-confirm-add-learner');
  const btnCancel = document.getElementById('btn-cancel-add-learner');
  const nameInput = document.getElementById('new-learner-name');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      form.style.display = 'block';
      btnAdd.style.display = 'none';
      nameInput.value = '';
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) { showToast('請輸入名字', 'error'); return; }
      const learner = Storage.createLearner(name);
      form.style.display = 'none';
      btnAdd.style.display = '';
      renderLearnerSelect();
      showToast('學習者已建立！', 'success');
      // Auto-select
      AppState.currentLearner = learner;
      showView('view-home');
      renderHome();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      form.style.display = 'none';
      btnAdd.style.display = '';
    });
  }

  // Enter key on name input
  if (nameInput) {
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') btnConfirm && btnConfirm.click();
    });
  }
}

// ── View: Home ────────────────────────────────────────────────

function renderHome() {
  const learner = AppState.currentLearner;
  if (!learner) return;

  // Refresh learner data from storage
  const fresh = Storage.getLearner(learner.id);
  if (fresh) AppState.currentLearner = fresh;
  const l = AppState.currentLearner;

  const el = id => document.getElementById(id);

  const avatarEl = el('home-learner-avatar');
  if (avatarEl) avatarEl.textContent = '📖';

  const nameEl = el('home-learner-name');
  if (nameEl) nameEl.textContent = l.name;

  const starsEl = el('home-stars');
  if (starsEl) starsEl.textContent = '⭐ ' + l.stars;

  const streakEl = el('home-streak');
  if (streakEl) streakEl.textContent = '🔥 連續 ' + (l.streak || 0) + ' 天';

  const tasks = Storage.getDailyTasks(l.id);
  const todayEl = el('home-today');
  if (todayEl) todayEl.textContent = '📖 今日 ' + (tasks.todayCorrect || 0) + ' 個';

  renderDailyTasksCard(tasks);
}

function renderDailyTasksCard(tasks) {
  const list = document.getElementById('daily-tasks-list');
  if (!list) return;

  const items = [
    { key: 'complete5min', label: '完成一次遊戲', done: tasks.complete5min },
    { key: 'correct10', label: '答對10題', done: tasks.correct10 },
    { key: 'review5words', label: '完成一次複習', done: tasks.review5words }
  ];

  list.innerHTML = items.map(item => `
    <div class="task-item ${item.done ? 'task-done' : ''}">
      <span class="task-check">${item.done ? '✅' : '⬜'}</span>
      <span class="task-label">${item.label}</span>
    </div>
  `).join('');
}

function initHomeView() {
  document.getElementById('btn-change-learner').addEventListener('click', () => {
    AppState.currentLearner = null;
    renderLearnerSelect();
    showView('view-learner-select');
  });

  document.getElementById('btn-start-game').addEventListener('click', async () => {
    if (!AppState.currentLearner) return;
    const btn = document.getElementById('btn-start-game');
    btn.disabled = true;
    btn.textContent = '⏳ 載入中...';
    try {
      const words = await DataManager.loadWordsForLearner(AppState.currentLearner);
      if (!words || words.length < 4) {
        showToast('單字不足，請確認課程資料', 'error');
        btn.disabled = false;
        btn.textContent = '🎮 開始5分鐘';
        return;
      }
      AppState.gameWords = words;
      openDurationModal();
    } catch (e) {
      showToast('載入失敗：' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🎮 開始遊戲';
    }
  });

  document.getElementById('btn-start-exam').addEventListener('click', () => {
    if (!AppState.currentLearner) return;
    openExamCourseModal();
  });

  document.getElementById('btn-parent-mode').addEventListener('click', () => {
    showView('view-parent');
    renderParentView();
  });

  document.getElementById('btn-go-courses').addEventListener('click', () => {
    showView('view-courses');
    renderCoursesView();
  });

  document.getElementById('btn-go-achievements').addEventListener('click', () => {
    showView('view-achievements');
    renderAchievementsView();
  });
}

// ── Duration Picker ───────────────────────────────────────────

function openDurationModal() {
  const modal = document.getElementById('duration-modal');
  if (modal) modal.style.display = 'flex';
}

function closeDurationModal() {
  const modal = document.getElementById('duration-modal');
  if (modal) modal.style.display = 'none';
}

function initDurationModal() {
  document.querySelectorAll('#duration-modal .duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const minRaw = parseInt(btn.dataset.min, 10) || 0;
      // 0 = 不限時
      AppState.gameDuration = minRaw > 0 ? Math.min(5, minRaw) * 60 : null;
      AppState.recentWrong = [];
      AppState.answerLocked = false;
      AppState.wasExam = false;
      closeDurationModal();
      showView('view-game');
      startGame();
    });
  });

  const closeBtn = document.getElementById('btn-close-duration');
  if (closeBtn) closeBtn.addEventListener('click', closeDurationModal);

  const modal = document.getElementById('duration-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeDurationModal();
    });
  }
}

// ── Exam Mode ─────────────────────────────────────────────────

function openExamCourseModal() {
  const modal = document.getElementById('exam-course-modal');
  const container = document.getElementById('exam-course-options');
  if (!modal || !container) return;

  const courses = DataManager.getAllCourses();
  container.innerHTML = courses.map(c =>
    `<label class="exam-course-item">
      <input type="checkbox" class="exam-course-cb" value="${escHtml(c.id)}">
      <span class="ecc-title">${escHtml(c.title)}</span>
    </label>`
  ).join('');

  updateExamSelectAllLabel();
  modal.style.display = 'flex';
}

// 全選／全不選切換：全部已勾選時再按取消全選，否則全選
function toggleExamSelectAll() {
  const container = document.getElementById('exam-course-options');
  if (!container) return;
  const cbs = Array.from(container.querySelectorAll('.exam-course-cb'));
  if (cbs.length === 0) return;
  const allChecked = cbs.every(cb => cb.checked);
  cbs.forEach(cb => { cb.checked = !allChecked; });
  updateExamSelectAllLabel();
}

// 依目前勾選狀態更新全選鈕文字
function updateExamSelectAllLabel() {
  const container = document.getElementById('exam-course-options');
  const btn = document.getElementById('btn-exam-select-all');
  if (!container || !btn) return;
  const cbs = Array.from(container.querySelectorAll('.exam-course-cb'));
  const allChecked = cbs.length > 0 && cbs.every(cb => cb.checked);
  btn.textContent = allChecked ? '取消全選' : '全選';
}

async function startExamFromSelection() {
  const container = document.getElementById('exam-course-options');
  const btn = document.getElementById('btn-start-exam-confirm');
  if (!container || !btn) return;

  const ids = Array.from(container.querySelectorAll('.exam-course-cb'))
    .filter(cb => cb.checked).map(cb => cb.value);
  if (ids.length === 0) { showToast('請至少選一個課程', 'warning'); return; }

  btn.disabled = true;
  btn.textContent = '⏳ 載入中...';
  try {
    // 合併所選課程單字，依 en 去重（避免跨課程重複字重複出題）
    const seen = new Set();
    const merged = [];
    for (const id of ids) {
      const course = await DataManager.loadCourse(id);
      if (!course || !Array.isArray(course.words)) continue;
      for (const w of course.words) {
        const key = (w.en || '').toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(w);
      }
    }
    if (merged.length < 4) {
      showToast('所選課程單字不足（需至少 4 字）', 'error');
      return;
    }
    AppState.gameWords = merged;
    closeExamCourseModal();
    showView('view-game');
    startExam();
  } catch (e) {
    showToast('載入失敗：' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '開始考試';
  }
}

function closeExamCourseModal() {
  const modal = document.getElementById('exam-course-modal');
  if (modal) modal.style.display = 'none';
}

function initExamCourseModal() {
  const closeBtn = document.getElementById('btn-close-exam-course');
  if (closeBtn) closeBtn.addEventListener('click', closeExamCourseModal);

  const confirmBtn = document.getElementById('btn-start-exam-confirm');
  if (confirmBtn) confirmBtn.addEventListener('click', startExamFromSelection);

  const selectAllBtn = document.getElementById('btn-exam-select-all');
  if (selectAllBtn) selectAllBtn.addEventListener('click', toggleExamSelectAll);

  // 手動勾選課程時同步全選鈕文字（全選/取消全選）
  const optContainer = document.getElementById('exam-course-options');
  if (optContainer) {
    optContainer.addEventListener('change', e => {
      if (e.target && e.target.classList.contains('exam-course-cb')) {
        updateExamSelectAllLabel();
      }
    });
  }

  const modal = document.getElementById('exam-course-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeExamCourseModal();
    });
  }
}

// ── View: Game ────────────────────────────────────────────────

function startGame() {
  AppState.reviewMode = false;
  AppState.examMode = false;
  AppState.pendingVariant = null;
  const learner = AppState.currentLearner;
  const duration = AppState.gameDuration; // null/0 = 不限時
  Game.init(learner, AppState.gameWords, {
    duration,
    onTick: (timeLeft) => {
      const timerEl = document.getElementById('game-timer');
      if (!timerEl) return;
      const state = Game.getState();
      timerEl.textContent = (state && state.unlimited) ? ('⏱ ' + formatTime(timeLeft)) : formatTime(timeLeft);
    },
    onEnd: (state) => {
      onGameEnd(state);
    }
  });

  // Reset UI
  const endBtn = document.getElementById('btn-end-game');
  if (endBtn) endBtn.style.display = '';
  const timerEl = document.getElementById('game-timer');
  if (timerEl) timerEl.textContent = duration ? formatTime(duration) : '⏱ 00:00';
  const starsEl = document.getElementById('game-stars');
  if (starsEl) starsEl.textContent = '0';
  const streakEl = document.getElementById('game-streak');
  if (streakEl) streakEl.textContent = '0';

  document.getElementById('game-feedback').innerHTML = '';

  Game.startTimer();
  nextQuestion();
}

function startExam() {
  AppState.reviewMode = false;
  AppState.examMode = true;
  AppState.answerLocked = false;
  AppState.selectedLetters = [];
  AppState.recentWrong = [];
  AppState.pendingVariant = null;

  const learner = AppState.currentLearner;
  Game.initExam(learner, AppState.gameWords, {
    onEnd: (state) => onExamEnd(state)
  });

  const starsEl = document.getElementById('game-stars');
  if (starsEl) starsEl.textContent = '0';
  const streakEl = document.getElementById('game-streak');
  if (streakEl) streakEl.textContent = '0';
  document.getElementById('game-feedback').innerHTML = '';

  const endBtn = document.getElementById('btn-end-game');
  if (endBtn) endBtn.style.display = '';

  updateExamHeader();
  nextQuestion();
}

function updateExamHeader() {
  const timerEl = document.getElementById('game-timer');
  if (!timerEl) return;
  const state = Game.getState();
  if (!state) return;
  timerEl.textContent = '📝 ' + state.examIndex + '/' + state.examTotal;
}

function startReviewGame() {
  AppState.reviewMode = true;
  AppState.answerLocked = false;
  AppState.selectedLetters = [];
  AppState.recentWrong = [];
  AppState.pendingVariant = null;

  const learner = AppState.currentLearner;
  Game.initReview(learner, AppState.gameWords, AppState.reviewWords, {
    onEnd: () => onReviewEnd()
  });

  // 複習模式無計時，計時器欄改顯示剩餘字數
  const starsEl = document.getElementById('game-stars');
  if (starsEl) starsEl.textContent = '0';
  const streakEl = document.getElementById('game-streak');
  if (streakEl) streakEl.textContent = '0';
  document.getElementById('game-feedback').innerHTML = '';

  const endBtn = document.getElementById('btn-end-game');
  if (endBtn) endBtn.style.display = 'none';

  updateReviewHeader();
  showView('view-game');
  nextQuestion();
}

function updateReviewHeader() {
  const timerEl = document.getElementById('game-timer');
  if (!timerEl) return;
  const state = Game.getState();
  const left = state && state.reviewRemaining ? state.reviewRemaining.length : 0;
  timerEl.textContent = '複習剩 ' + left;
}

function onReviewEnd() {
  const learner = AppState.currentLearner;
  AppState.reviewMode = false;

  // 完成一次複習 → 標記每日任務
  if (learner) {
    const tasks = Storage.getDailyTasks(learner.id);
    tasks.review5words = true;
    Storage.updateDailyTasks(learner.id, tasks);
    AppState.currentLearner = Storage.getLearner(learner.id);
  }

  showToast('🎉 複習完成！錯字全部答對了！', 'success');
  renderHome();
  showView('view-home');
}

function nextQuestion() {
  AppState.answerLocked = false;
  AppState.selectedLetters = [];

  // 有待出的變化型題目 → 先出它
  if (AppState.pendingVariant) {
    const vw = AppState.pendingVariant;
    AppState.pendingVariant = null;
    const vq = Game.generateQuestionForWord(vw);
    if (vq) {
      AppState.currentQuestion = vq;
      renderQuestion(vq);
      return;
    }
  }

  const question = Game.generateQuestion(AppState.recentWrong);
  if (!question) {
    showToast('無法生成題目', 'error');
    return;
  }
  AppState.currentQuestion = question;
  renderQuestion(question);
}

function renderQuestion(question) {
  const area = document.getElementById('game-question');
  if (!area) return;

  area.classList.remove('fade-in');
  void area.offsetWidth; // reflow
  area.classList.add('fade-in');

  switch (question.gameType) {
    case 'choice':
      renderChoiceQuestion(question, area);
      break;
    case 'listen':
      renderListenQuestion(question, area);
      Speech.speak(question.word.en);
      break;
    case 'spelling_click':
      renderSpellingClickQuestion(question, area);
      break;
    case 'spelling_type':
      renderSpellingTypeQuestion(question, area);
      break;
  }
}

function renderChoiceQuestion(question, area) {
  const { word, options } = question;
  area.innerHTML = `
    <div class="q-choice">
      <div class="q-zh">${escHtml(word.zh)}</div>
      <button class="btn-speak-inline" data-word="${escHtml(word.en)}">🔊 聽發音</button>
      <div class="game-options">
        ${options.map((opt, i) => {
          const letter = ['A', 'B', 'C', 'D'][i];
          return `<button class="btn btn-option" data-answer="${escHtml(opt.en.toLowerCase())}">
            <span class="opt-letter">${letter}</span>
            <span class="opt-text">${escHtml(opt.en)}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn btn-primary btn-choice-confirm" id="btn-choice-confirm">確定</button>
    </div>
  `;
  bindChoiceOptions(area, question);
}

function renderListenQuestion(question, area) {
  const { options } = question;
  area.innerHTML = `
    <div class="q-listen">
      <div class="q-listen-prompt">🔊 請選出你聽到的單字</div>
      <button class="btn btn-listen-again" id="btn-listen-again">🔊 再聽一次</button>
      <div class="game-options game-options-listen">
        ${options.map((opt, i) => {
          const letter = ['A', 'B', 'C', 'D'][i];
          return `<button class="btn btn-option" data-answer="${escHtml(opt.en.toLowerCase())}">
            <span class="opt-letter">${letter}</span>
            <span class="opt-text">${escHtml(opt.en)}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn btn-primary btn-choice-confirm" id="btn-choice-confirm">確定</button>
    </div>
  `;
  const btnAgain = document.getElementById('btn-listen-again');
  if (btnAgain) btnAgain.addEventListener('click', () => Speech.speak(question.word.en));
  bindChoiceOptions(area, question);
}

function renderSpellingClickQuestion(question, area) {
  const { word, shuffledLetters } = question;
  const wordLen = word.en.length;

  area.innerHTML = `
    <div class="q-spelling-click">
      <div class="q-zh">${escHtml(word.zh)}</div>
      <button class="btn-speak-inline" data-word="${escHtml(word.en)}">🔊</button>
      <div class="answer-slots" id="answer-slots">
        ${Array(wordLen).fill('<span class="answer-slot">_</span>').join('')}
      </div>
      <div class="letter-buttons" id="letter-buttons">
        ${shuffledLetters.map((l, i) =>
          `<button class="letter-btn" data-letter="${escHtml(l)}" data-idx="${i}">${escHtml(l.toUpperCase())}</button>`
        ).join('')}
      </div>
      <div class="spelling-actions">
        <button class="btn btn-secondary" id="btn-clear-spelling">✗ 清除</button>
        <button class="btn btn-primary" id="btn-confirm-spelling">✓ 確定</button>
      </div>
    </div>
  `;

  // Bind speak
  area.querySelector('.btn-speak-inline').addEventListener('click', () => Speech.speak(word.en));

  // Bind slots click (remove letter)
  bindSlotClicks();

  // Bind letter buttons
  bindLetterButtons(question);

  document.getElementById('btn-clear-spelling').addEventListener('click', () => {
    clearSpelling(question);
  });

  document.getElementById('btn-confirm-spelling').addEventListener('click', () => {
    if (AppState.answerLocked) return;
    if (AppState.selectedLetters.length < word.en.length) {
      showToast('請把字母排滿再確定', 'warning');
      return;
    }
    const answer = AppState.selectedLetters.map(s => s.letter).join('');
    submitAnswer(question, answer);
  });
}

function bindSlotClicks() {
  const slotsEl = document.getElementById('answer-slots');
  if (!slotsEl) return;
  slotsEl.addEventListener('click', e => {
    const slot = e.target.closest('.answer-slot.filled');
    if (!slot) return;
    const slotIdx = parseInt(slot.dataset.slotIdx);
    if (isNaN(slotIdx)) return;
    // Remove the letter at this position
    AppState.selectedLetters.splice(slotIdx, 1);
    // Re-enable the letter button
    const letterIdx = slot.dataset.letterIdx;
    if (letterIdx !== undefined) {
      const btn = document.querySelector(`.letter-btn[data-idx="${letterIdx}"]`);
      if (btn) btn.classList.remove('used');
    }
    updateAnswerSlots(AppState.currentQuestion);
  });
}

function bindLetterButtons(question) {
  const letterBtns = document.querySelectorAll('.letter-btn');
  letterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (AppState.answerLocked) return;
      if (btn.classList.contains('used')) return;
      const letter = btn.dataset.letter;
      const idx = btn.dataset.idx;
      const wordLen = question.word.en.length;
      if (AppState.selectedLetters.length >= wordLen) return;

      AppState.selectedLetters.push({ letter, btnIdx: idx });
      btn.classList.add('used');
      updateAnswerSlots(question);
      // 不自動送出，等使用者按「確定」，避免誤按
    });
  });
}

function updateAnswerSlots(question) {
  const slotsEl = document.getElementById('answer-slots');
  if (!slotsEl || !question) return;
  const wordLen = question.word.en.length;
  let html = '';
  for (let i = 0; i < wordLen; i++) {
    if (i < AppState.selectedLetters.length) {
      const sel = AppState.selectedLetters[i];
      html += `<span class="answer-slot filled" data-slot-idx="${i}" data-letter-idx="${sel.btnIdx}">${sel.letter.toUpperCase()}</span>`;
    } else {
      html += '<span class="answer-slot">_</span>';
    }
  }
  slotsEl.innerHTML = html;
}

function clearSpelling(question) {
  AppState.selectedLetters = [];
  // Re-enable all letter buttons
  document.querySelectorAll('.letter-btn').forEach(btn => btn.classList.remove('used'));
  updateAnswerSlots(question);
}

function renderSpellingTypeQuestion(question, area) {
  const { word } = question;
  area.innerHTML = `
    <div class="q-spelling-type">
      <div class="q-prompt">請輸入「<strong>${escHtml(word.zh)}</strong>」的英文：</div>
      <button class="btn-speak-inline" id="btn-type-speak">🔊 聽發音</button>
      <input type="text" id="spelling-type-input" class="spelling-type-input" placeholder="輸入英文..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <button class="btn btn-primary btn-spelling-confirm" id="btn-type-confirm">確定</button>
    </div>
  `;

  document.getElementById('btn-type-speak').addEventListener('click', () => Speech.speak(word.en));

  const input = document.getElementById('spelling-type-input');
  if (input) {
    input.focus();
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-type-confirm').click();
      }
    });
  }

  document.getElementById('btn-type-confirm').addEventListener('click', () => {
    if (AppState.answerLocked) return;
    const val = (input ? input.value : '').trim();
    if (!val) { showToast('請輸入答案', 'warning'); return; }
    submitAnswer(question, val);
  });

  // Bind inline speak buttons
  area.querySelectorAll('.btn-speak-inline').forEach(btn => {
    if (!btn.id) {
      btn.addEventListener('click', () => Speech.speak(btn.dataset.word || word.en));
    }
  });
}

function submitAnswer(question, userAnswer) {
  if (AppState.answerLocked) return;
  AppState.answerLocked = true;

  const result = Game.processAnswer(question, userAnswer);
  const state = Game.getState();

  // Update UI stats
  const starsEl = document.getElementById('game-stars');
  if (starsEl) starsEl.textContent = state.starsEarned;
  const streakEl = document.getElementById('game-streak');
  if (streakEl) streakEl.textContent = state.currentStreak;

  // 複習模式：更新剩餘字數，全部答對即結束
  if (AppState.reviewMode) {
    updateReviewHeader();
    const remaining = state.reviewRemaining ? state.reviewRemaining.length : 0;
    if (result.correct) {
      showFeedback(true, question.word);
      if (remaining === 0) {
        setTimeout(() => onReviewEnd(), 800);
      } else {
        setTimeout(() => nextQuestion(), 800);
      }
    } else {
      showFeedback(false, question.word);
      Speech.speak(question.word.en);
      setTimeout(() => nextQuestion(), 1200);
    }
    return;
  }

  // 考試模式：依序作答，不追問變化型，全部考完後顯示成績
  if (AppState.examMode) {
    updateExamHeader();
    const finished = state.examIndex >= state.examTotal;
    if (result.correct) {
      showFeedback(true, question.word);
    } else {
      showFeedback(false, question.word);
      Speech.speak(question.word.en);
    }
    setTimeout(() => {
      if (finished) {
        onExamEnd(Game.getState());
      } else {
        nextQuestion();
      }
    }, result.correct ? 800 : 1200);
    return;
  }

  // 原型題目結束後（不論對錯），若該字有變化型且本題非變化型，安排下一題出變化型
  if (question.word && question.word.variant && !question.word._isVariant) {
    const v = question.word.variant;
    const label = /ing$/.test(v) ? '進行式' : '複數';
    AppState.pendingVariant = {
      en: v,
      zh: (question.word.zh || '') + '（' + label + '）',
      emoji: '',
      _isVariant: true
    };
  }

  if (result.correct) {
    showFeedback(true, question.word);
    // Track recent correct for daily tasks
    if (!AppState.recentWrong.includes(result.wordKey)) {
      // It's a reviewed word if it was previously wrong
    }
    setTimeout(() => nextQuestion(), 800);
  } else {
    // Add to recentWrong for priority
    if (!AppState.recentWrong.includes(result.wordKey)) {
      AppState.recentWrong.push(result.wordKey);
    }
    showFeedback(false, question.word);
    Speech.speak(question.word.en);
    setTimeout(() => nextQuestion(), 1200);
  }
}

function showFeedback(correct, word) {
  const feedback = document.getElementById('game-feedback');
  if (!feedback) return;

  if (correct) {
    feedback.innerHTML = '<div class="feedback-correct">✨ 答對了！+1⭐</div>';
    feedback.className = 'game-feedback feedback-show-correct';
  } else {
    feedback.innerHTML = `<div class="feedback-wrong">✗ 正確答案：${escHtml(word.en)}</div>`;
    feedback.className = 'game-feedback feedback-show-wrong';
  }

  // Highlight option buttons
  const optBtns = document.querySelectorAll('.btn-option');
  optBtns.forEach(btn => {
    if (btn.dataset.answer === word.en.toLowerCase()) {
      btn.classList.add('option-correct');
    } else if (!correct && btn.classList.contains('option-selected')) {
      btn.classList.add('option-wrong');
    }
    btn.disabled = true;
  });

  setTimeout(() => {
    feedback.className = 'game-feedback';
    feedback.innerHTML = '';
  }, correct ? 800 : 1200);
}

function bindChoiceOptions(area, question) {
  const opts = area.querySelectorAll('.btn-option');
  opts.forEach(btn => {
    btn.addEventListener('click', () => {
      if (AppState.answerLocked) return;
      // 單選：清掉其他選取，只標記本選項（不直接送出，避免誤按）
      opts.forEach(b => b.classList.remove('option-selected'));
      btn.classList.add('option-selected');
    });
  });

  const confirmBtn = area.querySelector('#btn-choice-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (AppState.answerLocked) return;
      const selected = area.querySelector('.btn-option.option-selected');
      if (!selected) { showToast('請先選一個答案', 'warning'); return; }
      submitAnswer(question, selected.dataset.answer);
    });
  }

  // Bind inline speak buttons
  area.querySelectorAll('.btn-speak-inline').forEach(btn => {
    btn.addEventListener('click', () => Speech.speak(btn.dataset.word || question.word.en));
  });
}

function initGameView() {
  // Speech rate selector
  const rateSelect = document.getElementById('speech-rate');
  if (rateSelect) {
    rateSelect.addEventListener('change', () => {
      Speech.setRate(parseFloat(rateSelect.value));
    });
  }

  // 結算成績：手動結束（複習模式此鈕隱藏；一般遊戲/考試模式皆可提前結算）
  const btnEnd = document.getElementById('btn-end-game');
  if (btnEnd) {
    btnEnd.addEventListener('click', () => {
      if (AppState.reviewMode) return;
      Game.cleanup();
      if (AppState.examMode) {
        onExamEnd(Game.getState());
      } else {
        onGameEnd(Game.getState());
      }
    });
  }

  // Visibility change: pause/resume
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Game.pauseTimer();
    } else {
      Game.resumeTimer();
    }
  });
}

function onGameEnd(state) {
  const learner = AppState.currentLearner;
  if (!learner) return;

  AppState.wasExam = false;

  // Update streak
  const today = todayStr();
  const yesterday = yesterdayStr();
  let newStreak = 1;
  if (learner.lastStudyDate === yesterday) {
    newStreak = (learner.streak || 0) + 1;
  } else if (learner.lastStudyDate === today) {
    newStreak = learner.streak || 1;
  }

  // Update daily tasks
  const tasks = Storage.getDailyTasks(learner.id);
  tasks.complete5min = true;
  tasks.todayCorrect = (tasks.todayCorrect || 0) + state.totalCorrect;
  if (tasks.todayCorrect >= 10) tasks.correct10 = true;

  // Check task bonus
  const allTasksDone = tasks.complete5min && tasks.correct10 && tasks.review5words;
  let bonusStars = 0;
  const prevTasks = Storage.getDailyTasks(learner.id);
  const wasAllDone = prevTasks.complete5min && prevTasks.correct10 && prevTasks.review5words;
  if (allTasksDone && !wasAllDone) {
    bonusStars = 10;
  }

  const newStars = (learner.stars || 0) + state.starsEarned + bonusStars;

  Storage.updateDailyTasks(learner.id, tasks);
  Storage.updateLearner(learner.id, {
    stars: newStars,
    streak: newStreak,
    lastStudyDate: today
  });

  // Check achievements
  const freshLearner = Storage.getLearner(learner.id);
  AppState.currentLearner = freshLearner;
  checkAchievements(freshLearner, state);

  showView('view-result');
  renderResult(state, bonusStars, allTasksDone);
}

// ── Achievements ──────────────────────────────────────────────

const ACHIEVEMENTS_DEF = [
  {
    id: 'first_game',
    emoji: '🌟',
    title: '初學者',
    desc: '完成第一次遊戲',
    check: (learner, state) => state.complete5min || (learner.stars > 0)
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    title: '連續王',
    desc: '連續學習3天',
    check: (learner) => (learner.streak || 0) >= 3
  },
  {
    id: 'perfect',
    emoji: '💯',
    title: '完美',
    desc: '單次正確率100%',
    check: (learner, state) => state && state.totalAnswered > 0 && state.totalCorrect === state.totalAnswered
  },
  {
    id: 'stars50',
    emoji: '⭐',
    title: '星星收集者',
    desc: '累積50顆星',
    check: (learner) => (learner.stars || 0) >= 50
  },
  {
    id: 'mastery10',
    emoji: '📚',
    title: '單字達人',
    desc: '有10個單字 mastery=5',
    check: (learner) => {
      const wm = learner.wordMastery || {};
      return Object.values(wm).filter(m => m.mastery >= 5).length >= 10;
    }
  }
];

function checkAchievements(learner, state) {
  const unlocked = learner.achievements || [];
  const newUnlocked = [];

  for (const ach of ACHIEVEMENTS_DEF) {
    if (unlocked.includes(ach.id)) continue;
    if (ach.check(learner, state)) {
      newUnlocked.push(ach.id);
    }
  }

  if (newUnlocked.length > 0) {
    const allAch = [...unlocked, ...newUnlocked];
    Storage.updateLearner(learner.id, { achievements: allAch });
    AppState.currentLearner = Storage.getLearner(learner.id);

    // Show animation
    newUnlocked.forEach((id, i) => {
      const ach = ACHIEVEMENTS_DEF.find(a => a.id === id);
      if (!ach) return;
      setTimeout(() => {
        showToast(`🎉 成就解鎖：${ach.emoji} ${ach.title}！`, 'success');
      }, i * 800);
    });
  }
}

// ── View: Result ──────────────────────────────────────────────

function renderResult(state, bonusStars, allTasksDone) {
  const titleEl = document.getElementById('result-title');
  if (titleEl) titleEl.textContent = '🎉 今日完成！';

  const pct = state.totalAnswered > 0
    ? Math.round((state.totalCorrect / state.totalAnswered) * 100)
    : 0;

  const statsEl = document.getElementById('result-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="result-row">📝 答題：<strong>${state.totalAnswered}</strong> 題</div>
      <div class="result-row">✅ 答對：<strong>${state.totalCorrect}</strong> 題</div>
      <div class="result-row">📊 正確率：<strong>${pct}%</strong></div>
      <div class="result-row">⭐ 獲得 <strong>${state.starsEarned}</strong> 顆星</div>
      <div class="result-row">🔥 最長連續答對 <strong>${state.maxStreak}</strong> 題</div>
    `;
  }

  const wrongEl = document.getElementById('result-wrong-words');
  if (wrongEl) {
    if (state.wrongWords.length > 0) {
      const displayWrong = state.wrongWords.slice(0, 5);
      const wordItems = displayWrong.map(wk => {
        const w = AppState.gameWords.find(gw => gw.en.toLowerCase() === wk);
        return w ? `<span class="wrong-word-tag">${w.emoji || ''} ${w.en} / ${w.zh}</span>` : `<span class="wrong-word-tag">${wk}</span>`;
      });
      wrongEl.innerHTML = `<div class="wrong-words-title">📚 需要複習：</div>
        <div class="wrong-words-list">${wordItems.join('')}</div>
        <button class="btn btn-primary btn-review-wrong" id="btn-review-wrong">🔁 複習錯誤單字（${state.wrongWords.length}）</button>`;

      const rb = document.getElementById('btn-review-wrong');
      if (rb) {
        rb.addEventListener('click', () => {
          const rw = state.wrongWords
            .map(wk => AppState.gameWords.find(w => w.en.toLowerCase() === wk))
            .filter(Boolean);
          if (rw.length === 0) { showToast('找不到可複習的單字', 'error'); return; }
          AppState.reviewWords = rw;
          startReviewGame();
        });
      }
    } else {
      wrongEl.innerHTML = '<div class="all-correct-msg">🎉 全部答對！太厲害了！</div>';
    }
  }

  const bonusEl = document.getElementById('result-task-bonus');
  if (bonusEl) {
    if (allTasksDone && bonusStars > 0) {
      bonusEl.style.display = 'block';
      bonusEl.innerHTML = `🎉 今日任務完成！⭐ +${bonusStars}`;
    } else {
      bonusEl.style.display = 'none';
    }
  }
}

function onExamEnd(state) {
  AppState.examMode = false;
  AppState.wasExam = true;
  AppState.lastExamWords = AppState.gameWords;
  // 一題都沒作答就結算：不顯示（假的）全對結果，直接回首頁
  if (!state || state.totalAnswered === 0) {
    showToast('尚未作答，已離開考試', 'warning');
    renderHome();
    showView('view-home');
    return;
  }
  showView('view-result');
  renderExamResult(state);
}

function renderExamResult(state) {
  const titleEl = document.getElementById('result-title');
  if (titleEl) titleEl.textContent = '📝 考試結果';

  const pct = state.totalAnswered > 0
    ? Math.round((state.totalCorrect / state.totalAnswered) * 100)
    : 0;

  const statsEl = document.getElementById('result-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="result-row">📝 作答：<strong>${state.totalAnswered}</strong> / ${state.examTotal} 題</div>
      <div class="result-row">✅ 答對：<strong>${state.totalCorrect}</strong> 題</div>
      <div class="result-row">📊 正確率：<strong>${pct}%</strong></div>
    `;
  }

  const wrongEl = document.getElementById('result-wrong-words');
  if (wrongEl) {
    if (state.wrongWords.length > 0) {
      const wordItems = state.wrongWords.map(wk => {
        const w = AppState.gameWords.find(gw => gw.en.toLowerCase() === wk);
        return w ? `<span class="wrong-word-tag">${escHtml(w.en)} / ${escHtml(w.zh)}</span>` : `<span class="wrong-word-tag">${escHtml(wk)}</span>`;
      });
      wrongEl.innerHTML = `<div class="wrong-words-title">📚 答錯的單字：</div>
        <div class="wrong-words-list">${wordItems.join('')}</div>`;
    } else {
      wrongEl.innerHTML = '<div class="all-correct-msg">🎉 全部答對！太厲害了！</div>';
    }
  }

  const bonusEl = document.getElementById('result-task-bonus');
  if (bonusEl) bonusEl.style.display = 'none';
}

function initResultView() {
  document.getElementById('btn-play-again').addEventListener('click', async () => {
    if (!AppState.currentLearner) return;
    const btn = document.getElementById('btn-play-again');
    btn.disabled = true;
    btn.textContent = '⏳ 載入中...';
    try {
      if (AppState.wasExam) {
        AppState.gameWords = AppState.lastExamWords;
        showView('view-game');
        startExam();
      } else {
        const words = await DataManager.loadWordsForLearner(AppState.currentLearner);
        AppState.gameWords = words;
        AppState.recentWrong = [];
        AppState.answerLocked = false;
        showView('view-game');
        startGame();
      }
    } finally {
      btn.disabled = false;
      btn.textContent = '🔄 再來一次';
    }
  });

  document.getElementById('btn-go-home').addEventListener('click', () => {
    renderHome();
    showView('view-home');
  });
}

// ── View: Courses ─────────────────────────────────────────────

async function renderCoursesView() {
  const learner = AppState.currentLearner;
  if (!learner) return;

  const listEl = document.getElementById('courses-list');
  if (!listEl) return;

  listEl.innerHTML = '<p class="loading-hint">載入中...</p>';

  const wm = learner.wordMastery || {};
  // 只看該學習者範圍內的題庫（勾選的，或未勾選時的全部）
  const candidates = DataManager.getCoursesForLearner(learner);
  const shown = [];

  for (const c of candidates) {
    const course = await DataManager.loadCourse(c.id);
    if (!course || !Array.isArray(course.words)) continue;
    // 只顯示有學習紀錄的題庫（該題庫任一單字曾作答過）
    const hasRecord = course.words.some(w => wm[w.en.toLowerCase()]);
    if (!hasRecord) continue;
    const total = course.words.length;
    const studied = course.words.filter(w => {
      const m = wm[w.en.toLowerCase()];
      return m && m.mastery > 0;
    }).length;
    shown.push({ id: c.id, title: c.title, total, studied });
  }

  if (shown.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">還沒有學習紀錄，先玩一場遊戲吧！</p>';
    return;
  }

  listEl.innerHTML = shown.map(c => {
    const pct = c.total > 0 ? Math.round((c.studied / c.total) * 100) : 0;
    return `<div class="course-card card" data-course-id="${escHtml(c.id)}">
      <div class="course-title">${escHtml(c.title)}</div>
      <div class="course-meta">
        <span>${c.total} 個單字</span>
        <span>已學 ${c.studied} 個</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-label">${pct}%</div>
    </div>`;
  }).join('');

  listEl.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', () => {
      showCourseModal(card.dataset.courseId);
    });
  });
}

function showCourseModal(courseId) {
  const modal = document.getElementById('course-words-modal');
  const titleEl = document.getElementById('course-modal-title');
  const wordsEl = document.getElementById('course-modal-words');
  if (!modal) return;

  modal.style.display = 'flex';

  DataManager.loadCourse(courseId).then(course => {
    if (!course) {
      titleEl.textContent = '載入失敗';
      wordsEl.innerHTML = '<p>無法載入課程資料</p>';
      return;
    }
    titleEl.textContent = course.title || courseId;
    if (!Array.isArray(course.words) || course.words.length === 0) {
      wordsEl.innerHTML = '<p class="empty-hint">此課程暫無單字</p>';
      return;
    }
    const learner = AppState.currentLearner;
    const wm = learner ? (learner.wordMastery || {}) : {};

    wordsEl.innerHTML = `<div class="modal-word-list">
      ${course.words.map(w => {
        const m = wm[w.en.toLowerCase()] || { mastery: 0 };
        let stars = '<span class="star-rating">';
        for (let i = 0; i < 5; i++) stars += `<span class="star ${i < m.mastery ? 'star-on' : 'star-off'}">⭐</span>`;
        stars += '</span>';
        const variantTag = w.variant ? `<span class="mwr-variant">${escHtml(w.variant)}</span>` : '';
        return `<div class="modal-word-row">
          <span class="mwr-en">${escHtml(w.en)}${variantTag}</span>
          <span class="mwr-zh">${escHtml(w.zh)}</span>
          <span class="mwr-stars">${stars}</span>
        </div>`;
      }).join('')}
    </div>`;
  });
}

function initCoursesView() {
  document.getElementById('btn-courses-back').addEventListener('click', () => {
    showView('view-home');
  });

  document.getElementById('btn-close-course-modal').addEventListener('click', () => {
    document.getElementById('course-words-modal').style.display = 'none';
  });

  document.getElementById('course-words-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('course-words-modal')) {
      e.target.style.display = 'none';
    }
  });
}

// ── View: Achievements ────────────────────────────────────────

function renderAchievementsView() {
  const learner = AppState.currentLearner;
  if (!learner) return;

  const tasks = Storage.getDailyTasks(learner.id);
  const fullTasksEl = document.getElementById('daily-tasks-full');
  if (fullTasksEl) {
    const taskItems = [
      { label: '完成一次遊戲', done: tasks.complete5min },
      { label: `答對10題（目前：${tasks.todayCorrect || 0}）`, done: tasks.correct10 },
      { label: '完成一次複習', done: tasks.review5words }
    ];
    fullTasksEl.innerHTML = `<h3>🎯 今日任務</h3>
      ${taskItems.map(t => `
        <div class="task-item ${t.done ? 'task-done' : ''}">
          <span class="task-check">${t.done ? '✅' : '⬜'}</span>
          <span class="task-label">${t.label}</span>
        </div>`).join('')}`;
  }

  const achList = document.getElementById('achievements-list');
  if (achList) {
    const unlocked = learner.achievements || [];
    achList.innerHTML = ACHIEVEMENTS_DEF.map(ach => {
      const isDone = unlocked.includes(ach.id);
      return `<div class="achievement-badge ${isDone ? 'ach-unlocked' : 'ach-locked'}">
        <div class="ach-emoji">${ach.emoji}</div>
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.desc}</div>
        ${isDone ? '<div class="ach-done-tag">已獲得</div>' : '<div class="ach-locked-tag">未獲得</div>'}
      </div>`;
    }).join('');
  }
}

function initAchievementsView() {
  document.getElementById('btn-achievements-back').addEventListener('click', () => {
    showView('view-home');
  });
}

// ── View: Parent Mode ─────────────────────────────────────────

let _parentTab = 'learners';

function renderParentView() {
  renderParentTab(_parentTab);
}

function renderParentTab(tab) {
  _parentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const content = document.getElementById('parent-tab-content');
  if (!content) return;

  if (tab === 'learners') {
    renderParentLearnersTab(content);
  } else if (tab === 'courses') {
    renderParentCoursesTab(content);
  } else if (tab === 'settings') {
    renderParentSettingsTab(content);
  } else if (tab === 'stats') {
    renderParentStatsTab(content);
  }
}

// 題型代碼與顯示名稱
const QUESTION_TYPE_LABELS = {
  choice: '看中文選英文',
  listen: '聽音辨字',
  spelling_click: '拼字（點選）',
  spelling_type: '拼字（打字）'
};

function renderParentSettingsTab(content) {
  const learners = Storage.getLearners();
  let selectHtml = '<option value="">-- 選擇學習者 --</option>';
  learners.forEach(l => {
    selectHtml += `<option value="${escHtml(l.id)}">${escHtml(l.name)}</option>`;
  });

  content.innerHTML = `
    <div class="parent-section">
      <h3>遊戲設定</h3>
      <p class="hint-text" style="text-align:left;">為每個學習者自訂要出現的題庫與題型比例。</p>
      <select id="parent-settings-learner" class="input-field">
        ${selectHtml}
      </select>
      <div id="parent-settings-container"></div>
    </div>
  `;

  const sel = document.getElementById('parent-settings-learner');
  const container = document.getElementById('parent-settings-container');

  sel.addEventListener('change', () => {
    if (sel.value) {
      renderSettingsForm(container, sel.value);
    } else {
      container.innerHTML = '';
    }
  });

  if (AppState.currentLearner) {
    sel.value = AppState.currentLearner.id;
    sel.dispatchEvent(new Event('change'));
  }
}

function renderSettingsForm(container, learnerId) {
  const learner = Storage.getLearner(learnerId);
  if (!learner) { container.innerHTML = '<p class="empty-hint">找不到學習者</p>'; return; }

  const settings = Storage.getLearnerSettings(learnerId);
  const selectedSet = new Set(settings.selectedCourses || []);
  const qt = settings.questionTypes || {};
  const courses = DataManager.getAllCourses();

  const coursesHtml = courses.map(c => {
    const checked = selectedSet.has(c.id) ? 'checked' : '';
    return `<label class="settings-course-item">
      <input type="checkbox" class="settings-course-cb" value="${escHtml(c.id)}" ${checked}>
      <span class="scc-title">${escHtml(c.title)}</span>
    </label>`;
  }).join('');

  const typesHtml = Object.keys(QUESTION_TYPE_LABELS).map(type => {
    const val = qt[type];
    const v = (typeof val === 'number' && val >= 0) ? val : '';
    return `<div class="settings-type-row">
      <span class="str-label">${QUESTION_TYPE_LABELS[type]}</span>
      <input type="number" class="settings-type-weight input-field" data-type="${type}"
             min="0" max="10" step="1" value="${v}" placeholder="0">
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="settings-block card">
      <h4>要出現的題庫</h4>
      <p class="hint-text" style="text-align:left;">不勾選任何題庫 = 使用全部題庫。</p>
      <div class="settings-course-list">${coursesHtml || '<p class="empty-hint">尚無題庫</p>'}</div>
    </div>
    <div class="settings-block card">
      <h4>題型比例（權重）</h4>
      <p class="hint-text" style="text-align:left;">數字為出現權重，0 或空白 = 關閉該題型。全部留空 = 使用預設比例。</p>
      <div class="settings-type-list">${typesHtml}</div>
    </div>
    <button class="btn btn-primary" id="btn-save-settings">💾 儲存設定</button>
  `;

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const selectedCourses = Array.from(container.querySelectorAll('.settings-course-cb'))
      .filter(cb => cb.checked).map(cb => cb.value);

    const questionTypes = {};
    container.querySelectorAll('.settings-type-weight').forEach(inp => {
      const raw = inp.value.trim();
      if (raw === '') return;
      const n = Math.max(0, Math.min(10, Math.floor(Number(raw) || 0)));
      questionTypes[inp.dataset.type] = n;
    });

    const ok = Storage.updateLearnerSettings(learnerId, { selectedCourses, questionTypes });
    if (ok) {
      DataManager.invalidateCache();
      if (AppState.currentLearner && AppState.currentLearner.id === learnerId) {
        AppState.currentLearner = Storage.getLearner(learnerId);
      }
      showToast('設定已儲存', 'success');
    } else {
      showToast('儲存失敗', 'error');
    }
  });
}

function renderParentLearnersTab(content) {
  content.innerHTML = `
    <div class="parent-section">
      <h3>學習者管理</h3>
      <div id="parent-learner-container"></div>
      <div class="parent-add-learner card">
        <h4>新增學習者</h4>
        <input type="text" id="parent-new-name" class="input-field" placeholder="名字">
        <button class="btn btn-primary" id="btn-parent-add-learner">➕ 新增</button>
      </div>
    </div>
  `;

  ParentMode.renderLearnerList(document.getElementById('parent-learner-container'));
  bindParentLearnerEvents(content);

  document.getElementById('btn-parent-add-learner').addEventListener('click', () => {
    const name = document.getElementById('parent-new-name').value.trim();
    const learner = ParentMode.addLearner(name);
    if (learner) {
      showToast('學習者已新增', 'success');
      document.getElementById('parent-new-name').value = '';
      ParentMode.renderLearnerList(document.getElementById('parent-learner-container'));
      bindParentLearnerEvents(content);
    }
  });
}

function bindParentLearnerEvents(content) {
  const container = document.getElementById('parent-learner-container');
  if (!container) return;

  container.querySelectorAll('.btn-edit-learner').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const oldName = btn.dataset.name;
      const newName = prompt('輸入新名字：', oldName);
      if (newName === null) return;
      if (ParentMode.editLearnerName(id, newName)) {
        showToast('名字已更新', 'success');
        // Update currentLearner if same
        if (AppState.currentLearner && AppState.currentLearner.id === id) {
          AppState.currentLearner = Storage.getLearner(id);
        }
        ParentMode.renderLearnerList(container);
        bindParentLearnerEvents(content);
      }
    });
  });

  container.querySelectorAll('.btn-clear-learner').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (!confirm(`確定清除「${name}」的所有學習資料？\n\n包含：星星、連續天數、單字熟練度、答題紀錄、成就、每日任務。\n名字不會變動。\n\n此操作不可還原。`)) return;
      if (Storage.clearLearnerData(id)) {
        showToast(`✅ ${name} 的學習資料已清除`, 'success');
        if (AppState.currentLearner && AppState.currentLearner.id === id) {
          AppState.currentLearner = Storage.getLearner(id);
        }
        ParentMode.renderLearnerList(container);
        bindParentLearnerEvents(content);
      }
    });
  });

  container.querySelectorAll('.btn-delete-learner').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (!confirm(`確定刪除學習者「${name}」？此操作不可還原。`)) return;
      if (ParentMode.removeLearner(id)) {
        showToast('學習者已刪除', 'success');
        if (AppState.currentLearner && AppState.currentLearner.id === id) {
          AppState.currentLearner = null;
        }
        ParentMode.renderLearnerList(container);
        bindParentLearnerEvents(content);
      }
    });
  });
}

function renderParentCoursesTab(content) {
  content.innerHTML = `
    <div class="parent-section">
      <h3>課程管理</h3>
      <div id="parent-course-container"></div>
      <div class="parent-add-course card">
        <h4>新增自訂課程</h4>
        <input type="text" id="parent-course-title" class="input-field" placeholder="課程名稱">
        <label class="textarea-label">單字列表（每行一個，格式：英文 中文 emoji）：</label>
        <textarea id="parent-course-words" class="words-textarea" placeholder="例：\napple 蘋果 🍎\nbanana 香蕉 🍌\n或用逗號/Tab分隔"></textarea>
        <button class="btn btn-primary" id="btn-parent-add-course">➕ 新增課程</button>
      </div>
    </div>
  `;

  ParentMode.renderCourseList(document.getElementById('parent-course-container'));
  bindParentCourseEvents(content);

  document.getElementById('btn-parent-add-course').addEventListener('click', () => {
    const title = document.getElementById('parent-course-title').value.trim();
    const words = document.getElementById('parent-course-words').value;
    const course = ParentMode.addCourse(title, words);
    if (course) {
      showToast(`課程「${title}」已新增 (${course.words.length} 個單字)`, 'success');
      document.getElementById('parent-course-title').value = '';
      document.getElementById('parent-course-words').value = '';
      ParentMode.renderCourseList(document.getElementById('parent-course-container'));
      bindParentCourseEvents(content);
    }
  });
}

function bindParentCourseEvents(content) {
  const container = document.getElementById('parent-course-container');
  if (!container) return;

  container.querySelectorAll('.btn-delete-course').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      if (!confirm(`確定刪除課程「${title}」？`)) return;
      if (ParentMode.removeCourse(id)) {
        showToast('課程已刪除', 'success');
        ParentMode.renderCourseList(container);
        bindParentCourseEvents(content);
      }
    });
  });
}

function renderParentStatsTab(content) {
  const learners = Storage.getLearners();
  let selectHtml = '<option value="">-- 選擇學習者 --</option>';
  learners.forEach(l => {
    selectHtml += `<option value="${escHtml(l.id)}">${escHtml(l.name)}</option>`;
  });

  content.innerHTML = `
    <div class="parent-section">
      <h3>學習報告</h3>
      <select id="parent-stats-learner" class="input-field">
        ${selectHtml}
      </select>
      <div id="parent-stats-container" class="stats-container"></div>
    </div>
  `;

  const sel = document.getElementById('parent-stats-learner');
  const statsContainer = document.getElementById('parent-stats-container');
  sel.addEventListener('change', () => {
    if (sel.value) {
      ParentMode.renderStats(statsContainer, sel.value);
    } else {
      statsContainer.innerHTML = '';
    }
  });

  // Auto-select current learner
  if (AppState.currentLearner) {
    sel.value = AppState.currentLearner.id;
    sel.dispatchEvent(new Event('change'));
  }
}

function initParentView() {
  document.getElementById('btn-parent-back').addEventListener('click', () => {
    // 當前學習者已被刪除（或已無學習者）→ 回學習者選單並重繪，避免殘留舊畫面
    if (!AppState.currentLearner || !Storage.getLearner(AppState.currentLearner.id)) {
      AppState.currentLearner = null;
      renderLearnerSelect();
      showView('view-learner-select');
      return;
    }
    showView('view-home');
    renderHome();
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderParentTab(btn.dataset.tab);
    });
  });
}

// ── Bootstrap ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Init modules
  Speech.init();

  // 顯示版本號
  const verEl = document.getElementById('app-version');
  if (verEl) verEl.textContent = APP_VERSION;

  if (!Storage.isAvailable()) {
    showToast('⚠️ 無法使用本地儲存，進度將無法儲存', 'error');
  }

  // Init views
  initLearnerSelectView();
  initHomeView();
  initDurationModal();
  initExamCourseModal();
  initGameView();
  initResultView();
  initCoursesView();
  initAchievementsView();
  initParentView();

  // Load learners
  renderLearnerSelect();

  const learners = Storage.getLearners();
  if (learners.length === 0) {
    const hint = document.getElementById('no-learner-hint');
    if (hint) hint.style.display = 'block';
  }

  // Show initial view
  showView('view-learner-select');
});
