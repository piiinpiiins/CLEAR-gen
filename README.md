# CLEAR-gen

Chrome extension that automatically detects and dislikes suspicious YouTube videos — targeting simplified Chinese content farms, AI-generated fake knowledge, and cross-strait propaganda.

## What It Does

1. **Scans YouTube homepage** — identifies suspicious video cards using regex-based pattern matching
2. **Badges thumbnails** — overlays red/yellow/green severity badges on detected cards
3. **Auto-dislikes** — clicks into detected videos, presses dislike, seeks to end, then moves on
4. **Handles edge cases** — skips live streams, Shorts, ads; fast-forwards pre-roll ads; dismisses chat overlays; 45s global timeout; debounces SPA navigation

## Detection Categories

| Category | Label | Examples |
|----------|-------|---------|
| `simplified_chinese` | 簡體字內容 | Titles containing simplified Chinese characters |
| `content_farm` | 內容農場 | 震惊！, 99%的人不知道, 真相曝光 |
| `ai_fake_knowledge` | AI 假知識 | 冷知識合集, 醫生不告訴你, 量子養生 |
| `china_propaganda` | 對台認知作戰 | 統一台灣, 武統, 厲害了我的國 |
| `china_origin` | 中國來源頻道 | CCTV, 央視, bilibili, 新華社 |

Severity mapping:
- **Red** — `china_propaganda`, `ai_fake_knowledge`
- **Yellow** — `content_farm`, `china_origin`
- **Green** — `simplified_chinese`

## Architecture

```
manifest.json          Manifest V3
content.js             Main content script (~1200 lines)
                       - Detection engine (regex patterns)
                       - Badge overlay injection
                       - Homepage scan loop
                       - Watch page handler (dislike + seek + 45s timeout)
                       - Overlay dismissal (chat replay, engagement panels)
                       - Ad handling (fast-forward + skip button + MutationObserver)
                       - Live stream detection (3-layer)
                       - SPA navigation handling with debounce
background.js          Service worker
                       - State management (enabled, stats)
                       - Message routing between popup and content script
                       - Stats broadcast (STATS_UPDATED)
popup/                 Extension popup
  popup.html           Toggle switch + dislike counter
  popup.css            Styling
  popup.js             Real-time stats listener
icons/                 Extension icons (16, 48, 128)
```

## Key Technical Details

- **Dislike clicking**: Uses full `PointerEvent` + `MouseEvent` simulation sequence with 3-fallback chain (simulateClick → .click() → focus+Enter)
- **Ad skipping**: Primary strategy is `video.currentTime = duration` (fast-forward to end); fallback `playbackRate = 16`; skip button as secondary (5-attempt cap). `MutationObserver` on `#movie_player` with 500ms throttle + 1s polling; restores `playbackRate=1` when ad ends
- **Live stream detection**: 3-layer instant check — (1) visible `.ytp-live-badge`, (2) `duration === Infinity`, (3) DVR heuristic (`duration > 43200` + LIVE/直播 in title)
- **Navigation**: Listens to `yt-navigate-finish` + `popstate` with `navId` debounce counter (600ms)
- **Chinese aria-labels**: Dislike button uses `aria-label="對這部影片表示不喜歡"` on zh-TW YouTube

## Install

1. Clone this repo
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** → select the project folder
5. Navigate to YouTube — the extension starts automatically

## Usage

- Click the extension icon to toggle on/off and view dislike count
- Open DevTools console and filter by `[CLEAR-gen]` to see real-time logs

## License

MIT

---

# CLEAR-gen（正體中文）

自動偵測並倒讚 YouTube 上的可疑影片 — 針對簡體中文內容農場、AI 假知識、對台認知作戰內容。

## 功能說明

1. **掃描 YouTube 首頁** — 使用正則表達式比對，識別可疑影片卡片
2. **標記縮圖** — 在偵測到的卡片上疊加紅／黃／綠嚴重程度標籤
3. **自動倒讚** — 點進偵測到的影片、按倒讚、跳到影片結尾、返回首頁繼續
4. **處理特殊情況** — 跳過直播、Shorts、廣告；快轉片頭廣告；關閉聊天室覆蓋層；45 秒全域逾時；SPA 導覽防抖

## 偵測分類

| 分類 | 標籤 | 範例 |
|------|------|------|
| `simplified_chinese` | 簡體字內容 | 標題含有簡體中文字元 |
| `content_farm` | 內容農場 | 震惊！、99%的人不知道、真相曝光 |
| `ai_fake_knowledge` | AI 假知識 | 冷知識合集、醫生不告訴你、量子養生 |
| `china_propaganda` | 對台認知作戰 | 統一台灣、武統、厲害了我的國 |
| `china_origin` | 中國來源頻道 | CCTV、央視、bilibili、新華社 |

嚴重程度對應：
- **紅色** — `china_propaganda`、`ai_fake_knowledge`
- **黃色** — `content_farm`、`china_origin`
- **綠色** — `simplified_chinese`

## 架構

```
manifest.json          Manifest V3 設定檔
content.js             主要內容腳本（約 1200 行）
                       - 偵測引擎（正則表達式）
                       - 標籤覆蓋層注入
                       - 首頁掃描迴圈
                       - 觀看頁處理（倒讚 + 跳轉 + 45 秒逾時）
                       - 覆蓋層關閉（聊天重播、互動面板）
                       - 廣告處理（快轉 + 跳過按鈕 + MutationObserver）
                       - 直播偵測（三層檢查）
                       - SPA 導覽處理與防抖
background.js          Service Worker
                       - 狀態管理（啟用、統計）
                       - popup 與 content script 之間的訊息路由
                       - 統計數據廣播
popup/                 擴充功能彈出視窗
  popup.html           開關 + 倒讚計數器
  popup.css            樣式
  popup.js             即時統計監聽
icons/                 擴充功能圖示（16、48、128）
```

## 技術細節

- **倒讚點擊**：使用完整 `PointerEvent` + `MouseEvent` 模擬序列，三層備援鏈（simulateClick → .click() → focus+Enter）
- **廣告跳過**：主策略 `video.currentTime = duration`（直接跳到廣告結尾）；備援 `playbackRate = 16`；跳過按鈕為輔助策略（最多嘗試 5 次）。`MutationObserver` 監聽 `#movie_player`，500ms 節流 + 1 秒輪詢；廣告結束後恢復 `playbackRate=1`
- **直播偵測**：三層即時檢查 —（1）可見的 `.ytp-live-badge`（2）`duration === Infinity`（3）DVR 啟發式判斷（`duration > 43200` + 標題含 LIVE／直播）
- **導覽處理**：監聽 `yt-navigate-finish` + `popstate`，使用 `navId` 防抖計數器（600ms）
- **中文 aria-label**：倒讚按鈕使用 `aria-label="對這部影片表示不喜歡"`（zh-TW YouTube）

## 安裝

1. Clone 此 repo
2. 開啟 `chrome://extensions/`
3. 啟用**開發人員模式**
4. 點選**載入未封裝項目** → 選擇專案資料夾
5. 開啟 YouTube — 擴充功能會自動啟動

## 使用方式

- 點擊擴充功能圖示可開關及查看倒讚數
- 開啟 DevTools 主控台，篩選 `[CLEAR-gen]` 可查看即時 log

## 授權

MIT
