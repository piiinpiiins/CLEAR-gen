// Dont_Recommend Background Service Worker

const DEFAULT_STATE = {
  autoRun: false,     // user toggle (Auto Run ON/OFF)
  enabled: false,     // effective running state for content scripts
  scheduleStart: '',  // HH:MM or empty
  scheduleEnd: '',    // HH:MM or empty
  interval: '5',      // interval in minutes (3 or 5)
  stats: {
    totalDislikes: 0,
    totalDontRecommend: 0,
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
    console.log('[Dont_Recommend] Extension installed, defaults set');
  }
  if (details.reason === 'update') {
    const data = await chrome.storage.local.get(['stats']);
    if (data.stats && !data.stats.byCategory) {
      data.stats.byCategory = { ...DEFAULT_STATE.stats.byCategory };
      await chrome.storage.local.set({ stats: data.stats });
      console.log('[Dont_Recommend] Stats migrated to include byCategory');
    }
  }
});

// --- Schedule helpers ---

function parseHHMM(str) {
  if (!str || !str.includes(':')) return null;
  const [h, m] = str.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { h, m };
}

function isTimeInRange(now, start, end) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = start.h * 60 + start.m;
  const endMin = end.h * 60 + end.m;
  if (startMin <= endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  // Crosses midnight (e.g. 23:00 ~ 02:00)
  return nowMin >= startMin || nowMin < endMin;
}

function broadcastEnabled(effectiveEnabled) {
  chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'STATE_CHANGED',
        enabled: effectiveEnabled,
      }).catch(() => { });
    }
  });
}

/** Compute effective enabled: autoRun AND (no schedule OR in time window) */
function computeEffectiveEnabled(autoRun, scheduleStart, scheduleEnd) {
  if (!autoRun) return false;
  const start = parseHHMM(scheduleStart);
  const end = parseHHMM(scheduleEnd);
  if (!start || !end) return true; // no schedule → run immediately
  return isTimeInRange(new Date(), start, end);
}

async function applyEffectiveState() {
  const data = await chrome.storage.local.get(['autoRun', 'scheduleStart', 'scheduleEnd', 'enabled']);
  const effective = computeEffectiveEnabled(data.autoRun, data.scheduleStart, data.scheduleEnd);
  if (effective !== (data.enabled ?? false)) {
    await chrome.storage.local.set({ enabled: effective });
    broadcastEnabled(effective);
  }
}

async function setupScheduleAlarm() {
  const data = await chrome.storage.local.get(['autoRun', 'scheduleStart', 'scheduleEnd']);
  if (data.autoRun && data.scheduleStart && data.scheduleEnd) {
    await chrome.alarms.create('schedule-check', { periodInMinutes: 1 });
  } else {
    await chrome.alarms.clear('schedule-check');
  }
}

// Message handler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(['autoRun', 'enabled', 'stats']).then((data) => {
      const stats = data.stats ?? DEFAULT_STATE.stats;
      if (!stats.byCategory) stats.byCategory = { ...DEFAULT_STATE.stats.byCategory };
      sendResponse({
        autoRun: data.autoRun ?? false,
        enabled: data.enabled ?? false,
        stats,
      });
    });
    return true;
  }

  if (msg.type === 'SET_AUTO_RUN') {
    const autoRun = msg.autoRun;
    chrome.storage.local.get(['scheduleStart', 'scheduleEnd']).then(async (data) => {
      const effective = computeEffectiveEnabled(autoRun, data.scheduleStart, data.scheduleEnd);
      await chrome.storage.local.set({ autoRun, enabled: effective });
      broadcastEnabled(effective);
      if (autoRun) {
        await setupScheduleAlarm();
      } else {
        await chrome.alarms.clear('schedule-check');
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'SET_SCHEDULE') {
    chrome.storage.local.set({
      scheduleStart: msg.scheduleStart || '',
      scheduleEnd: msg.scheduleEnd || '',
      interval: msg.interval || '5',
    }).then(async () => {
      await applyEffectiveState();
      await setupScheduleAlarm();
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'GET_SCHEDULE') {
    chrome.storage.local.get(['scheduleStart', 'scheduleEnd', 'interval']).then((data) => {
      sendResponse({
        scheduleStart: data.scheduleStart || '',
        scheduleEnd: data.scheduleEnd || '',
        interval: data.interval || '5',
      });
    });
    return true;
  }

  if (msg.type === 'DISLIKE_RECORDED') {
    chrome.storage.local.get(['stats']).then((data) => {
      const stats = data.stats ?? { ...DEFAULT_STATE.stats };
      if (!stats.byCategory) stats.byCategory = { ...DEFAULT_STATE.stats.byCategory };
      stats.totalDislikes++;
      stats.lastDislikedAt = Date.now();
      if (msg.categories && Array.isArray(msg.categories)) {
        for (const cat of msg.categories) {
          if (cat in stats.byCategory) stats.byCategory[cat]++;
        }
      }
      chrome.storage.local.set({ stats });
      chrome.runtime.sendMessage({ type: 'STATS_UPDATED', stats }).catch(() => { });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'DONT_RECOMMEND_RECORDED') {
    chrome.storage.local.get(['stats']).then((data) => {
      const stats = data.stats ?? { ...DEFAULT_STATE.stats };
      if (!stats.byCategory) stats.byCategory = { ...DEFAULT_STATE.stats.byCategory };
      stats.totalDontRecommend = (stats.totalDontRecommend || 0) + 1;
      if (msg.categories && Array.isArray(msg.categories)) {
        for (const cat of msg.categories) {
          if (cat in stats.byCategory) stats.byCategory[cat]++;
        }
      }
      chrome.storage.local.set({ stats });
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

// --- Schedule Alarm ---

async function checkSchedule() {
  const data = await chrome.storage.local.get(['autoRun', 'enabled', 'scheduleStart', 'scheduleEnd']);
  if (!data.autoRun) return;

  const start = parseHHMM(data.scheduleStart);
  const end = parseHHMM(data.scheduleEnd);
  if (!start || !end) return;

  const inRange = isTimeInRange(new Date(), start, end);

  if (inRange && !data.enabled) {
    // Entered schedule window — activate
    console.log('[Dont_Recommend] Schedule started, activating');
    await chrome.storage.local.set({ enabled: true });
    broadcastEnabled(true);
  } else if (!inRange && data.enabled) {
    // Left schedule window — auto turn OFF completely
    console.log('[Dont_Recommend] Schedule ended, auto turning OFF');
    await chrome.storage.local.set({ autoRun: false, enabled: false });
    await chrome.alarms.clear('schedule-check');
    broadcastEnabled(false);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'schedule-check') checkSchedule();
});
