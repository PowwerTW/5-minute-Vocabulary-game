# Changelog

本專案所有重要變更記錄於此檔。
格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本遵循 [語意化版本](https://semver.org/lang/zh-TW/)。

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
