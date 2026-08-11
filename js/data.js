/**
 * data.js - 課程資料管理模組
 * 匯出為 DataManager 物件
 */
const DataManager = (() => {
  const BUILTIN_COURSES = [
    { id: 'grade3_lesson01', grade: 3, lesson: 1, title: '三年級 Lesson 1', file: 'data/grade3/lesson01.json' },
    { id: 'grade3_lesson02', grade: 3, lesson: 2, title: '三年級 Lesson 2', file: 'data/grade3/lesson02.json' },
    { id: 'grade5_lesson01', grade: 5, lesson: 1, title: '五年級 Lesson 1', file: 'data/grade5/lesson01.json' },
    { id: 'grade5_lesson02', grade: 5, lesson: 2, title: '五年級 Lesson 2', file: 'data/grade5/lesson02.json' }
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

  function getAllCoursesForGrade(grade) {
    const builtins = BUILTIN_COURSES.filter(c => c.grade === Number(grade));
    const customs = Storage.getCustomCourses().filter(c => c.grade === Number(grade));
    return [...builtins, ...customs];
  }

  function getAllCourses() {
    const customs = Storage.getCustomCourses();
    return [...BUILTIN_COURSES, ...customs];
  }

  async function loadWordsForLearner(learner) {
    const courses = getAllCoursesForGrade(learner.grade);
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
    getAllCoursesForGrade,
    getAllCourses,
    loadWordsForLearner,
    parseWordInput,
    invalidateCache
  };
})();
