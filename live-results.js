// =============================================================================
// LIVE RESULTS — Mentimeter-style word cloud
// =============================================================================
// PASTE YOUR PUBLISHED GOOGLE SHEETS CSV URL HERE:
const RESULTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpFde2T9Aieyt5lKHF7yScDD_HQpZ9St8wdX5nboTaZWjAny1STNhmng_nh0ml5UQSo76taq_99Evp/pub?output=csv';

const HISTORY_KEY = 'ecoQuizHistory';
const ARCHETYPE_META = {
  'Captain Sustainables':  { key: 'captainSustainables',  icon: '♻️', color: '#4a7c59' },
  'Warrior of the Wild':   { key: 'warriorOfTheWild',     icon: '🌲', color: '#2c4a2e' },
  'Dr. Environlove':       { key: 'drEnvironlove',        icon: '🔬', color: '#7aab8a' },
  'Sir Animalot':          { key: 'sirAnimalot',          icon: '🐾', color: '#8c6d3f' },
};

let autoRefreshTimer = null;

// =============================================================================
// DATA SOURCES
// =============================================================================
async function fetchGoogleSheets() {
  if (!RESULTS_CSV_URL || RESULTS_CSV_URL.includes('PASTE_PUBLIC')) {
    throw new Error('No CSV URL configured');
  }
  const res = await fetch(RESULTS_CSV_URL);
  if (!res.ok) throw new Error('CSV fetch failed');
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').slice(1); // skip header
  const counts = {};
  lines.forEach(line => {
    const [archetype, count] = line.split(',');
    if (archetype && count) {
      counts[archetype.trim()] = parseInt(count.trim(), 10) || 0;
    }
  });
  return counts;
}

function loadLocalStorage() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    const counts = {};
    Object.keys(ARCHETYPE_META).forEach(name => { counts[name] = 0; });
    history.forEach(r => {
      const name = Object.keys(ARCHETYPE_META).find(n => ARCHETYPE_META[n].key === r.primary);
      if (name) counts[name]++;
    });
    return counts;
  } catch {
    return {};
  }
}

function getDemoData() {
  return {
    'Captain Sustainables': 12,
    'Warrior of the Wild': 8,
    'Dr. Environlove': 20,
    'Sir Animalot': 5,
  };
}

// =============================================================================
// RENDER WORD CLOUD
// =============================================================================
function renderCloud(counts, source) {
  const cloudEl = document.getElementById('live-cloud');
  const sourceEl = document.getElementById('live-source');
  const totalEl = document.getElementById('live-total');
  const updatedEl = document.getElementById('live-updated');
  const breakdownEl = document.getElementById('live-breakdown');

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Update status
  if (source === 'sheets') {
    sourceEl.textContent = '🌐 Showing shared Google Sheets results';
    sourceEl.className = 'live-source live-source--sheets';
  } else if (source === 'local') {
    sourceEl.textContent = '💾 Showing local test results';
    sourceEl.className = 'live-source live-source--local';
  } else {
    sourceEl.textContent = '🎭 Showing demo data';
    sourceEl.className = 'live-source live-source--demo';
  }
  totalEl.textContent = `${total} response${total !== 1 ? 's' : ''}`;
  updatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

  // Build word cloud
  const entries = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    meta: ARCHETYPE_META[name],
  })).filter(e => e.meta);

  const maxCount = Math.max(...entries.map(e => e.count), 1);

  cloudEl.innerHTML = '';
  entries.forEach((e, i) => {
    const pct = e.count / maxCount;
    const fontSize = 1.2 + pct * 2.8; // 1.2rem to 4rem
    const opacity = 0.7 + pct * 0.3;

    const word = document.createElement('div');
    word.className = 'cloud-word';
    word.style.fontSize = fontSize + 'rem';
    word.style.color = e.meta.color;
    word.style.opacity = opacity;
    word.style.animationDelay = (i * 0.1) + 's';
    word.innerHTML = `<span class="cloud-icon">${e.meta.icon}</span> ${e.name}`;
    cloudEl.appendChild(word);
  });

  // Breakdown list
  breakdownEl.innerHTML = '<h3>Breakdown</h3>';
  entries.sort((a, b) => b.count - a.count).forEach(e => {
    const pct = total > 0 ? Math.round(e.count / total * 100) : 0;
    const row = document.createElement('div');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <span class="breakdown-name">${e.meta.icon} ${e.name}</span>
      <span class="breakdown-bar-wrap">
        <span class="breakdown-bar" style="width: ${pct}%; background: ${e.meta.color};"></span>
      </span>
      <span class="breakdown-count">${e.count} (${pct}%)</span>`;
    breakdownEl.appendChild(row);
  });
}

// =============================================================================
// LOAD DATA
// =============================================================================
async function loadData() {
  try {
    const counts = await fetchGoogleSheets();
    renderCloud(counts, 'sheets');
  } catch {
    const localCounts = loadLocalStorage();
    const localTotal = Object.values(localCounts).reduce((a, b) => a + b, 0);
    if (localTotal > 0) {
      renderCloud(localCounts, 'local');
    } else {
      renderCloud(getDemoData(), 'demo');
    }
  }
}

// =============================================================================
// AUTO-REFRESH
// =============================================================================
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  if (!RESULTS_CSV_URL || RESULTS_CSV_URL.includes('PASTE_PUBLIC')) return;
  autoRefreshTimer = setInterval(() => {
    loadData();
  }, 12000); // 12 seconds
}

// =============================================================================
// INIT
// =============================================================================
document.getElementById('btn-refresh').addEventListener('click', () => {
  loadData();
});

loadData();
startAutoRefresh();
