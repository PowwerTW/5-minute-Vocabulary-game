/**
 * storage.js - localStorage 管理模組
 * 匯出為 Storage 物件
 */
const Storage = (() => {
  const KEY = 'vocab_game_data_v1';

  function isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { version: 1, learners: [], customCourses: [] };
      return JSON.parse(raw);
    } catch (e) {
      return { version: 1, learners: [], customCourses: [] };
    }
  }

  function _save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _genId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }

  function _todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // ── Learners ──────────────────────────────────────────────

  function getLearners() {
    return _load().learners || [];
  }

  function getLearner(id) {
    const data = _load();
    return (data.learners || []).find(l => l.id === id) || null;
  }

  function createLearner(name, grade) {
    const data = _load();
    const learner = {
      id: _genId('learner'),
      name: name.trim(),
      grade: Number(grade),
      stars: 0,
      streak: 0,
      lastStudyDate: null,
      achievements: [],
      wordMastery: {},
      dailyTasks: {}
    };
    data.learners = data.learners || [];
    data.learners.push(learner);
    _save(data);
    return learner;
  }

  function updateLearner(id, updates) {
    const data = _load();
    const idx = (data.learners || []).findIndex(l => l.id === id);
    if (idx === -1) return false;
    data.learners[idx] = Object.assign(data.learners[idx], updates);
    return _save(data);
  }

  function deleteLearner(id) {
    const data = _load();
    const before = (data.learners || []).length;
    data.learners = (data.learners || []).filter(l => l.id !== id);
    if (data.learners.length === before) return false;
    return _save(data);
  }

  function clearLearnerData(id) {
    const data = _load();
    const idx = (data.learners || []).findIndex(l => l.id === id);
    if (idx === -1) return false;
    // 保留名字和年級，清除所有學習資料
    data.learners[idx] = Object.assign(data.learners[idx], {
      stars: 0,
      streak: 0,
      lastStudyDate: null,
      achievements: [],
      wordMastery: {},
      dailyTasks: {}
    });
    return _save(data);
  }

  // ── Word Mastery ──────────────────────────────────────────

  function getWordMastery(learnerId, wordKey) {
    const learner = getLearner(learnerId);
    if (!learner) return _defaultMastery();
    const wm = (learner.wordMastery || {})[wordKey];
    return wm || _defaultMastery();
  }

  function _defaultMastery() {
    return {
      mastery: 0,
      correctCount: 0,
      wrongCount: 0,
      lastSeen: null,
      consecutiveCorrect: 0,
      weight: 5
    };
  }

  function updateWordMastery(learnerId, wordKey, isCorrect) {
    const data = _load();
    const idx = (data.learners || []).findIndex(l => l.id === learnerId);
    if (idx === -1) return false;

    const learner = data.learners[idx];
    learner.wordMastery = learner.wordMastery || {};

    const wm = learner.wordMastery[wordKey] || _defaultMastery();
    wm.lastSeen = new Date().toISOString();

    if (isCorrect) {
      wm.correctCount++;
      wm.consecutiveCorrect++;
      wm.mastery = Math.min(5, wm.mastery + 1);
      wm.weight = Math.max(1, wm.weight - 1);
    } else {
      wm.wrongCount++;
      wm.consecutiveCorrect = 0;
      wm.mastery = Math.max(0, wm.mastery - 1);
      wm.weight = Math.min(10, wm.weight + 3);
    }

    learner.wordMastery[wordKey] = wm;
    return _save(data);
  }

  // ── Custom Courses ────────────────────────────────────────

  function getCustomCourses() {
    return _load().customCourses || [];
  }

  function addCustomCourse(course) {
    const data = _load();
    data.customCourses = data.customCourses || [];
    if (!course.id) course.id = _genId('custom');
    data.customCourses.push(course);
    return _save(data);
  }

  function updateCustomCourse(id, updates) {
    const data = _load();
    const idx = (data.customCourses || []).findIndex(c => c.id === id);
    if (idx === -1) return false;
    data.customCourses[idx] = Object.assign(data.customCourses[idx], updates);
    return _save(data);
  }

  function deleteCustomCourse(id) {
    const data = _load();
    const before = (data.customCourses || []).length;
    data.customCourses = (data.customCourses || []).filter(c => c.id !== id);
    if (data.customCourses.length === before) return false;
    return _save(data);
  }

  // ── Daily Tasks ───────────────────────────────────────────

  function getDailyTasks(learnerId) {
    const learner = getLearner(learnerId);
    if (!learner) return _defaultTasks();
    const today = _todayStr();
    const tasks = learner.dailyTasks || {};
    if (tasks.date !== today) {
      return _defaultTasks(today);
    }
    return tasks;
  }

  function _defaultTasks(date) {
    return {
      date: date || _todayStr(),
      complete5min: false,
      correct10: false,
      review5words: false,
      todayCorrect: 0,
      todayReviewed: 0
    };
  }

  function updateDailyTasks(learnerId, tasks) {
    const data = _load();
    const idx = (data.learners || []).findIndex(l => l.id === learnerId);
    if (idx === -1) return false;
    data.learners[idx].dailyTasks = tasks;
    return _save(data);
  }

  return {
    isAvailable,
    getLearners,
    getLearner,
    createLearner,
    updateLearner,
    deleteLearner,
    clearLearnerData,
    getWordMastery,
    updateWordMastery,
    getCustomCourses,
    addCustomCourse,
    updateCustomCourse,
    deleteCustomCourse,
    getDailyTasks,
    updateDailyTasks
  };
})();
