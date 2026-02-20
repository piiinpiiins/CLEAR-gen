// CLEAR-gen Background Service Worker

const DEFAULT_STATE = {
  enabled: true,
  stats: {
    totalDislikes: 0,
    lastDislikedAt: null,
  },
};

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set(DEFAULT_STATE);
    console.log('[CLEAR-gen] Extension installed, defaults set');
  }
});

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(['enabled', 'stats']).then((data) => {
      sendResponse({
        enabled: data.enabled ?? DEFAULT_STATE.enabled,
        stats: data.stats ?? DEFAULT_STATE.stats,
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
          }).catch(() => {});
        }
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'DISLIKE_RECORDED') {
    chrome.storage.local.get(['stats']).then((data) => {
      const stats = data.stats ?? DEFAULT_STATE.stats;
      stats.totalDislikes++;
      stats.lastDislikedAt = Date.now();
      chrome.storage.local.set({ stats });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'RESET_STATS') {
    chrome.storage.local.set({ stats: DEFAULT_STATE.stats }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
