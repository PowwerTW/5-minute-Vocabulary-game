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
| `js/speech.js` | （語音模組） | Web Speech API 封裝，優先選高品質 en-US 語音；行動裝置手勢解鎖與 resume() |
| `js/sound.js` | `Sound` | Web Audio API 合成音效（答對／答錯／點選 tick），無外部音檔；開關存 localStorage |
| `js/data.js` | `DataManager` | 課程載入/快取、依學習者設定取單字、貼上文字解析 |
| `js/game.js` | `Game` | 一般／複習／考試三種模式：狀態、計時器、加權選題、出題、判分、變化型追問 |
| `js/parent.js` | `ParentMode` | 學習者管理、自訂課程、學習報告、清除資料（渲染輔助） |
| `js/app.js` | （主控制器） | View 切換、事件綁定、串接各模組 |

**載入順序有相依性**：`storage` → `speech` → `sound` → `data` → `game` → `parent` → `app`。`DataManager` 依賴 `Storage`，`Game` 依賴 `Storage`，不可調換。`Sound` 無相依，位置僅需在 `app` 之前。

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

首頁「📝 考試模式」→ 勾選要考的課程（`#exam-course-modal`，可複選，列出 `DataManager.getAllCourses()`，含內建與自訂課程；上方「全選」鈕可一鍵全選/取消全選，見 `app.js:toggleExamSelectAll`／`updateExamSelectAllLabel`）→ 按「開始考試」（`app.js:startExamFromSelection`）合併所有勾選課程的單字、依 `en` 去重，洗牌後依序出題，每字僅出現一次、不限時、不觸發變化型追問，出完顯示成績（`renderExamResult`），**沒有複習模式**。**單場最多出題 `EXAM_MAX_QUESTIONS`（50）題**：合併去重後單字超過 50 個時，`Game.initExam` 洗牌後 `.slice(0, 50)` 只取前 50 題，`_state.examTotal` 亦以實際出題數計。誘答選項僅取自本次合併後的完整單字集合（`_allWords` 保留全部，見 `Game.initExam` 的 `examWords`），因此勾選課程合併後單字需 ≥4 個才能進入考試。考試不影響星星、連續天數、每日任務與成就，但仍會更新單字熟練度（`Storage.updateWordMastery`）。一題都沒作答就按「🏁 結算成績」時，`app.js:onExamEnd` 以 `totalAnswered === 0` 守衛擋掉：不顯示（假的）全對結果，改提示後直接回首頁。結果頁的「再來一次」會依 `AppState.wasExam` 判斷要重新開始同一場考試或一般遊戲。

## 作答確認（防誤按）

選擇題、聽力題、拼字（點選）三種題型都不會「一點選就送出」，而是先標記選取狀態（`.option-selected` / 已選字母），使用者按下畫面上的「確定」鈕（`#btn-choice-confirm` / `#btn-confirm-spelling`）才會判分（`bindChoiceOptions`、`renderSpellingClickQuestion` 內的確定鈕事件）。拼字（打字）本來就是輸入完按確定，不受影響。

## 音效（`js/sound.js`）

`Sound` 以 Web Audio API 即時合成三種音效，**不含任何外部音檔**（維持零素材、零建置）：`correct()` 上行雙音、`wrong()` 低沉下行、`click()` 短促 tick，皆帶淡入淡出包絡避免爆音。

- **全站點選音效**：`app.js` 在 `DOMContentLoaded` 於 `document` 委派一個 click，任一 `<button>` 被點到即 `Sound.click()`，涵蓋所有頁面與彈窗、含日後新增按鈕；答題鎖定後選項鈕會 `disabled`，disabled 按鈕不觸發 click，故不會誤響。因為改用全域委派，個別按鈕（選項、字母鈕、首頁按鈕）**不可**再各自呼叫 `Sound.click()`，否則同一次點擊會重複播放。
- **答對／答錯音**：於 `app.js:showFeedback`（一般／複習／考試共用進入點）串接 `Sound.correct()` / `Sound.wrong()`。
- **打字題 tick**：拼字（打字）輸入框 `#spelling-type-input` 綁 `input` 事件逐字（含刪字）播 tick。
- **開關**：遊戲畫面 🔊/🔇 切換鈕（`#btn-toggle-sound`），`Sound.toggle()` 存 localStorage（key：`vocab_game_sound_v1`，與主資料 `vocab_game_data_v1` 分開），預設開啟、跨場記憶。
- **手勢解鎖**：行動裝置／Chrome 的 `AudioContext` 需在使用者手勢中 `resume` 才會出聲，`Sound.init` 於首次 touch/click 解鎖（同 `speech.js` 的作法）。

## 課程資料格式

`data/lessonNN.json`（攤平於 `data/`，不分年級；目前 `lesson01`–`lesson54`，共 54 課、473 字，內容取自 2026 Spelling Bee Team B/C 題庫 PDF）：

```json
{ "title": "11_爺爺grandfather",
  "words": [ {"en":"grandfather","zh":"爺爺/外公","emoji":"","variant":""} ] }
```

- `en`：拼字答案（片語保留空格，專有名詞/縮寫保留大小寫，如 `Wednesday`、`MRT`、`P.E.`）。
- `zh`：可含多重讀音，以 `/` 分隔（如 `爺爺/外公`），不切分，原樣顯示。
- `emoji`：一律空字串（遊戲不顯示 emoji）。
- `variant`：複數/進行式拼法，無則空字串；有值時觸發變化型追問（如 `eye→eyes`、`eat→eating`）。
- `title` 命名慣例：`NN_中文英文`（如 `01_蘋果apple`），NN 為兩位數序號、中文英文皆取該課第一個單字，兩者直接相連無分隔。此為課程顯示名稱，與檔名 `lessonNN.json`／`BUILTIN_COURSES` 的 `id` 各自獨立（id 仍固定用 `lessonNN`，避免中文/空白檔名的相容性風險）。

新增內建課程：加 JSON 檔 → 在 `js/data.js` 的 `BUILTIN_COURSES` 陣列註冊。家長模式亦可線上新增自訂課程（存 localStorage）。

## 家長模式課程單字預覽（`parent.js:renderCourseList`）

課程分頁每張課程卡片滑鼠移上去會顯示完整單字清單（`.pci-tooltip`，CSS `:hover` 觸發）。自訂課程本身已帶完整 `words`，可同步顯示；內建課程需等 `DataManager.loadCourse` 非同步載入完成後才補上。提示框用 `padding-top` 而非 `margin-top` 留視覺間距，避免卡片與提示框之間出現「無元素」的死區導致滑鼠移動時提前觸發 `mouseleave`。

## 開發慣例

- 原生 JS，ES6+，模組用 IIFE + 全域物件匯出，勿引入框架或打包器（保持零建置）。
- 檔案編碼 **UTF-8**（無 BOM），中文介面。
- `fetch` 課程一律帶 `cache: 'no-store'` 避免瀏覽器快取舊課程。
- 出題不顯示 emoji，避免看圖猜答案。
- 所有語言/介面文字繁體中文。

## 執行與部署

- 本機：直接開 `index.html`（`fetch` 課程需經 HTTP，建議起簡易伺服器如 `python -m http.server`，`file://` 下 fetch 可能受限）。
- 部署：GitHub Pages，Branch `main`、資料夾 `/ (root)`。

## 相關文件

- `README.md` — 對外介紹、新增課程說明
- `CHANGELOG.md` — 版本變更紀錄
