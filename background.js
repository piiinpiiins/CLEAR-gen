// CLEAR-gen Background Service Worker

const DEFAULT_STATE = {
  enabled: true,
  stats: {
    totalDislikes: 0,
    byCategory: {
      simplified_chinese: 0,
      content_farm: 0,
      ai_fake_knowledge: 0,
      china_propaganda: 0,
      china_origin: 0,
      ai_generated: 0,
    },
    lastDislikedAt: null,
  },
};

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set(DEFAULT_STATE);
    console.log('[CLEAR-gen] Extension installed, defaults set');
  }
  // On update, migrate stats to include byCategory if missing
  if (details.reason === 'update') {
    const data = await chrome.storage.local.get(['stats']);
    if (data.stats && !data.stats.byCategory) {
      data.stats.byCategory = { ...DEFAULT_STATE.stats.byCategory };
      await chrome.storage.local.set({ stats: data.stats });
      console.log('[CLEAR-gen] Stats migrated to include byCategory');
    }
  }
});

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(['enabled', 'stats']).then((data) => {
      const stats = data.stats ?? DEFAULT_STATE.stats;
      // Ensure byCategory exists (migration safety)
      if (!stats.byCategory) stats.byCategory = { ...DEFAULT_STATE.stats.byCategory };
      sendResponse({
        enabled: data.enabled ?? DEFAULT_STATE.enabled,
        stats,
      });
    });
    return true;
  }

  if (msg.type === 'SET_ENABLED') {
    chrome.storage.local.set({ enabled: msg.enabled }).then(() => {
      // Broadcast to all YouTube tabs
      chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'STATE_CHANGED',
            enabled: msg.enabled,
          }).catch(() => { });
        }
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'DISLIKE_RECORDED') {
    chrome.storage.local.get(['stats']).then((data) => {
      const stats = data.stats ?? { ...DEFAULT_STATE.stats };
      if (!stats.byCategory) stats.byCategory = { ...DEFAULT_STATE.stats.byCategory };
      stats.totalDislikes++;
      stats.lastDislikedAt = Date.now();
      // Increment per-category counts
      if (msg.categories && Array.isArray(msg.categories)) {
        for (const cat of msg.categories) {
          if (cat in stats.byCategory) {
            stats.byCategory[cat]++;
          }
        }
      }
      chrome.storage.local.set({ stats });
      // Broadcast updated stats to all extension pages (popup)
      chrome.runtime.sendMessage({ type: 'STATS_UPDATED', stats }).catch(() => { });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'RESET_STATS') {
    chrome.storage.local.set({ stats: { ...DEFAULT_STATE.stats } }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
