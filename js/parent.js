/**
 * parent.js - 家長模式 UI 模組
 * 匯出為 ParentMode 物件
 */
const ParentMode = (() => {

  function _starsHtml(mastery) {
    let html = '<span class="star-rating">';
    for (let i = 0; i < 5; i++) {
      html += `<span class="star ${i < mastery ? 'star-on' : 'star-off'}">⭐</span>`;
    }
    return html + '</span>';
  }

  function _masteryStatus(mastery) {
    if (mastery < 2) return '🔴';
    if (mastery < 4) return '🟡';
    return '🟢';
  }

  // ── Render Functions ──────────────────────────────────────

  function renderLearnerList(container) {
    if (!container) return;
    const learners = Storage.getLearners();
    if (learners.length === 0) {
      container.innerHTML = '<p class="empty-hint">尚無學習者</p>';
      return;
    }

    let html = '<div class="parent-learner-list">';
    for (const l of learners) {
      html += `
        <div class="parent-learner-item card" data-id="${l.id}">
          <div class="pli-info">
            <span class="pli-avatar">📖</span>
            <span class="pli-name">${escHtml(l.name)}</span>
            <span class="pli-stars">⭐ ${l.stars}</span>
          </div>
          <div class="pli-actions">
            <button class="btn btn-sm btn-secondary btn-edit-learner" data-id="${l.id}" data-name="${escHtml(l.name)}">改名</button>
            <button class="btn btn-sm btn-warning btn-clear-learner" data-id="${l.id}" data-name="${escHtml(l.name)}">清除資料</button>
            <button class="btn btn-sm btn-danger btn-delete-learner" data-id="${l.id}" data-name="${escHtml(l.name)}">刪除</button>
          </div>
        </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderCourseList(container) {
    if (!container) return;
    const courses = DataManager.getAllCourses();
    const customs = Storage.getCustomCourses();
    const customIds = new Set(customs.map(c => c.id));

    if (courses.length === 0) {
      container.innerHTML = '<p class="empty-hint">尚無課程</p>';
      return;
    }

    let html = '<div class="parent-course-list">';
    for (const c of courses) {
      const isCustom = customIds.has(c.id);
      const known = Array.isArray(c.words) ? c.words.length : (typeof c.wordCount === 'number' ? c.wordCount : null);
      const countText = known !== null ? `${known} 個單字` : '載入中...';
      html += `
        <div class="parent-course-item card" data-id="${c.id}">
          <div class="pci-info">
            <span class="pci-title">${escHtml(c.title)}</span>
            <span class="pci-count" data-course-id="${escHtml(c.id)}">${countText}</span>
            ${isCustom ? '<span class="badge-custom">自訂</span>' : '<span class="badge-builtin">內建</span>'}
          </div>
          ${isCustom ? `<div class="pci-actions">
            <button class="btn btn-sm btn-danger btn-delete-course" data-id="${c.id}" data-title="${escHtml(c.title)}">刪除</button>
          </div>` : ''}
        </div>`;
    }
    html += '</div>';
    container.innerHTML = html;

    // 內建題庫未帶字數，非同步載入 JSON 後補上真實數字
    for (const c of courses) {
      if (Array.isArray(c.words) || typeof c.wordCount === 'number') continue;
      DataManager.loadCourse(c.id).then(loaded => {
        const span = container.querySelector(`.pci-count[data-course-id="${c.id}"]`);
        if (!span) return;
        span.textContent = (loaded && Array.isArray(loaded.words))
          ? `${loaded.words.length} 個單字` : '無法載入';
      });
    }
  }

  function renderWordList(container, courseId) {
    if (!container) return;
    container.innerHTML = '<p class="loading-hint">載入中...</p>';

    DataManager.loadCourse(courseId).then(course => {
      if (!course || !Array.isArray(course.words)) {
        container.innerHTML = '<p class="empty-hint">無法載入課程</p>';
        return;
      }
      let html = '<div class="word-list-table">';
      html += '<div class="wlt-header"><span>英文</span><span>中文</span><span>Emoji</span></div>';
      for (const w of course.words) {
        const variantTag = w.variant ? ` <span class="wlt-variant">(${escHtml(w.variant)})</span>` : '';
        html += `<div class="wlt-row">
          <span class="wlt-en">${escHtml(w.en)}${variantTag}</span>
          <span class="wlt-zh">${escHtml(w.zh)}</span>
          <span class="wlt-emoji">${w.emoji || ''}</span>
        </div>`;
      }
      html += '</div>';
      container.innerHTML = html;
    });
  }

  function renderStats(container, learnerId) {
    if (!container) return;
    const learner = Storage.getLearner(learnerId);
    if (!learner) {
      container.innerHTML = '<p class="empty-hint">找不到學習者</p>';
      return;
    }

    const wm = learner.wordMastery || {};
    const keys = Object.keys(wm);

    if (keys.length === 0) {
      container.innerHTML = '<p class="empty-hint">尚未有學習紀錄</p>';
      return;
    }

    // Build a table of all studied words
    let html = `<h4>${escHtml(learner.name)} 的單字學習紀錄</h4>`;
    html += '<div class="stats-table">';
    html += `<div class="st-header">
      <span>英文</span><span>熟練度</span><span>答對</span><span>答錯</span><span>正確率</span><span>狀態</span>
    </div>`;

    for (const key of keys.sort()) {
      const m = wm[key];
      const total = m.correctCount + m.wrongCount;
      const pct = total > 0 ? Math.round((m.correctCount / total) * 100) : 0;
      html += `<div class="st-row">
        <span class="st-en">${escHtml(key)}</span>
        <span class="st-stars">${_starsHtml(m.mastery)}</span>
        <span class="st-correct">${m.correctCount}</span>
        <span class="st-wrong">${m.wrongCount}</span>
        <span class="st-pct">${pct}%</span>
        <span class="st-status">${_masteryStatus(m.mastery)}</span>
      </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ── Actions ───────────────────────────────────────────────

  function addLearner(name) {
    const n = (name || '').trim();
    if (!n) { showToast('請輸入名字', 'error'); return null; }
    if (n.length > 20) { showToast('名字太長（最多20字）', 'error'); return null; }
    return Storage.createLearner(n);
  }

  function editLearnerName(id, newName) {
    const n = (newName || '').trim();
    if (!n) { showToast('名字不可為空', 'error'); return false; }
    if (n.length > 20) { showToast('名字太長（最多20字）', 'error'); return false; }
    return Storage.updateLearner(id, { name: n });
  }

  function removeLearner(id) {
    return Storage.deleteLearner(id);
  }

  function addCourse(title, wordsText) {
    const t = (title || '').trim();
    if (!t) { showToast('請輸入課程名稱', 'error'); return null; }
    const words = DataManager.parseWordInput(wordsText || '');
    if (words.length === 0) { showToast('請輸入至少一個單字', 'error'); return null; }

    const course = {
      id: 'custom_' + Date.now(),
      title: t,
      words,
      wordCount: words.length
    };
    const ok = Storage.addCustomCourse(course);
    if (ok) {
      DataManager.invalidateCache();
      return course;
    }
    return null;
  }

  function removeCourse(id) {
    const ok = Storage.deleteCustomCourse(id);
    if (ok) DataManager.invalidateCache();
    return ok;
  }

  function addWordsToCourse(courseId, wordsText) {
    const newWords = DataManager.parseWordInput(wordsText || '');
    if (newWords.length === 0) { showToast('未解析到有效單字', 'error'); return false; }

    const customs = Storage.getCustomCourses();
    const course = customs.find(c => c.id === courseId);
    if (!course) { showToast('找不到課程', 'error'); return false; }

    const existing = new Set((course.words || []).map(w => w.en.toLowerCase()));
    const toAdd = newWords.filter(w => !existing.has(w.en.toLowerCase()));
    if (toAdd.length === 0) { showToast('單字已全部存在', 'warning'); return false; }

    course.words = [...(course.words || []), ...toAdd];
    course.wordCount = course.words.length;
    const ok = Storage.updateCustomCourse(courseId, { words: course.words, wordCount: course.wordCount });
    if (ok) DataManager.invalidateCache();
    return ok;
  }

  // ── Helper ────────────────────────────────────────────────

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    renderLearnerList,
    renderCourseList,
    renderWordList,
    renderStats,
    addLearner,
    editLearnerName,
    removeLearner,
    addCourse,
    removeCourse,
    addWordsToCourse
  };
})();
