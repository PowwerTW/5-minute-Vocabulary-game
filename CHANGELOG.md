# Changelog

本專案所有重要變更記錄於此檔。
格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本遵循 [語意化版本](https://semver.org/lang/zh-TW/)。

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
