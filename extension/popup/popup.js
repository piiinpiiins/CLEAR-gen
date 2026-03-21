const toggleSwitch = document.getElementById('toggleSwitch');
const statusDot = document.getElementById('statusDot');
const totalDislikes = document.getElementById('totalDislikes');
const totalDontRecommend = document.getElementById('totalDontRecommend');
const resetBtn = document.getElementById('resetBtn');
const scheduleStartInput = document.getElementById('scheduleStart');
const scheduleEndInput = document.getElementById('scheduleEnd');
const intervalSelect = document.getElementById('intervalSelect');

const CATEGORY_IDS = [
  'simplified_chinese', 'content_farm', 'ai_fake_knowledge',
  'china_propaganda', 'china_origin', 'ai_generated',
];

function updateUI(autoRun, enabled, stats) {
  toggleSwitch.checked = autoRun;
  // Green dot = actually running; toggle can be ON but dot stays grey if waiting for schedule
  statusDot.classList.toggle('active', enabled);
  totalDislikes.textContent = stats?.totalDislikes ?? 0;
  if (totalDontRecommend) totalDontRecommend.textContent = stats?.totalDontRecommend ?? 0;

  const byCategory = stats?.byCategory || {};
  for (const cat of CATEGORY_IDS) {
    const el = document.getElementById(`cat-${cat}`);
    if (el) el.textContent = byCategory[cat] ?? 0;
  }
}

// Load state on popup open
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (response) {
    updateUI(response.autoRun, response.enabled, response.stats);
  }
});

// Helper function to format time as HH:MM
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Load schedule and interval on popup open
chrome.runtime.sendMessage({ type: 'GET_SCHEDULE' }, (response) => {
  if (response) {
    scheduleStartInput.value = response.scheduleStart || '';
    scheduleEndInput.value = response.scheduleEnd || '';

    // Load saved interval or default to 5 minutes
    if (response.interval) {
      intervalSelect.value = response.interval;
    }
  }
});

// Toggle handler — controls autoRun and sets initial schedule
toggleSwitch.addEventListener('change', () => {
  const autoRun = toggleSwitch.checked;

  // When turning ON, auto-fill schedule with current time + selected interval
  if (autoRun && !scheduleStartInput.value && !scheduleEndInput.value) {
    const now = new Date();
    const intervalMinutes = parseInt(intervalSelect.value);
    const endTime = new Date(now.getTime() + intervalMinutes * 60 * 1000);

    scheduleStartInput.value = formatTime(now);
    scheduleEndInput.value = formatTime(endTime);

    // Save the schedule immediately
    saveSchedule();
  }

  chrome.runtime.sendMessage({ type: 'SET_AUTO_RUN', autoRun });
});

// --- 24h time input helpers ---
function formatTimeInput(input) {
  let v = input.value.replace(/[^0-9:]/g, '');
  if (v.length === 2 && !v.includes(':')) v += ':';
  if (v.length === 4 && !v.includes(':')) v = v.slice(0, 2) + ':' + v.slice(2);
  input.value = v.slice(0, 5);
}

function isValidTime(str) {
  if (!/^\d{2}:\d{2}$/.test(str)) return false;
  const [h, m] = str.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function setupTimeInput(input) {
  input.addEventListener('input', () => formatTimeInput(input));
  input.addEventListener('blur', () => {
    if (input.value && !isValidTime(input.value)) {
      input.value = '';
    }
    saveSchedule();
  });
}

setupTimeInput(scheduleStartInput);
setupTimeInput(scheduleEndInput);

// Handle interval change - update end time when interval changes
intervalSelect.addEventListener('change', () => {
  // Only update if we have a start time
  if (scheduleStartInput.value && isValidTime(scheduleStartInput.value)) {
    const [h, m] = scheduleStartInput.value.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(h, m, 0, 0);

    const intervalMinutes = parseInt(intervalSelect.value);
    const endTime = new Date(startTime.getTime() + intervalMinutes * 60 * 1000);

    scheduleEndInput.value = formatTime(endTime);
    saveSchedule();
  } else {
    // Just save the interval preference
    saveSchedule();
  }
});

function saveSchedule() {
  const start = scheduleStartInput.value;
  const end = scheduleEndInput.value;
  const interval = intervalSelect.value;
  if ((start && !isValidTime(start)) || (end && !isValidTime(end))) return;
  chrome.runtime.sendMessage({
    type: 'SET_SCHEDULE',
    scheduleStart: start,
    scheduleEnd: end,
    interval: interval,
  });
}

// Reset stats
resetBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RESET_STATS' }, () => {
    totalDislikes.textContent = '0';
    if (totalDontRecommend) totalDontRecommend.textContent = '0';
    for (const cat of CATEGORY_IDS) {
      const el = document.getElementById(`cat-${cat}`);
      if (el) el.textContent = '0';
    }
  });
});

// Listen for real-time updates from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATE_CHANGED') {
    // Update running indicator; also sync toggle if autoRun was turned off by schedule
    statusDot.classList.toggle('active', msg.enabled);
    if (!msg.enabled) {
      // Re-fetch autoRun state to sync toggle (schedule may have auto-turned it off)
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (response) toggleSwitch.checked = response.autoRun;
      });
    }
  }
  if (msg.type === 'STATS_UPDATED' && msg.stats) {
    totalDislikes.textContent = msg.stats.totalDislikes ?? 0;
    if (totalDontRecommend) totalDontRecommend.textContent = msg.stats.totalDontRecommend ?? 0;
    const byCategory = msg.stats.byCategory || {};
    for (const cat of CATEGORY_IDS) {
      const el = document.getElementById(`cat-${cat}`);
      if (el) el.textContent = byCategory[cat] ?? 0;
    }
  }
});
