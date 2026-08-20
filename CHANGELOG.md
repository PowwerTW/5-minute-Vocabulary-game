# Changelog

本專案所有重要變更記錄於此檔。
格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本遵循 [語意化版本](https://semver.org/lang/zh-TW/)。

## [1.5.0] - 2026-08-20

### Added
- 新增**音效模組** `js/sound.js`（`Sound`，Web Audio API 合成，無外部音檔）：
  - 答對播上行雙音（G5→C6）、答錯播低沉下行音（Eb4→Bb3）、點選／打字播短促 tick（`app.js:showFeedback` 串接答對錯）。
  - **全站按鈕點選音效**：於 `document` 委派 click，任一 `<button>` 被點到即播 tick，涵蓋所有頁面與彈窗；答題鎖定後選項鈕 `disabled` 不會誤響。
  - 拼字（打字）題輸入框以 `input` 事件加逐字 tick。
  - 遊戲畫面新增 **🔊 音效 / 🔇 靜音** 切換鈕，狀態存 localStorage（key：`vocab_game_sound_v1`），跨場記憶。
  - 行動裝置／Chrome 需在使用者手勢中 `resume` AudioContext，`Sound.init` 於首次 touch/click 解鎖。

## [1.4.2] - 2026-08-20

### Fixed
- 考試模式一題都沒作答就按「🏁 結算成績」時，不再顯示假的「全部答對」結果；改為提示「尚未作答，已離開考試」並直接回首頁（`app.js:onExamEnd` 加 `totalAnswered === 0` 守衛）。

## [1.4.1] - 2026-08-20

### Added
- 考試模式課程選擇彈窗新增「全選」按鈕：一鍵勾選所有課程，全部勾選後按鈕變為「取消全選」可一鍵清除；手動勾選也會同步切換按鈕文字（`app.js:toggleExamSelectAll`／`updateExamSelectAllLabel`）。

### Changed
- 考試模式單場最多出題 50 題：合併去重後的單字若超過 50 個，洗牌後只取前 50 題出題；誘答選項仍取自完整合併集合（`game.js:initExam` 的 `EXAM_MAX_QUESTIONS`）。

## [1.4.0] - 2026-08-19

### Changed
- 考試模式改為可**複選課程**：勾選多個課程一起考，合併所選課程單字並依 `en` 去重出題（`app.js:startExamFromSelection`）。
- 選擇題、聽力題、拼字（點選）改為「先選取、按確定才送出」，避免手滑誤觸直接判分；拼字（點選）移除填滿字母自動送出的行為。
- 考試模式「開始考試」按鈕改置中顯示；選擇題選取狀態改用明顯的紫色底色＋外框光暈＋✓ 勾勾，取代原本幾乎看不出來的縮放效果。

### Fixed
- 修正拼字（點選）確定鈕原本對物件陣列直接 `join`，答案被送出成 `[object Object]` 的隱藏 bug。
- 修正 Android Chrome 不發音的問題：`speech.js` 的 `speak()` 移除 `setTimeout` 延遲呼叫（延遲會脫離使用者手勢情境導致瀏覽器拒絕發音），改為在手勢中同步呼叫；並在使用者第一次觸控/點擊時以靜音 utterance 解鎖語音引擎、`speak()` 後主動呼叫 `resume()`。

## [1.3.0] - 2026-08-14

### Changed
- **題庫全面替換**：`lesson01`–`lesson13`（原 13 課、473 字）改為依「2026 Spelling Bee Team B/C」PDF 題庫重建，共 54 課、473 字。Team B（CTL2/CTL3）與 Team C（CTL4/CTL5）內容重疊部分（字母表～ go hiking）僅建一份，Team C 獨有的後段（日常作息、交通工具、地點、職業、月份、季節…）接續編號建課；`lesson35` 之後的分課再手動微調合併過（含 `lesson40`/`lesson41` 合併，僅 4 字的課併入相鄰課）。
- 課程切分規則：依原始題庫每 2 行印刷文字切一課，若切出的課不足 4 字則併入前一課（考試模式選擇題需要 ≥4 字才能出四選項）。
- 課程 `title` 改用 `NN_中文英文` 命名（如 `01_蘋果apple`），取該課第一個單字；`id`／檔名維持 `lessonNN` 不變。
- `tooth (teeth)`、`eat (eating)` 等括號並列的字改用 `variant` 欄位表示（觸發變化型追問），而非另建詞條。

### Removed
- 移除舊的 `lesson01`–`lesson13`（原英文小高手內建題庫內容）。

## [1.2.0] - 2026-08-13

### Added
- 遊戲時間彈窗新增「⏱ 不限時」選項：計時器改為往上累計，不會自動結束，需按「🏁 結算成績」手動結算（`game.js:init` 的 `unlimited` 旗標）。
- 新增「📝 考試模式」：首頁選擇課程後，該課程單字洗牌依序出題各一次、不限時、不觸發變化型追問，考完顯示成績，無複習模式（`game.js:initExam`、`app.js:startExam`/`onExamEnd`）。
- 家長模式課程分頁：滑鼠移到課程卡片上會顯示該課程完整單字清單（`parent.js:renderCourseList`）。

## [1.1.1] - 2026-08-12

### Changed
- 「我的課程」只顯示該學習者有學習紀錄的題庫（範圍取 `getCoursesForLearner`，再過濾出任一單字曾作答過的題庫）；無紀錄時顯示提示。
- 課程單字清單改用 grid 三欄對齊，長英文自動換行，不再擠壓中文。

## [1.1.0] - 2026-08-12

移除年級概念、題庫擴充與單字變化型。

### Added
- 單字變化型（複數 / 進行式）追問：單字可帶 `variant`（如 `arm→arms`、`eat→eating`），答完原型題後立刻追問變化型（提示「中文（複數/進行式）」），共用同一套題型（`game.js:generateQuestionForWord`、`app.js:AppState.pendingVariant`）。
- 課程 modal 與家長課程單字表顯示 variant。
- 內建題庫擴充為 13 課（`data/lesson01–13.json`，共 473 字，含 18 個變化型）。

### Changed
- **移除年級概念**：學習者只選課程，不再選三/五年級；`createLearner(name)` 去 grade。
- 題庫資料攤平至 `data/lessonNN.json`（原 `data/grade3|grade5/` 目錄移除）。
- 題型預設不分年級，改為單一通用預設（choice 20% / listen 30% / spelling_click 30% / spelling_type 20%）。
- 課程資料格式簡化：去 `grade`/`lesson`/`image`，新增 `variant`，`emoji` 一律留空。
- 學習者無勾選題庫時 → 使用全部題庫；頭像固定 📖。

### Removed
- 移除首頁與家長模式的年級選擇 UI。

## [1.0.2] - 2026-08-12

學習者個人化與複習流程強化。

### Added
- 家長模式新增「遊戲設定」分頁：可為每個學習者勾選要出現的題庫、自訂各題型權重（0=關閉）。
- 學習者資料新增 `settings`（`selectedCourses`、`questionTypes`）；`storage.js` 加 `getLearnerSettings`/`updateLearnerSettings`。
- 開始遊戲前可選 1–5 分鐘遊戲時間。
- 結算頁新增「複習錯誤單字」：以錯字另開一場複習回合，全部答對才通過。
- 遊戲中新增「結算成績」按鈕，可手動結束並結算。
- 版本號單一來源 `APP_VERSION`（`js/app.js`），首頁顯示目前版本。

### Changed
- 題型與題庫不再依年級寫死，年級僅作為預設（無自訂時沿用）。
- 每日任務文案：「完成5分鐘練習」→「完成一次遊戲」、「複習5個單字」→「完成一次複習」（改由完成一次複習回合觸發）。
- 成就「初學者」描述：「完成第一次5分鐘」→「完成第一次遊戲」。
- 星星改用統一 emoji 顯示並放大、對齊；「我的課程」單字清單移除 emoji。

### Fixed
- 修正家長模式內建課程字數顯示「?」的 bug（改非同步載入 JSON 補真實字數）。
- 修正刪除最後一位學習者後返回仍殘留舊畫面、需重整的 bug。

[1.4.0]: https://github.com/PowwerTW/5-minute-Vocabulary-game/releases/tag/v1.4.0

[1.3.0]: https://github.com/PowwerTW/5-minute-Vocabulary-game/releases/tag/v1.3.0

[1.2.0]: https://github.com/PowwerTW/5-minute-Vocabulary-game/releases/tag/v1.2.0

[1.1.1]: https://github.com/PowwerTW/5-minute-Vocabulary-game/releases/tag/v1.1.1

[1.1.0]: https://github.com/PowwerTW/5-minute-Vocabulary-game/releases/tag/v1.1.0

[1.0.2]: https://github.com/PowwerTW/5-minute-Vocabulary-game/releases/tag/v1.0.2

## [1.0.0] - 2026-08-12

首個完整版本（PR #1 `1150811_game-improvements` 合併進 `main`）。

### Added
- 完整單頁 SPA 遊戲（`index.html` / `css` / `js` / `data`）。
- 三種題型：看中文選英文、聽音辨字、拼字（點選 / 打字）。
- 智慧間隔複習：依單字熟練度加權選題。
- 星星、連續天數、每日任務、成就系統。
- 家長模式：學習者管理、自訂課程、學習報告、清除資料。
- 內建課程：三年級 Lesson 1（A-Z 52 字）/ Lesson 2，五年級 Lesson 1 / Lesson 2。
- 開發者導引文件 `CLAUDE.md`、變更紀錄 `CHANGELOG.md`。

### Changed
- 三年級 Lesson 1 更新為 A-Z 共 52 個單字。
- 字體放大；語音優先選高品質 en-US 語音。
- 調整題型比例：減少選擇題，增加聽力與填空。

### Removed
- 移除題目 emoji，避免看圖猜答案。

### Fixed
- 修正拼字題點選答案欄位造成全部清空的 bug。
- `fetch` 課程加入 `cache: 'no-store'`，避免瀏覽器快取舊課程。

[1.0.0]: https://github.com/PowwerTW/5-minute-Vocabulary-game/releases/tag/v1.0.0
