# CLEAR-gen

Chrome extension that automatically detects and dislikes suspicious YouTube videos — targeting simplified Chinese content farms, AI-generated fake knowledge, cross-strait propaganda, and **AI-generated cognitive warfare videos**.

## What It Does

1. **Scans YouTube homepage** — identifies suspicious video cards using multi-signal weighted analysis
2. **Badges thumbnails** — overlays red/yellow/green/purple severity badges on detected cards
3. **Auto-dislikes** — clicks into detected videos, presses dislike, seeks to end, then moves on
4. **Handles edge cases** — skips live streams, Shorts, ads; fast-forwards pre-roll ads; dismisses chat overlays; 45s global timeout; debounces SPA navigation

## Detection Categories

| Category | Label | Severity | Examples |
|----------|-------|----------|----------|
| `china_propaganda` | 對台認知作戰 | 🔴 Red | 統一台灣, 武統, 厲害了我的國 |
| `ai_generated` | AI 生成影片 | 🟣 Purple | AI TTS, 模板式標題, 認知作戰敘事 |
| `ai_fake_knowledge` | AI 假知識 | 🔴 Red | 冷知識合集, 醫生不告訴你, 量子養生 |
| `content_farm` | 內容農場 | 🟡 Yellow | 震惊！, 99%的人不知道, 真相曝光 |
| `china_origin` | 中國來源頻道 | 🟡 Yellow | CCTV, 央視, bilibili, 新華社 |
| `simplified_chinese` | 簡體字內容 | 🟢 Green | Titles containing simplified Chinese characters |

Severity mapping:
- **Red** — `china_propaganda`, `ai_fake_knowledge`, or multi-category detection
- **Purple** — `ai_generated` (standalone)
- **Yellow** — `content_farm`, `china_origin`
- **Green** — `simplified_chinese` only

## Detection Framework

CLEAR-gen uses a **multi-signal weighted scoring** framework with 8 signal analyzers:

| Signal | Weight | Description |
|--------|--------|-------------|
| AI Title Patterns | 0.2 / match | Detects AI-generated title structures (listicles, Q&A, clickbait) |
| AI TTS Patterns | 0.15 / match | Military/science/history topics common in TTS videos |
| Cognitive Warfare Narratives | 0.25 / match | Fear, division, conspiracy, authority impersonation |
| Channel Name Anomaly | 0.2 | Matches known propaganda channel naming patterns |
| Title Structure | 0.1–0.15 | Punctuation density, listicle format, length analysis |
| Metadata Cross-Validation | 0.1 | Video duration anomalies (too short/long with clickbait) |
| Simplified Chinese Synergy | 0.15 | Simplified Chinese + other signals = higher confidence |
| China Terminology | 0.15 | Excessive mainland Chinese terminology in title |

Threshold: **≥ 0.4** composite score triggers AI-generated detection.

Cross-signal boost: 3+ categories → +15% confidence, 4+ → +25%.

## Architecture

```
ai-warfare-patterns.js   AI cognitive warfare pattern library
                         - AI title patterns (30+ patterns)
                         - AI TTS patterns (military, science, history)
                         - Cognitive warfare narratives (fear, division, conspiracy)
                         - Channel anomaly signals
                         - Metadata anomaly patterns
                         - Expanded China terminology
detector.js              Multi-signal detection engine
                         - Signal extractors (title, metadata, channel)
                         - 6 category detectors
                         - Simplified Chinese detection (600+ chars)
                         - Composite analyzer with weighted scoring
                         - Severity determination
content.js               Main content script
                         - Badge CSS + DOM injection (red/yellow/green/purple)
                         - Homepage scan loop
                         - Watch page handler (dislike + seek + 45s timeout)
                         - Overlay dismissal (chat replay, engagement panels)
                         - Ad handling (fast-forward + skip + MutationObserver)
                         - Live stream detection (3-layer)
                         - SPA navigation handling with debounce
background.js            Service worker
                         - State management (enabled, stats)
                         - Per-category detection statistics
                         - Stats migration on update
                         - Message routing between popup and content script
popup/                   Extension popup
  popup.html             Toggle switch + stats dashboard
  popup.css              Styling
  popup.js               Real-time per-category stats listener
icons/                   Extension icons (16, 48, 128)
```

## Key Technical Details

- **Multi-signal detection**: 8 independent signal analyzers with weighted scoring
- **AI-generated detection**: Combines title patterns, narrative analysis, channel profiling, and metadata cross-validation
- **Dislike clicking**: Uses full `PointerEvent` + `MouseEvent` simulation with 3-fallback chain
- **Ad skipping**: Primary `video.currentTime = duration`; fallback `playbackRate = 16`; skip button as secondary
- **Live stream detection**: 3-layer check — visible `.ytp-live-badge`, `duration === Infinity`, DVR heuristic
- **Navigation**: Listens to `yt-navigate-finish` + `popstate` with debounce (600ms)
- **Per-category stats**: Background tracks detection counts by category, popup displays real-time breakdown

## Install

1. Clone this repo
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** → select the project folder
5. Navigate to YouTube — the extension starts automatically

## Usage

- Click the extension icon to toggle on/off and view per-category detection stats
- Open DevTools console and filter by `[CLEAR-gen]` to see real-time logs

## License

MIT

---

# CLEAR-gen（正體中文）

自動偵測並倒讚 YouTube 上的可疑影片 — 針對簡體中文內容農場、AI 假知識、對台認知作戰，以及 **AI 生成的認知作戰影片**。

## 功能說明

1. **掃描 YouTube 首頁** — 使用多信號加權分析，識別可疑影片卡片
2. **標記縮圖** — 在偵測到的卡片上疊加紅／黃／綠／紫嚴重程度標籤
3. **自動倒讚** — 點進偵測到的影片、按倒讚、跳到影片結尾、返回首頁繼續
4. **處理特殊情況** — 跳過直播、Shorts、廣告；快轉片頭廣告；關閉聊天室覆蓋層；45 秒全域逾時；SPA 導覽防抖

## 偵測分類

| 分類 | 標籤 | 嚴重度 | 範例 |
|------|------|--------|------|
| `china_propaganda` | 對台認知作戰 | 🔴 紅色 | 統一台灣、武統、厲害了我的國 |
| `ai_generated` | AI 生成影片 | 🟣 紫色 | AI TTS、模板式標題、認知作戰敘事結構 |
| `ai_fake_knowledge` | AI 假知識 | 🔴 紅色 | 冷知識合集、醫生不告訴你、量子養生 |
| `content_farm` | 內容農場 | 🟡 黃色 | 震惊！、99%的人不知道、真相曝光 |
| `china_origin` | 中國來源頻道 | 🟡 黃色 | CCTV、央視、bilibili、新華社 |
| `simplified_chinese` | 簡體字內容 | 🟢 綠色 | 標題含有簡體中文字元 |

## 偵測框架

CLEAR-gen 使用**多信號加權評分框架**，包含 8 個信號分析器：

| 信號 | 權重 | 說明 |
|------|------|------|
| AI 標題模式 | 0.2 / 匹配 | 列表式、問答式、聳動式等 AI 生成標題結構 |
| AI TTS 模式 | 0.15 / 匹配 | 軍事/科學/歷史等 TTS 影片常見主題 |
| 認知作戰敘事 | 0.25 / 匹配 | 恐懼、分裂、陰謀論、冒充權威等敘事框架 |
| 頻道名稱異常 | 0.2 | 匹配已知統戰頻道命名模式 |
| 標題結構分析 | 0.1–0.15 | 標點密度、列表格式、長度分析 |
| 後設資料交叉驗證 | 0.1 | 影片時長異常（太短/太長 + 聳動標題） |
| 簡體中文協同 | 0.15 | 簡體中文 + 其他信號 = 更高信心度 |
| 中國用語 | 0.15 | 標題中過量使用大陸用語 |

閾值：合成分數 **≥ 0.4** 觸發 AI 生成偵測。

## 安裝

1. Clone 此 repo
2. 開啟 `chrome://extensions/`
3. 啟用**開發人員模式**
4. 點選**載入未封裝項目** → 選擇專案資料夾
5. 開啟 YouTube — 擴充功能會自動啟動

## 使用方式

- 點擊擴充功能圖示可開關及查看各分類偵測統計
- 開啟 DevTools 主控台，篩選 `[CLEAR-gen]` 可查看即時 log

## 授權

MIT
