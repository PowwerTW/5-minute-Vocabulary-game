/**
 * data.js - 課程資料管理模組
 * 匯出為 DataManager 物件
 */
const DataManager = (() => {
  const BUILTIN_COURSES = [
    { id: 'lesson01', title: '01_蘋果apple', file: 'data/lesson01.json' },
    { id: 'lesson02', title: '02_狗dog', file: 'data/lesson02.json' },
    { id: 'lesson03', title: '03_山羊goat', file: 'data/lesson03.json' },
    { id: 'lesson04', title: '04_噴射機jet', file: 'data/lesson04.json' },
    { id: 'lesson05', title: '05_猴子monkey', file: 'data/lesson05.json' },
    { id: 'lesson06', title: '06_豬pig', file: 'data/lesson06.json' },
    { id: 'lesson07', title: '07_蛇snake', file: 'data/lesson07.json' },
    { id: 'lesson08', title: '08_小提琴violin', file: 'data/lesson08.json' },
    { id: 'lesson09', title: '09_溜溜球yo-yo', file: 'data/lesson09.json' },
    { id: 'lesson10', title: '10_男孩boy', file: 'data/lesson10.json' },
    { id: 'lesson11', title: '11_爺爺grandfather', file: 'data/lesson11.json' },
    { id: 'lesson12', title: '12_一one', file: 'data/lesson12.json' },
    { id: 'lesson13', title: '13_難過的sad', file: 'data/lesson13.json' },
    { id: 'lesson14', title: '14_書包school bag', file: 'data/lesson14.json' },
    { id: 'lesson15', title: '15_紅色red', file: 'data/lesson15.json' },
    { id: 'lesson16', title: '16_外套coat', file: 'data/lesson16.json' },
    { id: 'lesson17', title: '17_貓cat', file: 'data/lesson17.json' },
    { id: 'lesson18', title: '18_餓hungry', file: 'data/lesson18.json' },
    { id: 'lesson19', title: '19_門door', file: 'data/lesson19.json' },
    { id: 'lesson20', title: '20_十一eleven', file: 'data/lesson20.json' },
    { id: 'lesson21', title: '21_泰迪熊teddy bear', file: 'data/lesson21.json' },
    { id: 'lesson22', title: '22_木瓜papayas', file: 'data/lesson22.json' },
    { id: 'lesson23', title: '23_橘子oranges', file: 'data/lesson23.json' },
    { id: 'lesson24', title: '24_跳躍jump', file: 'data/lesson24.json' },
    { id: 'lesson25', title: '25_在…上面on', file: 'data/lesson25.json' },
    { id: 'lesson26', title: '26_浴室bathroom', file: 'data/lesson26.json' },
    { id: 'lesson27', title: '27_鸚鵡parrot', file: 'data/lesson27.json' },
    { id: 'lesson28', title: '28_魚fish', file: 'data/lesson28.json' },
    { id: 'lesson29', title: '29_漢堡hamburger', file: 'data/lesson29.json' },
    { id: 'lesson30', title: '30_牛奶milk', file: 'data/lesson30.json' },
    { id: 'lesson31', title: '31_滑板skateboard', file: 'data/lesson31.json' },
    { id: 'lesson32', title: '32_頭head', file: 'data/lesson32.json' },
    { id: 'lesson33', title: '33_頭髮hair', file: 'data/lesson33.json' },
    { id: 'lesson34', title: '34_籃球basketball', file: 'data/lesson34.json' },
    { id: 'lesson35', title: '35_放風箏fly a kite', file: 'data/lesson35.json' },
    { id: 'lesson36', title: '36_晴天的sunny', file: 'data/lesson36.json' },
    { id: 'lesson37', title: '37_起床get up', file: 'data/lesson37.json' },
    { id: 'lesson38', title: '38_高鐵HSR', file: 'data/lesson38.json' },
    { id: 'lesson39', title: '39_飛機airplane', file: 'data/lesson39.json' },
    { id: 'lesson40', title: '40_早上morning', file: 'data/lesson40.json' },
    { id: 'lesson41', title: '41_吃eat', file: 'data/lesson41.json' },
    { id: 'lesson42', title: '42_梳頭髮comb my hair', file: 'data/lesson42.json' },
    { id: 'lesson43', title: '43_消防局fire station', file: 'data/lesson43.json' },
    { id: 'lesson44', title: '44_博物館museum', file: 'data/lesson44.json' },
    { id: 'lesson45', title: '45_店員clerk', file: 'data/lesson45.json' },
    { id: 'lesson46', title: '46_第一的first', file: 'data/lesson46.json' },
    { id: 'lesson47', title: '47_一月January', file: 'data/lesson47.json' },
    { id: 'lesson48', title: '48_中文Chinese', file: 'data/lesson48.json' },
    { id: 'lesson49', title: '49_總是always', file: 'data/lesson49.json' },
    { id: 'lesson50', title: '50_春天spring', file: 'data/lesson50.json' },
    { id: 'lesson51', title: '51_洗衣服do the laundry', file: 'data/lesson51.json' },
    { id: 'lesson52', title: '52_一次once', file: 'data/lesson52.json' },
    { id: 'lesson53', title: '53_牛仔褲jeans', file: 'data/lesson53.json' },
    { id: 'lesson54', title: '54_六十sixty', file: 'data/lesson54.json' }
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
