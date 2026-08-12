# ⭐ 英文小高手 — 5分鐘英文單字複習遊戲

適合國小的英文單字遊戲，透過遊戲化與間隔複習幫助小孩記住英文單字。學習者只要選課程即可開始，無年級限制。

**版本 1.1.1** ｜ 變更紀錄見 [CHANGELOG.md](CHANGELOG.md)、開發者導引見 [CLAUDE.md](CLAUDE.md)

**[▶ 直接玩（GitHub Pages）](#github-pages-部署)**

---

## 功能特色

- 🎮 **彈性時間**：開始遊戲前可選 1–5 分鐘
- 🧠 **智慧複習**：根據熟練度決定出題頻率（間隔複習）
- 🔁 **錯字複習**：結算後可針對答錯的單字再練，全部答對才過關
- 🎵 **英文發音**：使用瀏覽器內建 Web Speech API
- ⭐ **星星與成就**：遊戲化鼓勵機制
- 🔒 **家長模式**：管理學習者、課程、學習報告，並為每位學習者自訂題庫與題型比例
- 📱 **支援手機/平板**：大按鈕設計，適合小孩操作

### 四種題型

| 模式 | 說明 |
|------|------|
| 看中文選英文 | 四個選項中選出正確英文 |
| 聽音辨字 | 播放發音，選出正確單字 |
| 拼字（點選）| 點選字母組合出單字 |
| 拼字（打字）| 直接用鍵盤輸入英文 |

> 家長模式 →「遊戲設定」可為每位學習者自訂要出現的題庫與各題型權重（0=關閉）。不設定則使用全部題庫與通用預設比例。

### 變化型追問

單字若有複數或進行式（如 `arm→arms`、`eat→eating`），答完原型題後會**立刻**追問變化型（提示「中文（複數/進行式）」），加深記憶。

---

## 專案結構

```
english-word-game/
├── index.html          ← 主頁面（直接開啟即可玩）
├── css/
│   └── style.css       ← 所有樣式
├── js/
│   ├── storage.js      ← localStorage 資料管理
│   ├── speech.js       ← 語音合成
│   ├── data.js         ← 課程載入與解析
│   ├── game.js         ← 遊戲邏輯
│   ├── parent.js       ← 家長模式
│   └── app.js          ← 主控制器
└── data/
    ├── lesson01.json   ← Lesson 1
    ├── lesson02.json   ← Lesson 2
    ├── ...             ← （攤平，不分年級）
    └── lesson13.json   ← Lesson 13
```

---

## GitHub Pages 部署

### 步驟一：建立 GitHub Repository

1. 登入 [GitHub](https://github.com)
2. 點右上角 **+** → **New repository**
3. Repository name 填入 `5-minute-Vocabulary-game`（或任何名稱）
4. 選擇 **Public**
5. 點 **Create repository**

### 步驟二：上傳專案

方法 A（直接上傳）：
1. 在 Repository 頁面點 **Add file** → **Upload files**
2. 把整個專案資料夾的檔案全部拖曳上去（注意要保持資料夾結構）
3. 填入 commit 訊息後點 **Commit changes**

方法 B（使用 git）：
```bash
git init
git add .
git commit -m "初始版本"
git branch -M main
git remote add origin https://github.com/你的帳號/你的-repo-名稱.git
git push -u origin main
```

### 步驟三：啟用 GitHub Pages

1. 進入 Repository → **Settings**
2. 左側選單找 **Pages**
3. **Source** 選擇 **Deploy from a branch**
4. **Branch** 選 `main`，資料夾選 `/ (root)`
5. 點 **Save**
6. 等待約 1-2 分鐘後，頁面會顯示網站網址

網址格式：`https://你的帳號.github.io/你的-repo-名稱/`

---

## 新增課程

### 方法一：透過家長模式（推薦）

1. 進入遊戲首頁
2. 點右上角 **🔒 家長模式**
3. 切換到 **課程** 頁籤
4. 點 **新增課程**
5. 輸入課程名稱，貼上單字（格式見下方）
6. 點 **建立課程**

貼上單字格式（任選一種）：
```
apple 蘋果
banana 香蕉
elephant 大象
```
或
```
apple,蘋果
banana,香蕉
```

### 方法二：新增 JSON 教材檔案

1. 在 `data/` 新增 JSON 檔案（不分年級）

```json
{
  "title": "Lesson 14",
  "words": [
    {"en": "arm", "zh": "手臂", "emoji": "", "variant": "arms"},
    {"en": "eat", "zh": "吃",   "emoji": "", "variant": "eating"},
    {"en": "red", "zh": "紅色", "emoji": "", "variant": ""}
  ]
}
```

- `variant` 為複數/進行式拼法，有值時答完原型會追問變化型；無則留空。
- `emoji` 留空（遊戲不顯示 emoji）。

2. 在 `js/data.js` 的 `BUILTIN_COURSES` 陣列加入新課程：

```javascript
{ id: 'lesson14', title: 'Lesson 14', file: 'data/lesson14.json' },
```

3. 重新上傳到 GitHub，學習者下次開啟遊戲即可使用新課程。

---

## 資料儲存

所有學習進度儲存在瀏覽器的 **localStorage**，不需要帳號或後端。

- 清除瀏覽器資料會清除遊戲進度
- 不同裝置的進度不會自動同步
- 隱私模式下資料不會保存

---

## 技術需求

- 現代瀏覽器（Chrome 80+、Safari 14+、Firefox 75+、Edge 80+）
- 英文發音需要瀏覽器支援 Web Speech API（大部分桌機/行動瀏覽器已支援）
- 不需要網路連線（首次載入 JSON 後可離線使用）

---

## 演化日誌

依「基因疊加」原則保留歷史脈絡，完整清單見 [CHANGELOG.md](CHANGELOG.md)。

- **v1.1.1（2026-08-12）** — 「我的課程」只顯示該學習者有學習紀錄的題庫；單字清單改 grid 對齊，長英文不再擠壓中文。
- **v1.1.0（2026-08-12）** — 移除年級概念，學習者只選課程；題庫攤平至 `data/`（13 課、473 字）；新增單字變化型（複數/進行式）追問；課程清單顯示 variant。
- **v1.0.2（2026-08-12）** — 學習者個人化：家長模式「遊戲設定」分頁（自訂題庫/題型權重）、可選 1–5 分鐘、錯字複習回合、遊戲中結算按鈕、首頁顯示版本號；修正課程字數「?」與刪除最後學習者返回殘留 bug。
- **v1.0.0（2026-08-12）** — 首個完整版本：四種題型、智慧間隔複習、星星/連續天數/每日任務/成就、家長模式、四個內建課程；新增 `CLAUDE.md`、`CHANGELOG.md`。

---

## 授權

MIT License — 自由使用、修改、分享
