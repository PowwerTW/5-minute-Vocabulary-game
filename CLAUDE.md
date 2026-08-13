# CLAUDE.md — 開發者導引

本檔為開發者與 AI 助手在此專案工作時的技術參考，與程式碼庫同步。

## 專案概述

**英文小高手** — 5 分鐘英文單字複習遊戲，純前端 SPA，零後端、零建置工具。適合國小英語單字練習。直接以瀏覽器開啟 `index.html` 即可執行，或部署至 GitHub Pages。

- 技術：原生 HTML / CSS / JavaScript（無框架、無打包器、無相依套件）
- 資料儲存：瀏覽器 `localStorage`（key：`vocab_game_data_v1`）
- 發音：瀏覽器內建 Web Speech API（`speechSynthesis`）
- 課程資料：`data/lessonNN.json`（攤平，不分年級），以 `fetch` 載入
- **無年級概念**：學習者只選課程；題型、題庫皆可個人化設定
- 版本號：單一來源 `APP_VERSION`（`js/app.js` 頂端），首頁自動顯示

## 架構

單頁多視圖（View）切換，全部 View 定義在 `index.html`，以 CSS class `active` 控制顯示。模組皆為 IIFE，掛在全域物件上，依 `index.html` 底部 `<script>` 順序載入。

| 檔案 | 全域物件 | 職責 |
|------|----------|------|
| `js/storage.js` | `Storage` | localStorage 讀寫：學習者、單字熟練度、自訂課程、每日任務 |
| `js/speech.js` | （語音模組） | Web Speech API 封裝，優先選高品質 en-US 語音 |
| `js/data.js` | `DataManager` | 課程載入/快取、依學習者設定取單字、貼上文字解析 |
| `js/game.js` | `Game` | 一般／複習／考試三種模式：狀態、計時器、加權選題、出題、判分、變化型追問 |
| `js/parent.js` | `ParentMode` | 學習者管理、自訂課程、學習報告、清除資料（渲染輔助） |
| `js/app.js` | （主控制器） | View 切換、事件綁定、串接各模組 |

**載入順序有相依性**：`storage` → `speech` → `data` → `game` → `parent` → `app`。`DataManager` 依賴 `Storage`，`Game` 依賴 `Storage`，不可調換。

## 核心資料模型

`localStorage` 單一 key（`vocab_game_data_v1`）存整包 JSON：

```
{ version, learners:[ { id, name, stars, streak, lastStudyDate,
                        achievements, wordMastery:{}, dailyTasks:{},
                        settings:{ selectedCourses:[], questionTypes:{} } } ],
  customCourses:[ { id, title, words:[...] } ] }
```

（舊資料殘留的 `learner.grade` / `course.grade` 欄位會被忽略，不影響運作。）

單字熟練度（`wordMastery[wordKey]`）：`{ mastery(0-5), correctCount, wrongCount, lastSeen, consecutiveCorrect, weight(1-10) }`。

學習者設定（`settings`，見 `storage.js:getLearnerSettings`/`updateLearnerSettings`）：
- `selectedCourses`：勾選的題庫 id 陣列。**空陣列 = 使用全部題庫**（向後相容）。
- `questionTypes`：`{ 題型: 權重 }`，權重 0 或未列 = 關閉。**全空 = 使用通用預設比例**。

## 選題演算法（間隔複習）

`game.js:_selectNextWord` 以加權隨機挑字：

- 基礎 `weight`（預設 5）
- 最近答錯：+5
- 超過 24 小時未見（含從未見）：+2
- `mastery >= 5`：-3（最低 1）

答對 `weight -1`、`mastery +1`；答錯 `weight +3`、`mastery -1`（見 `storage.js:updateWordMastery`）。

## 題型比例（`game.js:_getGameTypes`）

先讀學習者 `settings.questionTypes` 權重建題型池；若未設定或全為 0，才落回通用預設：

- 通用預設：choice 20% / listen 30% / spelling_click 30% / spelling_type 20%

題型代碼：`choice`、`listen`、`spelling_click`、`spelling_type`。不分年級。

## 題庫選取（`data.js:getCoursesForLearner`）

`loadWordsForLearner` 依 `settings.selectedCourses` 取字：有勾選且題庫仍存在 → 只用勾選的；否則使用全部題庫。

## 變化型追問（`game.js` + `app.js`）

單字可帶 `variant`（複數/進行式拼法，如 `arm→arms`、`eat→eating`）。一般遊戲中，某字的原型題目答完後（不論對錯），`app.js:submitAnswer` 會把該字變化型排入 `AppState.pendingVariant`，`nextQuestion` 優先出這題。變化型題目提示為 `中文（複數/進行式）`（依 variant 是否 `ing` 結尾判斷），答案為變化拼法，共用同一套題型流程（`Game.generateQuestionForWord`）。複習模式不觸發追問。

## 複習模式（`game.js:initReview`）

一般遊戲結算後，可用答錯的字另開一場複習回合（無計時）：`_selectNextWord` 從 `reviewRemaining` 挑字，答對移除、答錯保留，清空即通過並標記「完成一次複習」每日任務。選擇題誘答選項仍取自完整題庫，避免錯字太少湊不出四選項。

## 遊戲時間（含不限時）

首頁「開始遊戲」→ 選擇遊戲時間彈窗（`#duration-modal`）：1–5 分鐘或「⏱ 不限時」。`AppState.gameDuration` 為秒數，`null` 代表不限時。`Game.init` 依此設定 `_state.unlimited`：不限時時計時器改為往上累計（`startTimer` 內 `_state.timeLeft++`），不會自動結束，需按「🏁 結算成績」手動結算。

## 考試模式（`game.js:initExam`）

首頁「📝 考試模式」→ 選擇要考的課程（`#exam-course-modal`，列出 `DataManager.getAllCourses()`，含內建與自訂課程）→ 該課程單字洗牌後依序出題，每字僅出現一次、不限時、不觸發變化型追問，出完顯示成績（`renderExamResult`），**沒有複習模式**。誘答選項僅取自該課程本身（見 `Game.initExam` 的 `examWords`），因此課程單字需 ≥4 個才能進入考試。考試不影響星星、連續天數、每日任務與成就，但仍會更新單字熟練度（`Storage.updateWordMastery`）。結果頁的「再來一次」會依 `AppState.wasExam` 判斷要重新開始同一場考試或一般遊戲。

## 課程資料格式

`data/lessonNN.json`（攤平於 `data/`，不分年級；目前 `lesson01`–`lesson13`）：

```json
{ "title": "Lesson 3",
  "words": [ {"en":"arm","zh":"手臂","emoji":"","variant":"arms"} ] }
```

- `en`：拼字答案（片語保留空格，專有名詞/縮寫保留大小寫）。
- `emoji`：一律空字串（遊戲不顯示 emoji）。
- `variant`：複數/進行式拼法，無則空字串；有值時觸發變化型追問。

新增內建課程：加 JSON 檔 → 在 `js/data.js` 的 `BUILTIN_COURSES` 陣列註冊。家長模式亦可線上新增自訂課程（存 localStorage）。

## 開發慣例

- 原生 JS，ES6+，模組用 IIFE + 全域物件匯出，勿引入框架或打包器（保持零建置）。
- 檔案編碼 **UTF-8**（無 BOM），中文介面。
- `fetch` 課程一律帶 `cache: 'no-store'` 避免瀏覽器快取舊課程。
- 出題不顯示 emoji，避免看圖猜答案。
- 所有語言/介面文字繁體中文。

## 執行與部署

- 本機：直接開 `index.html`（`fetch` 課程需經 HTTP，建議起簡易伺服器如 `python -m http.server`，`file://` 下 fetch 可能受限）。
- 部署：GitHub Pages，Branch `main`、資料夾 `/ (root)`。詳見 `README.md`。

## 相關文件

- `README.md` — 對外介紹、部署、新增課程說明
- `CHANGELOG.md` — 版本變更紀錄
