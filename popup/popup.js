const toggleSwitch = document.getElementById('toggleSwitch');
const statusDot = document.getElementById('statusDot');
const totalDislikes = document.getElementById('totalDislikes');
const totalDontRecommend = document.getElementById('totalDontRecommend');
const resetBtn = document.getElementById('resetBtn');

const CATEGORY_IDS = [
  'simplified_chinese', 'content_farm', 'ai_fake_knowledge',
  'china_propaganda', 'china_origin', 'ai_generated',
];

function updateUI(enabled, stats) {
  toggleSwitch.checked = enabled;
  statusDot.classList.toggle('active', enabled);
  totalDislikes.textContent = stats?.totalDislikes ?? 0;
  if (totalDontRecommend) totalDontRecommend.textContent = stats?.totalDontRecommend ?? 0;

  // Update per-category counts
  const byCategory = stats?.byCategory || {};
  for (const cat of CATEGORY_IDS) {
    const el = document.getElementById(`cat-${cat}`);
    if (el) el.textContent = byCategory[cat] ?? 0;
  }
}

// Load state on popup open
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (response) {
    updateUI(response.enabled, response.stats);
  }
});

// Toggle handler
toggleSwitch.addEventListener('change', () => {
  const newEnabled = toggleSwitch.checked;
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: newEnabled }, () => {
    statusDot.classList.toggle('active', newEnabled);
  });
});

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

// Listen for real-time stats updates from background
chrome.runtime.onMessage.addListener((msg) => {
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
