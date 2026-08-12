/**
 * data.js - 課程資料管理模組
 * 匯出為 DataManager 物件
 */
const DataManager = (() => {
  const BUILTIN_COURSES = [
    { id: 'lesson01', title: 'Lesson 1', file: 'data/lesson01.json' },
    { id: 'lesson02', title: 'Lesson 2', file: 'data/lesson02.json' },
    { id: 'lesson03', title: 'Lesson 3', file: 'data/lesson03.json' },
    { id: 'lesson04', title: 'Lesson 4', file: 'data/lesson04.json' },
    { id: 'lesson05', title: 'Lesson 5', file: 'data/lesson05.json' },
    { id: 'lesson06', title: 'Lesson 6', file: 'data/lesson06.json' },
    { id: 'lesson07', title: 'Lesson 7', file: 'data/lesson07.json' },
    { id: 'lesson08', title: 'Lesson 8', file: 'data/lesson08.json' },
    { id: 'lesson09', title: 'Lesson 9', file: 'data/lesson09.json' },
    { id: 'lesson10', title: 'Lesson 10', file: 'data/lesson10.json' },
    { id: 'lesson11', title: 'Lesson 11', file: 'data/lesson11.json' },
    { id: 'lesson12', title: 'Lesson 12', file: 'data/lesson12.json' },
    { id: 'lesson13', title: 'Lesson 13', file: 'data/lesson13.json' }
  ];

  const _cache = {};

  async function loadCourse(courseId) {
    // 1. Check cache
    if (_cache[courseId]) return _cache[courseId];

    // 2. Check custom courses
    const customs = Storage.getCustomCourses();
    const custom = customs.find(c => c.id === courseId);
    if (custom) {
      _cache[courseId] = custom;
      return custom;
    }

    // 3. Check builtin and fetch JSON
    const meta = BUILTIN_COURSES.find(c => c.id === courseId);
    if (!meta) return null;

    try {
      const resp = await fetch(meta.file, { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const course = await resp.json();
      course.id = courseId;
      _cache[courseId] = course;
      return course;
    } catch (e) {
      console.error('載入課程失敗：', courseId, e);
      return null;
    }
  }

  function getAllCourses() {
    const customs = Storage.getCustomCourses();
    return [...BUILTIN_COURSES, ...customs];
  }

  function getCoursesForLearner(learner) {
    const settings = Storage.getLearnerSettings(learner.id);
    const selected = settings.selectedCourses || [];
    const all = getAllCourses();
    if (selected.length > 0) {
      // 只取仍存在的勾選題庫（避免已刪除的自訂課程殘留 id）
      const picked = all.filter(c => selected.includes(c.id));
      if (picked.length > 0) return picked;
    }
    // 空勾選或勾選的題庫都不存在 → 使用全部題庫
    return all;
  }

  async function loadWordsForLearner(learner) {
    const courses = getCoursesForLearner(learner);
    const allWords = [];
    const seenEn = new Set();

    for (const course of courses) {
      try {
        const loaded = await loadCourse(course.id);
        if (!loaded || !Array.isArray(loaded.words)) continue;
        for (const w of loaded.words) {
          const key = (w.en || '').toLowerCase();
          if (key && !seenEn.has(key)) {
            seenEn.add(key);
            allWords.push(w);
          }
        }
      } catch (e) {
        console.error('載入單字失敗：', course.id, e);
      }
    }

    return allWords;
  }

  function parseWordInput(text) {
    if (!text || !text.trim()) return [];
    const lines = text.split(/[\r\n]+/);
    const words = [];
    const seenEn = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Split by space, comma, or tab
      const parts = trimmed.split(/[\s,\t]+/).filter(Boolean);
      if (parts.length === 0) continue;

      const en = parts[0].trim().toLowerCase();
      const zh = parts[1] ? parts[1].trim() : '';
      const emoji = parts[2] ? parts[2].trim() : '';

      if (!en) continue;
      if (seenEn.has(en)) continue;
      seenEn.add(en);

      words.push({ en, zh, emoji, image: '' });
    }

    return words;
  }

  function invalidateCache() {
    for (const key in _cache) {
      delete _cache[key];
    }
  }

  return {
    loadCourse,
    getAllCourses,
    getCoursesForLearner,
    loadWordsForLearner,
    parseWordInput,
    invalidateCache
  };
})();
