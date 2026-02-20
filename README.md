# CLEAR-gen

Chrome extension that automatically detects and dislikes suspicious YouTube videos — targeting simplified Chinese content farms, AI-generated fake knowledge, and cross-strait propaganda.

## What It Does

1. **Scans YouTube homepage** — identifies suspicious video cards using regex-based pattern matching
2. **Badges thumbnails** — overlays red/yellow/green severity badges on detected cards
3. **Auto-dislikes** — clicks into detected videos, presses dislike, seeks to end, then moves on
4. **Handles edge cases** — skips live streams, Shorts, ads; auto-skips pre-roll ads; debounces SPA navigation

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
content.js             Main content script (~1000 lines)
                       - Detection engine (regex patterns)
                       - Badge overlay injection
                       - Homepage scan loop
                       - Watch page handler (dislike + seek)
                       - Ad skip observer (MutationObserver + polling)
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
- **Ad skipping**: `MutationObserver` on `document.body` + 300ms interval polling; expanded selectors including shadow DOM inside `yt-button-shape`
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
