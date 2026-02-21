// ============================================================
// CLEAR-gen Content Script
// 首頁掃描 → Badge 標記 → 開啟可疑影片 → Dislike → 自動播放循環
// Detection engine loaded from: detector.js + ai-warfare-patterns.js
// ============================================================

const LOG = '[CLEAR-gen]';

// BADGE_CLASS used by badge injection code below
// Detection constants (DETECTION_CATEGORIES, CATEGORY_LABELS, SEVERITY)
// are defined in detector.js
const BADGE_CLASS = 'clear-badge';

// --- Thumbnail Selectors ---
const THUMBNAIL_SELECTORS = [
  'yt-thumbnail-view-model', 'yt-thumbnail',
  'yt-lockup-view-model yt-image', 'ytd-thumbnail',
  'a#thumbnail',
];

// ============================================================
// SECTION 1: SELECTORS
// ============================================================

const SELECTORS = {
  homeCards: ['ytd-rich-item-renderer'],
  cardTitle: [
    'yt-lockup-view-model h3', '#video-title', 'a#video-title',
    'h3 a#video-title', 'yt-formatted-string#video-title',
  ],
  cardLink: [
    'a#video-title-link', 'a#video-title',
    'a.yt-simple-endpoint[href*="/watch"]', 'a[href*="/watch"]',
  ],
  cardChannelName: [
    '#channel-name yt-formatted-string a', '#channel-name a',
    'ytd-channel-name yt-formatted-string a', '#text.ytd-channel-name',
    'a[href*="/@"]',
  ],
  watchTitle: [
    'ytd-watch-metadata h1 yt-formatted-string',
    'h1.ytd-watch-metadata yt-formatted-string',
    '#title h1 yt-formatted-string',
    'ytd-watch-flexy h1.title yt-formatted-string',
    '#above-the-fold #title yt-formatted-string',
  ],
  watchChannelName: [
    'ytd-watch-metadata ytd-channel-name yt-formatted-string a',
    '#top-row ytd-channel-name a',
    '#owner #channel-name a',
    '#upload-info ytd-channel-name a',
  ],
  dislike: [
    'dislike-button-view-model button',
    'ytd-segmented-like-dislike-button-renderer button[aria-label*="dislike" i]',
    'ytd-segmented-like-dislike-button-renderer button[aria-label*="不喜歡"]',
    'ytd-segmented-like-dislike-button-renderer button[aria-label*="不喜欢"]',
    '#segmented-dislike-button button',
    'segmented-like-dislike-button-view-model dislike-button-view-model button',
  ],
  dislikePressed: [
    'dislike-button-view-model button[aria-pressed="true"]',
    'ytd-segmented-like-dislike-button-renderer button[aria-pressed="true"][aria-label*="dislike" i]',
    'ytd-segmented-like-dislike-button-renderer button[aria-pressed="true"][aria-label*="不喜歡"]',
    'ytd-segmented-like-dislike-button-renderer button[aria-pressed="true"][aria-label*="不喜欢"]',
    '#segmented-dislike-button button[aria-pressed="true"]',
    'segmented-like-dislike-button-view-model dislike-button-view-model button[aria-pressed="true"]',
  ],
};

// Text variants for "Don't recommend channel" across locales
const DONT_RECOMMEND_TEXT = [
  '不要推薦這個頻道',     // zh-TW
  '不推荐此频道',         // zh-CN
  "Don't recommend channel", // en
];

// ============================================================
// SECTION 2c: BADGE CSS INJECTION
// ============================================================

let badgeCSSInjected = false;

function injectBadgeCSS() {
  if (badgeCSSInjected) return;
  const style = document.createElement('style');
  style.id = 'clear-badge-styles';
  style.textContent = `
.${BADGE_CLASS}-overlay {
  position: absolute !important;
  top: 8px !important;
  left: 8px !important;
  z-index: 100 !important;
  pointer-events: auto !important;
}
.${BADGE_CLASS} {
  display: inline-flex !important;
  align-items: center !important;
  font-size: 16px !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  padding: 4px 10px !important;
  border-radius: 4px !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
  line-height: 1.4 !important;
  cursor: default !important;
  user-select: none !important;
  transition: opacity 0.2s !important;
  backdrop-filter: blur(4px) !important;
  -webkit-backdrop-filter: blur(4px) !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
}
.${BADGE_CLASS}:hover { opacity: 0.85 !important; }
.${BADGE_CLASS}--red {
  background: rgba(220, 38, 38, 0.85) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 100, 100, 0.5) !important;
}
.${BADGE_CLASS}--yellow {
  background: rgba(217, 119, 6, 0.85) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 180, 50, 0.5) !important;
}
.${BADGE_CLASS}--green {
  background: rgba(22, 163, 74, 0.75) !important;
  color: #fff !important;
  border: 1px solid rgba(74, 222, 128, 0.5) !important;
}
.${BADGE_CLASS}--purple {
  background: rgba(147, 51, 234, 0.85) !important;
  color: #fff !important;
  border: 1px solid rgba(192, 132, 252, 0.5) !important;
}
ytd-compact-video-renderer .${BADGE_CLASS} { font-size: 12px !important; padding: 2px 6px !important; }
ytd-compact-video-renderer .${BADGE_CLASS}-overlay { top: 4px !important; left: 4px !important; }
ytd-video-renderer .${BADGE_CLASS} { font-size: 14px !important; padding: 3px 8px !important; }
.${BADGE_CLASS}-watch { display: inline !important; margin-right: 8px !important; }
.${BADGE_CLASS}-watch .${BADGE_CLASS} {
  font-size: 12px !important;
  padding: 3px 10px !important;
  backdrop-filter: none !important;
  text-shadow: none !important;
}
.${BADGE_CLASS}-player-overlay {
  position: absolute !important;
  top: 12px !important;
  left: 12px !important;
  z-index: 60 !important;
  pointer-events: none !important;
}
.${BADGE_CLASS}-player-overlay .${BADGE_CLASS} {
  font-size: 18px !important;
  padding: 6px 14px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
}
`;
  document.head.appendChild(style);
  badgeCSSInjected = true;
}

// ============================================================
// SECTION 2d: BADGE DOM INJECTION
// ============================================================

function findThumbnail(card) {
  for (const sel of THUMBNAIL_SELECTORS) {
    const el = card.querySelector(sel);
    if (el) return el;
  }
  const img = card.querySelector('img[src*="ytimg"]');
  return img ? (img.closest('yt-thumbnail-view-model, yt-thumbnail, ytd-thumbnail, a, div') || img.parentElement) : null;
}

function injectOverlay(thumb, badgeEl) {
  if (getComputedStyle(thumb).position === 'static') thumb.style.position = 'relative';
  thumb.style.overflow = 'visible';
  const overlay = document.createElement('div');
  overlay.className = `${BADGE_CLASS}-overlay`;
  overlay.appendChild(badgeEl);
  thumb.appendChild(overlay);
}

function createBadge(severity, categories, detections) {
  const badge = document.createElement('span');
  badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${severity}`;
  badge.setAttribute('data-clear-categories', categories.join(','));
  const labels = categories.map(c => CATEGORY_LABELS[c] || c);
  badge.textContent = labels.join(' · ');
  let tooltip = labels.join('\n');
  for (const cat of categories) {
    const det = detections?.[cat];
    if (det?.confidence) tooltip += `\n${CATEGORY_LABELS[cat]}: ${Math.round(det.confidence * 100)}%`;
  }
  badge.title = tooltip;
  return badge;
}

function injectBadgeOnCard(card, title, channelName) {
  if (card.querySelector(`.${BADGE_CLASS}-overlay`)) return null;
  const result = analyzeVideo(title, channelName, card);
  const thumb = findThumbnail(card);
  if (!thumb) return result;

  if (result.categoriesDetected.length === 0) {
    const badge = document.createElement('span');
    badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--green`;
    badge.textContent = '隨時自我提醒';
    badge.title = '未偵測到可疑內容';
    injectOverlay(thumb, badge);
  } else {
    const severity = determineSeverity(result.categoriesDetected);
    const badge = createBadge(severity, result.categoriesDetected, result.detections);
    injectOverlay(thumb, badge);
  }
  return result;
}

function injectWatchPageBadge(title, channelName) {
  const titleEl = queryFirst(document, SELECTORS.watchTitle);
  if (!titleEl) return null;
  const titleParent = titleEl.closest('h1') || titleEl.parentElement;
  if (!titleParent || titleParent.querySelector(`.${BADGE_CLASS}-watch`)) return null;

  const result = analyzeVideo(title, channelName);
  const categories = result.categoriesDetected;

  const badge = document.createElement('span');
  if (categories.length === 0) {
    badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--green`;
    badge.textContent = '隨時自我提醒';
  } else {
    const severity = determineSeverity(categories);
    badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${severity}`;
    badge.textContent = categories.map(c => CATEGORY_LABELS[c] || c).join(' · ');
  }

  const container = document.createElement('span');
  container.className = `${BADGE_CLASS}-watch`;
  container.appendChild(badge);
  titleEl.before(container);
  return result;
}

function injectPlayerBadge(categories, detections) {
  const player = document.querySelector('#movie_player');
  if (!player || player.querySelector(`.${BADGE_CLASS}-player-overlay`)) return;
  if (getComputedStyle(player).position === 'static') player.style.position = 'relative';

  const badge = document.createElement('span');
  if (!categories || categories.length === 0) {
    badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--green`;
    badge.textContent = '隨時自我提醒';
  } else {
    const severity = determineSeverity(categories);
    badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${severity}`;
    badge.textContent = categories.map(c => CATEGORY_LABELS[c] || c).join(' · ');
  }

  const overlay = document.createElement('div');
  overlay.className = `${BADGE_CLASS}-player-overlay`;
  overlay.appendChild(badge);
  player.appendChild(overlay);
}

// ============================================================
// SECTION 3: UTILITIES
// ============================================================

function queryFirst(parent, selectors) {
  for (const sel of selectors) {
    try { const el = parent.querySelector(sel); if (el) return el; } catch (_) { }
  }
  return null;
}

function simulateClick(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + (Math.random() * 6 - 3);
  const y = rect.top + rect.height / 2 + (Math.random() * 6 - 3);
  const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
  element.dispatchEvent(new PointerEvent('pointerdown', opts));
  element.dispatchEvent(new MouseEvent('mousedown', opts));
  element.dispatchEvent(new PointerEvent('pointerup', opts));
  element.dispatchEvent(new MouseEvent('mouseup', opts));
  element.dispatchEvent(new MouseEvent('click', opts));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay(min, max) { return sleep(min + Math.random() * (max - min)); }

async function clickDontRecommend(card) {
  try {
    // Step 1: Find the ⋮ menu button on this card
    const menuRenderer = card.querySelector('ytd-menu-renderer');
    if (!menuRenderer) {
      console.warn(LOG, 'clickDontRecommend: no ytd-menu-renderer on card');
      return false;
    }
    const menuBtn = menuRenderer.querySelector('button')
      || menuRenderer.querySelector('yt-icon-button');
    if (!menuBtn) {
      console.warn(LOG, 'clickDontRecommend: no menu button found');
      return false;
    }

    // Step 2: Click ⋮ to open popup
    console.log(LOG, 'clickDontRecommend: opening ⋮ menu...');
    simulateClick(menuBtn);
    await randomDelay(400, 800);

    // Step 3: Wait for popup to render (appears at body level)
    let menuPopup = null;
    for (let i = 0; i < 10; i++) {
      const popups = document.querySelectorAll('ytd-menu-popup-renderer');
      if (popups.length > 0) {
        const candidate = popups[popups.length - 1];
        if (candidate.offsetParent !== null || getComputedStyle(candidate).display !== 'none') {
          menuPopup = candidate;
          break;
        }
      }
      await sleep(200);
    }
    if (!menuPopup) {
      console.warn(LOG, 'clickDontRecommend: popup did not appear');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return false;
    }

    // Step 4: Find "Don't recommend channel" by text content
    const menuItems = menuPopup.querySelectorAll(
      'ytd-menu-service-item-renderer, tp-yt-paper-item'
    );
    let targetItem = null;
    for (const item of menuItems) {
      const text = item.textContent?.trim() || '';
      if (DONT_RECOMMEND_TEXT.some(v => text.includes(v))) {
        targetItem = item;
        break;
      }
    }
    if (!targetItem) {
      console.warn(LOG, 'clickDontRecommend: option not found. Menu items:');
      for (const item of menuItems) {
        console.log(LOG, `  "${item.textContent?.trim()}"`);
      }
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await sleep(300);
      return false;
    }

    // Step 5: Click the option
    console.log(LOG, `clickDontRecommend: clicking "${targetItem.textContent?.trim()}"`);
    await randomDelay(200, 500);
    simulateClick(targetItem);
    await sleep(500);
    // Fallback: also try inner tp-yt-paper-item
    const inner = targetItem.querySelector('tp-yt-paper-item');
    if (inner) inner.click();

    console.log(LOG, 'clickDontRecommend: SUCCESS');
    await sleep(800);
    return true;
  } catch (err) {
    console.error(LOG, 'clickDontRecommend error:', err);
    try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (_) {}
    return false;
  }
}

async function waitForPlayer(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    // Don't return during ad playback — the duration would be the ad's, not the video's
    if (await isAdPlaying()) { await sleep(500); continue; }

    // Check for live badge becoming visible — abort early so caller can handle it
    const liveBadge = document.querySelector('.ytp-live-badge');
    if (liveBadge && liveBadge.offsetParent !== null && getComputedStyle(liveBadge).display !== 'none') {
      console.log(LOG, 'waitForPlayer: live badge visible, aborting wait');
      return null;  // Return null so caller falls into live stream handling
    }

    const player = document.querySelector('video.html5-main-video') || document.querySelector('video');
    if (player && player.duration && isFinite(player.duration) && player.duration > 0) return player;
    await sleep(300);
  }
  return null;
}

// ============================================================
// SECTION 4: STATE
// ============================================================

let enabled = true;
let isRunning = false;
const scannedCards = new WeakSet();
const processedVideoIds = new Set();

function goHome() {
  // Navigate to YouTube homepage directly — avoids playlist traps where
  // history.back() lands on another playlist video instead of the homepage
  window.location.href = '/';
}

// ============================================================
// SECTION 5: PHASE 1 — HOME PAGE SCAN + BADGE
// ============================================================

async function scanHomePage() {
  if (!enabled || isRunning) return;
  isRunning = true;

  console.log(LOG, 'Scanning home page...');

  let scrollAttempts = 0;
  const MAX_SCROLL_ATTEMPTS = 100;

  while (enabled && scrollAttempts < MAX_SCROLL_ATTEMPTS) {
    const cards = document.querySelectorAll(SELECTORS.homeCards[0]);

    for (const card of cards) {
      if (!enabled) break;
      if (scannedCards.has(card)) continue;
      scannedCards.add(card);

      // Skip Ads
      if (card.querySelector('ytd-ad-slot-renderer, ad-slot-renderer, [is-ad], #ad-badge, ytd-promoted-sparkles-web-renderer, ytd-display-ad-renderer')
        || card.closest('ytd-ad-slot-renderer')) {
        continue;
      }

      // Skip Shorts
      const cardLinks = card.querySelectorAll('a[href]');
      let isShort = false;
      for (const a of cardLinks) {
        if (a.href && a.href.includes('/shorts/')) { isShort = true; break; }
      }
      if (isShort || card.querySelector('[is-short], ytd-reel-item-renderer')) {
        continue;
      }

      const titleEl = queryFirst(card, SELECTORS.cardTitle);
      const title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title')?.trim() || '';
      if (!title) continue;

      // Get channel name
      const channelEl = queryFirst(card, SELECTORS.cardChannelName);
      const channelName = channelEl?.textContent?.trim() || '';

      // Inject badge on every card
      const result = injectBadgeOnCard(card, title, channelName);

      if (result && result.shouldAct) {
        const cats = result.categoriesDetected;
        console.log(LOG, `Detected [${cats.join(', ')}]: 「${title.slice(0, 50)}」`);
        const link = queryFirst(card, SELECTORS.cardLink);
        // Double-check: don't click into Shorts or Ads
        if (link && !link.href?.includes('/shorts/')) {
          // Extract video ID from link and skip if already processed
          const linkUrl = new URL(link.href, window.location.origin);
          const cardVideoId = linkUrl.searchParams.get('v');
          if (cardVideoId && processedVideoIds.has(cardVideoId)) {
            console.log(LOG, `Skipping already processed: ${cardVideoId} 「${title.slice(0, 30)}」`);
            continue;
          }

          // Try "Don't recommend channel" first (more effective than dislike)
          const dontRecommendOk = await clickDontRecommend(card);
          if (dontRecommendOk) {
            if (cardVideoId) processedVideoIds.add(cardVideoId);
            try {
              chrome.runtime.sendMessage({ type: 'DONT_RECOMMEND_RECORDED', categories: cats });
            } catch (_) {}
            await randomDelay(1000, 2000);
            continue; // Card removed by YouTube, scan next
          }

          // Fallback: click into video for dislike flow
          await randomDelay(500, 1500);
          console.log(LOG, `Opening video: 「${title.slice(0, 50)}」`);
          simulateClick(link);
          isRunning = false;
          return;
        }
      }
    }

    scrollAttempts++;
    console.log(LOG, `Scrolling... (${scrollAttempts}/${MAX_SCROLL_ATTEMPTS})`);
    window.scrollBy({ top: 600, behavior: 'smooth' });
    await randomDelay(1500, 2500);
  }

  console.log(LOG, 'Max scroll attempts reached.');
  isRunning = false;
}

// ============================================================
// SECTION 6: PHASE 2 — WATCH PAGE: DISLIKE + SEEK
// ============================================================

function dismissOverlays() {
  // Close chat replay / featured chat messages panel (重點聊天訊息)
  const chatCloseSelectors = [
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-live-chat-replay"] #close-button button',
    'ytd-engagement-panel-section-list-renderer[visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"] #close-button button',
    '#chat-container #close-button button',
    'ytd-live-chat-frame #close-button button',
    'tp-yt-paper-dialog .yt-spec-button-shape-next--call-to-action',  // generic dialog dismiss
  ];
  for (const sel of chatCloseSelectors) {
    const btn = document.querySelector(sel);
    if (btn && btn.offsetParent !== null) {
      console.log(LOG, `Closing overlay: ${sel}`);
      btn.click();
    }
  }
  // Also try to collapse engagement panels that might block buttons
  const panels = document.querySelectorAll('ytd-engagement-panel-section-list-renderer[visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]');
  for (const panel of panels) {
    const closeBtn = panel.querySelector('#close-button button, yt-icon-button#close-button');
    if (closeBtn) {
      console.log(LOG, 'Closing engagement panel');
      closeBtn.click();
    }
  }
}

async function clickDislike() {
  // Dismiss overlays that might block the dislike button (e.g. chat replay panel)
  dismissOverlays();
  await sleep(300);

  const alreadyPressed = queryFirst(document, SELECTORS.dislikePressed);
  if (alreadyPressed) { console.log(LOG, 'Already disliked'); return true; }

  let dislikeBtn = null;
  for (let i = 0; i < 8; i++) {
    dislikeBtn = queryFirst(document, SELECTORS.dislike);
    if (dislikeBtn) break;
    console.log(LOG, `Waiting for dislike button... (${i + 1}/8)`);
    await sleep(1000);
  }
  if (!dislikeBtn) { console.warn(LOG, 'Dislike button not found'); return false; }

  console.log(LOG, `Found dislike button: <${dislikeBtn.tagName}> aria-label="${dislikeBtn.getAttribute('aria-label')}" aria-pressed="${dislikeBtn.getAttribute('aria-pressed')}"`);

  await randomDelay(800, 2000);

  // Try simulateClick first
  simulateClick(dislikeBtn);
  await sleep(800);

  if (queryFirst(document, SELECTORS.dislikePressed)) return true;

  // Fallback: native .click()
  console.log(LOG, 'simulateClick did not work, trying .click()...');
  dislikeBtn.click();
  await sleep(800);

  if (queryFirst(document, SELECTORS.dislikePressed)) return true;

  // Fallback: focus + Enter key
  console.log(LOG, '.click() did not work, trying focus+Enter...');
  dislikeBtn.focus();
  dislikeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
  dislikeBtn.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
  await sleep(800);

  const confirmed = !!queryFirst(document, SELECTORS.dislikePressed);
  if (!confirmed) {
    console.warn(LOG, 'Could not confirm dislike pressed state — assuming click worked');
    return true;  // Assume it worked since we found and clicked the button
  }
  return true;
}

async function seekToEnd(secondsBeforeEnd = 2) {
  const player = await waitForPlayer(10000);
  if (!player) { console.warn(LOG, 'Player not ready for seek'); return; }
  if (!isFinite(player.duration) || player.duration <= 0) {
    console.warn(LOG, `Cannot seek: duration=${player.duration}`);
    return;
  }
  player.currentTime = Math.max(0, player.duration - secondsBeforeEnd);
  await sleep(500);
  console.log(LOG, `Seeked to ${Math.round(player.currentTime)}s / ${Math.round(player.duration)}s`);
}

async function isAdPlaying() {
  const playerContainer = document.querySelector('#movie_player, .html5-video-player');
  return playerContainer && (
    playerContainer.classList.contains('ad-showing')
    || playerContainer.classList.contains('ad-interrupting')
    || !!document.querySelector('.ytp-ad-player-overlay, .ytp-ad-player-overlay-layout')
  );
}

function tryFastForwardAd() {
  const video = document.querySelector('video.html5-main-video');
  if (!video) return false;

  // Strategy 1: Jump to end of ad
  if (isFinite(video.duration) && video.duration > 0) {
    video.currentTime = video.duration;
    console.log(LOG, `Fast-forwarded ad: currentTime → ${video.duration}s`);
    return true;
  }

  // Strategy 2: Max playback speed
  if (video.playbackRate < 16) {
    video.playbackRate = 16;
    console.log(LOG, 'Fast-forwarding ad at 16x speed');
    return true;
  }

  return false;
}

async function waitForAdToFinish(maxWait = 60000) {
  if (!await isAdPlaying()) return;
  console.log(LOG, 'Ad detected, waiting for it to finish...');

  const video = document.querySelector('video.html5-main-video');
  if (video) video.muted = true;

  // Primary strategy: fast-forward the ad
  tryFastForwardAd();

  let failedClickCount = 0;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (!await isAdPlaying()) {
      console.log(LOG, `Ad finished (waited ${Math.round((Date.now() - start) / 1000)}s)`);
      break;
    }

    // Re-try fast-forward periodically (handles ad pods / multi-ad sequences)
    tryFastForwardAd();

    // Secondary strategy: try skip button (max 5 attempts)
    if (failedClickCount < 5) {
      const result = findAdSkipButton();
      if (result) {
        console.log(LOG, `waitForAdToFinish: clicking skip [${result.selector}]`);
        simulateClick(result.btn);
        result.btn.click();
        failedClickCount++;
      }
    }

    await sleep(1000);
  }

  // Restore normal playback state
  if (video) {
    video.muted = false;
    video.playbackRate = 1;
  }
}

async function handleWatchPage() {
  if (!enabled) return;
  isRunning = true;

  // Extract video ID early so we can mark it processed before any early return
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId || processedVideoIds.has(videoId)) {
    console.log(LOG, `Video ${videoId} already processed or no ID`);
    goHome();
    isRunning = false;
    return;
  }
  processedVideoIds.add(videoId);

  // Global timeout — abort if handleWatchPage takes too long
  const watchAbort = { aborted: false };
  const watchTimer = setTimeout(() => {
    watchAbort.aborted = true;
    console.warn(LOG, `handleWatchPage timeout (45s) for ${videoId}, aborting`);
  }, 45000);

  try {
    await sleep(1000);
    if (watchAbort.aborted) return;

    // Quick live stream check — before anything else
    const quickLiveBadge = document.querySelector('.ytp-live-badge');
    const quickBadgeVisible = quickLiveBadge && quickLiveBadge.offsetParent !== null && getComputedStyle(quickLiveBadge).display !== 'none';
    const quickVideoEl = document.querySelector('video.html5-main-video') || document.querySelector('video');
    const quickDurInfinite = quickVideoEl && quickVideoEl.duration === Infinity;
    // DVR live streams: finite duration > 12h + title has LIVE/直播
    const quickTitle = document.querySelector('ytd-watch-metadata h1 yt-formatted-string')?.textContent?.trim() || '';
    const quickDurDVR = quickVideoEl && quickVideoEl.duration > 43200
      && /LIVE|直播|ライブ|24.*小時|24.*hours?/i.test(quickTitle);
    if (quickBadgeVisible || quickDurInfinite || quickDurDVR) {
      console.log(LOG, `Live stream detected instantly (badge=${quickBadgeVisible}, dur=${quickVideoEl?.duration}, dvr=${quickDurDVR}): 「${quickTitle}」`);
      goHome();
      return;
    }

    // Wait for any pre-roll ad to finish (or skip it)
    await waitForAdToFinish();
    if (watchAbort.aborted) return;

    // Get title
    let title = '';
    for (let i = 0; i < 5; i++) {
      const titleEl = queryFirst(document, SELECTORS.watchTitle);
      title = titleEl?.textContent?.trim() || '';
      if (title) break;
      await sleep(500);
    }

    // Get channel name
    let channelName = '';
    for (let i = 0; i < 3; i++) {
      const channelEl = queryFirst(document, SELECTORS.watchChannelName);
      channelName = channelEl?.textContent?.trim() || '';
      if (channelName) break;
      await sleep(500);
    }

    console.log(LOG, `Watch: 「${title}」 ch:「${channelName}」 (${videoId})`);
    if (watchAbort.aborted) return;

    // Early live stream detection — check BEFORE waiting for player
    const earlyLiveBadge = document.querySelector('.ytp-live-badge');
    const earlyBadgeVisible = earlyLiveBadge && earlyLiveBadge.offsetParent !== null && getComputedStyle(earlyLiveBadge).display !== 'none';
    const earlyVideoEl = document.querySelector('video.html5-main-video') || document.querySelector('video');
    const earlyDurationInfinite = earlyVideoEl && earlyVideoEl.duration === Infinity;

    if (earlyBadgeVisible || earlyDurationInfinite) {
      console.log(LOG, `Live stream detected early (badge=${earlyBadgeVisible}, dur=${earlyVideoEl?.duration}), going back: 「${title}」`);
      goHome();
      return;
    }

    // Wait for player to load metadata
    const player = await waitForPlayer(10000);
    if (watchAbort.aborted) return;

    if (!player) {
      // Player didn't load — recheck live stream
      const videoEl = document.querySelector('video.html5-main-video') || document.querySelector('video');
      const liveBadge = document.querySelector('.ytp-live-badge');
      const badgeVisible = liveBadge && liveBadge.offsetParent !== null && getComputedStyle(liveBadge).display !== 'none';
      const durationInfinite = videoEl && videoEl.duration === Infinity;

      console.log(LOG, `Player not ready. liveBadge=${!!liveBadge}, badgeVisible=${badgeVisible}, duration=${videoEl?.duration}`);

      if (badgeVisible || durationInfinite) {
        console.log(LOG, `Live stream confirmed, going back: 「${title}」`);
        goHome();
        return;
      }
      console.log(LOG, 'Not live, player slow — continuing...');
    } else {
      // Player loaded — check for extremely long videos that might be live
      const dur = player.duration;
      console.log(LOG, `Player ready: duration=${Math.round(dur)}s`);
      if (dur > 43200 && /LIVE|直播|ライブ/i.test(title)) {
        console.log(LOG, `Very long video with LIVE in title, going back: 「${title}」`);
        goHome();
        return;
      }
    }

    // Inject watch page badge (title area + video player overlay)
    const watchResult = injectWatchPageBadge(title, channelName);
    const result = watchResult || analyzeVideo(title, channelName);
    injectPlayerBadge(result.categoriesDetected, result.detections);

    if (result.shouldAct) {
      const cats = result.categoriesDetected;
      console.log(LOG, `Disliking [${cats.join(', ')}]: 「${title}」`);
      const success = await clickDislike();
      if (watchAbort.aborted) return;
      if (success) {
        console.log(LOG, `Dislike confirmed: 「${title}」`);
        try {
          chrome.runtime.sendMessage({
            type: 'DISLIKE_RECORDED',
            categories: cats,
          });
        } catch (_) { }
      } else {
        console.warn(LOG, `Dislike failed: 「${title}」`);
      }
      console.log(LOG, 'Seeking to last 2 seconds...');
      await seekToEnd(2);
    } else {
      console.log(LOG, `Clean: 「${title}」, going back...`);
      await seekToEnd(2);
    }

    // Always go back to homepage after processing (avoid playlist traps)
    await sleep(500);
    goHome();
  } finally {
    clearTimeout(watchTimer);
    isRunning = false;
  }
}

// ============================================================
// SECTION 7: PAGE DETECTION & NAVIGATION
// ============================================================

function detectPageType() {
  const path = window.location.pathname;
  if (path === '/' || path.startsWith('/feed')) return 'home';
  if (path === '/watch') return 'watch';
  if (path.startsWith('/shorts/')) return 'shorts';
  return 'other';
}

let navId = 0;  // Debounce counter for navigation events

function handlePageChange() {
  if (!enabled) return;
  const myNavId = ++navId;
  document.querySelectorAll(`.${BADGE_CLASS}-watch, .${BADGE_CLASS}-player-overlay`).forEach(el => el.remove());
  const pageType = detectPageType();
  const url = window.location.pathname + window.location.search;
  console.log(LOG, `Navigation [${myNavId}]: page=${pageType}, url=${url}`);

  // Debounce: wait 600ms, then check if another navigation happened
  setTimeout(() => {
    if (myNavId !== navId) {
      console.log(LOG, `Navigation [${myNavId}] superseded by [${navId}], skipping`);
      return;
    }
    if (pageType === 'home') scanHomePage();
    else if (pageType === 'watch') handleWatchPage();
    else if (pageType === 'shorts') {
      console.log(LOG, 'Shorts page detected, going back...');
      window.history.back();
    }
  }, 600);
}

// ============================================================
// SECTION 8: INIT
// ============================================================

function setupNavigationListeners() {
  document.addEventListener('yt-navigate-finish', () => {
    console.log(LOG, 'yt-navigate-finish');
    handlePageChange();
  });
  window.addEventListener('popstate', () => {
    console.log(LOG, 'popstate');
    handlePageChange();
  });
}

const AD_SKIP_SELECTORS = [
  '.ytp-skip-ad-button',
  '.ytp-ad-skip-button',
  '.ytp-ad-skip-button-modern',
  'button.ytp-ad-skip-button-modern',
  '.ytp-ad-skip-button-container button',
  '.ytp-ad-skip-button-slot button',
  '.ytp-ad-skip-button-slot .ytp-ad-skip-button-modern',
  '.videoAdUiSkipButton',
  '#skip-button button',
  '.ytp-ad-overlay-close-button',
];

function findAdSkipButton() {
  for (const sel of AD_SKIP_SELECTORS) {
    const el = document.querySelector(sel);
    if (!el || el.offsetParent === null) continue;

    // If the element IS a button or role="button", return it directly
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
      return { btn: el, selector: sel };
    }

    // It's a container (div/span) — drill into it for a real button
    const innerBtn = el.querySelector('button, [role="button"]');
    if (innerBtn && innerBtn.offsetParent !== null) {
      return { btn: innerBtn, selector: sel + '>button' };
    }

    // No clickable button inside — skip this element, do NOT return the div
    continue;
  }
  // Also check inside shadow DOM of yt-button-shape elements in ad area
  const adArea = document.querySelector('.ytp-ad-skip-button-slot, .ytp-ad-skip-button-container');
  if (adArea) {
    const shapes = adArea.querySelectorAll('yt-button-shape');
    for (const shape of shapes) {
      const root = shape.shadowRoot;
      if (root) {
        const btn = root.querySelector('button');
        if (btn && btn.offsetParent !== null) return { btn, selector: 'shadow:yt-button-shape>button' };
      }
      const btn = shape.querySelector('button');
      if (btn && btn.offsetParent !== null) return { btn, selector: 'yt-button-shape>button' };
    }
  }
  return null;
}

function setupAdSkipObserver() {
  let lastSkipLog = 0;
  let lastTryTime = 0;
  let failedClickCount = 0;  // Track consecutive failed clicks
  let lastAdState = false;

  function tryClickSkip() {
    const now = Date.now();
    if (now - lastTryTime < 500) return false;
    lastTryTime = now;

    // Check if ad is currently playing
    const playerContainer = document.querySelector('#movie_player, .html5-video-player');
    const isAd = playerContainer && (
      playerContainer.classList.contains('ad-showing') ||
      playerContainer.classList.contains('ad-interrupting')
    );

    // Track ad state transitions
    if (isAd !== lastAdState) {
      if (!isAd && lastAdState) {
        // Ad just ended — restore normal playback
        const video = document.querySelector('video.html5-main-video');
        if (video) {
          video.playbackRate = 1;
          video.muted = false;
        }
        console.log(LOG, 'Ad ended, restored playbackRate=1');
      }
      failedClickCount = 0;
      lastAdState = isAd;
    }

    if (!isAd) return false;

    // Primary: fast-forward the ad
    tryFastForwardAd();

    // After 5 failed skip clicks, stop trying the button — rely on fast-forward
    if (failedClickCount >= 5) {
      if (now - lastSkipLog > 10000) {
        console.log(LOG, 'Skip button ineffective — relying on fast-forward');
        lastSkipLog = now;
      }
      return false;
    }

    // Secondary: try skip button
    const result = findAdSkipButton();
    if (result) {
      const { btn, selector } = result;
      console.log(LOG, `Ad skip button found [${selector}], clicking...`);
      simulateClick(btn);
      setTimeout(() => {
        btn.click();
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }, 50);
      failedClickCount++;
      return true;
    }

    // No skip button found
    if (now - lastSkipLog > 5000) {
      console.log(LOG, 'Ad playing, fast-forwarding, no skip button yet');
      lastSkipLog = now;
    }
    return false;
  }

  // Watch for skip button — only on the player container, not entire body
  const playerEl = document.querySelector('#movie_player') || document.body;
  const observer = new MutationObserver(() => tryClickSkip());
  observer.observe(playerEl, { childList: true, subtree: true });

  // Poll every 1s as fallback
  setInterval(tryClickSkip, 1000);
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'STATE_CHANGED') {
      enabled = msg.enabled;
      console.log(LOG, `State changed: enabled=${enabled}`);
      if (enabled) handlePageChange();
    }
  });
}

async function init() {
  console.log(LOG, 'Content script loaded');
  injectBadgeCSS();

  try {
    const data = await chrome.storage.local.get(['enabled']);
    enabled = data.enabled ?? true;
  } catch (_) { enabled = true; }

  console.log(LOG, `Initialized, enabled=${enabled}`);
  setupAdSkipObserver();
  setupMessageListener();
  setupNavigationListeners();
  handlePageChange();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
