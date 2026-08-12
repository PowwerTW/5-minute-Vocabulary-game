# CLAUDE.md — 開發者導引

本檔為開發者與 AI 助手在此專案工作時的技術參考，與程式碼庫同步。

## 專案概述

**英文小高手** — 5 分鐘英文單字複習遊戲，純前端 SPA，零後端、零建置工具。適合小學三、五年級。直接以瀏覽器開啟 `index.html` 即可執行，或部署至 GitHub Pages。

- 技術：原生 HTML / CSS / JavaScript（無框架、無打包器、無相依套件）
- 資料儲存：瀏覽器 `localStorage`（key：`vocab_game_data_v1`）
- 發音：瀏覽器內建 Web Speech API（`speechSynthesis`）
- 課程資料：`data/**/*.json`，以 `fetch` 載入

## 架構

單頁多視圖（View）切換，全部 View 定義在 `index.html`，以 CSS class `active` 控制顯示。模組皆為 IIFE，掛在全域物件上，依 `index.html` 底部 `<script>` 順序載入。

| 檔案 | 全域物件 | 職責 |
|------|----------|------|
| `js/storage.js` | `Storage` | localStorage 讀寫：學習者、單字熟練度、自訂課程、每日任務 |
| `js/speech.js` | （語音模組） | Web Speech API 封裝，優先選高品質 en-US 語音 |
| `js/data.js` | `DataManager` | 課程載入/快取、依年級取單字、貼上文字解析 |
| `js/game.js` | `Game` | 遊戲狀態、計時器、加權選題、出題、判分 |
| `js/parent.js` | （家長模式） | 學習者管理、自訂課程、學習報告、清除資料 |
| `js/app.js` | （主控制器） | View 切換、事件綁定、串接各模組 |

**載入順序有相依性**：`storage` → `speech` → `data` → `game` → `parent` → `app`。`DataManager` 依賴 `Storage`，`Game` 依賴 `Storage`，不可調換。

## 核心資料模型

`localStorage` 單一 key（`vocab_game_data_v1`）存整包 JSON：

```
{ version, learners:[ { id, name, grade, stars, streak, lastStudyDate,
                        achievements, wordMastery:{}, dailyTasks:{} } ],
  customCourses:[ { id, grade, title, words:[...] } ] }
```

單字熟練度（`wordMastery[wordKey]`）：`{ mastery(0-5), correctCount, wrongCount, lastSeen, consecutiveCorrect, weight(1-10) }`。

## 選題演算法（間隔複習）

`game.js:_selectNextWord` 以加權隨機挑字：

- 基礎 `weight`（預設 5）
- 最近答錯：+5
- 超過 24 小時未見（含從未見）：+2
- `mastery >= 5`：-3（最低 1）

答對 `weight -1`、`mastery +1`；答錯 `weight +3`、`mastery -1`（見 `storage.js:updateWordMastery`）。

## 題型比例（`game.js:_getGameTypes`）

- 三年級：choice 20% / listen 40% / spelling_click 40%
- 五年級：choice 13% / listen 33% / spelling_click 27% / spelling_type 27%

## 課程資料格式

`data/gradeN/lessonNN.json`：

```json
{ "grade": 3, "lesson": 3, "title": "Lesson 3 - 顏色",
  "words": [ {"en":"red","zh":"紅色","emoji":"🔴","image":""} ] }
```

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
