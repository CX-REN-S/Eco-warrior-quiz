// =============================================================================
// LIVE RESULTS — Mentimeter-style word cloud
// =============================================================================
// PASTE YOUR PUBLISHED GOOGLE SHEETS CSV URL HERE:
const RESULTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpFde2T9Aieyt5lKHF7yScDD_HQpZ9St8wdX5nboTaZWjAny1STNhmng_nh0ml5UQSo76taq_99Evp/pub?gid=808851534&single=true&output=csv';

const HISTORY_KEY = 'ecoQuizHistory';
const ARCHETYPE_META = {
  'Captain Sustainables':  { key: 'captainSustainables',  icon: '♻️', color: '#4a7c59' },
  'Warrior of the Wild':   { key: 'warriorOfTheWild',     icon: '🌲', color: '#2c4a2e' },
  'Dr. Environlove':       { key: 'drEnvironlove',        icon: '🔬', color: '#7aab8a' },
  'Sir Animalot':          { key: 'sirAnimalot',          icon: '🐾', color: '#8c6d3f' },
};
const VALID_ARCHETYPES = Object.keys(ARCHETYPE_META);
const MAX_REASONABLE_COUNT = 100000;
const CSV_FORMAT_ERROR_MSG = 'The connected Google Sheets CSV does not look like the PublicSummary sheet. Please publish the PublicSummary tab as CSV.';

let autoRefreshTimer = null;

// =============================================================================
// CSV FETCH + VALIDATION
// =============================================================================
async function fetchGoogleSheets() {
  if (!RESULTS_CSV_URL || RESULTS_CSV_URL.includes('PASTE_PUBLIC')) {
    return { status: 'unconfigured' };
  }
  let res;
  try {
    res = await fetch(RESULTS_CSV_URL);
  } catch (e) {
    return { status: 'fetch-error', error: e.message };
  }
  if (!res.ok) return { status: 'fetch-error', error: `HTTP ${res.status}` };
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { status: 'format-error', error: CSV_FORMAT_ERROR_MSG, preview: lines.slice(0, 4) };
  }

  // Validate header — must contain 'archetype' and 'count' columns
  const headerCells = lines[0].toLowerCase().split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  const archIdx  = headerCells.indexOf('archetype');
  const countIdx = headerCells.indexOf('count');

  if (archIdx === -1 || countIdx === -1) {
    return {
      status: 'format-error',
      error: CSV_FORMAT_ERROR_MSG,
      reason: 'header-mismatch',
      preview: lines.slice(0, 4),
      headerFound: lines[0],
    };
  }

  // Parse and validate each data row
  const counts = {};
  const invalidRows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const archetype = cells[archIdx];
    const countStr  = cells[countIdx];
    const count     = parseInt(countStr, 10);

    if (!VALID_ARCHETYPES.includes(archetype)) {
      invalidRows.push({ row: i + 1, archetype, countStr, reason: 'invalid-archetype' });
      continue;
    }
    if (!Number.isInteger(count) || count < 0 || count > MAX_REASONABLE_COUNT) {
      invalidRows.push({ row: i + 1, archetype, countStr, reason: 'invalid-count' });
      continue;
    }
    counts[archetype] = count;
  }

  if (Object.keys(counts).length === 0) {
    return {
      status: 'format-error',
      error: CSV_FORMAT_ERROR_MSG,
      reason: 'no-valid-rows',
      preview: lines.slice(0, 4),
      invalidRows,
    };
  }

  // Fill missing archetypes with zero so the cloud always shows all four
  VALID_ARCHETYPES.forEach(name => {
    if (counts[name] === undefined) counts[name] = 0;
  });

  return { status: 'ok', counts, invalidRows };
}

// =============================================================================
// FALLBACK DATA SOURCES
// =============================================================================
function loadLocalStorage() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    const counts = {};
    VALID_ARCHETYPES.forEach(name => { counts[name] = 0; });
    history.forEach(r => {
      const name = VALID_ARCHETYPES.find(n => ARCHETYPE_META[n].key === r.primary);
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
// RENDER
// =============================================================================
function renderCloud(counts, source, formatErrorMsg) {
  const cloudEl     = document.getElementById('live-cloud');
  const sourceEl    = document.getElementById('live-source');
  const totalEl     = document.getElementById('live-total');
  const updatedEl   = document.getElementById('live-updated');
  const breakdownEl = document.getElementById('live-breakdown');
  const noticeEl    = document.getElementById('live-notice');

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Notice banner (only shown when format error is active)
  if (formatErrorMsg) {
    noticeEl.textContent = formatErrorMsg;
    noticeEl.classList.remove('hidden');
  } else {
    noticeEl.classList.add('hidden');
    noticeEl.textContent = '';
  }

  // Source status line
  if (formatErrorMsg) {
    const fallbackLabel = source === 'local' ? 'showing local data as fallback' : 'showing demo data';
    sourceEl.textContent = `⚠️ Google Sheets CSV format error — ${fallbackLabel}`;
    sourceEl.className = 'live-source live-source--error';
  } else if (source === 'sheets') {
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

  // Word cloud
  const entries = Object.entries(counts)
    .map(([name, count]) => ({ name, count, meta: ARCHETYPE_META[name] }))
    .filter(e => e.meta);

  const maxCount = Math.max(...entries.map(e => e.count), 1);

  cloudEl.innerHTML = '';
  entries.forEach((e, i) => {
    const pct = e.count / maxCount;
    const fontSize = 1.2 + pct * 2.8;
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

  // Breakdown
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
// LOAD ORCHESTRATION
// =============================================================================
async function loadData() {
  const sheetsResult = await fetchGoogleSheets();

  if (sheetsResult.status === 'ok') {
    renderCloud(sheetsResult.counts, 'sheets', null);
    return;
  }

  let formatErrorMsg = null;
  if (sheetsResult.status === 'format-error') {
    formatErrorMsg = sheetsResult.error;
    console.warn('Google Sheets CSV format error:', sheetsResult.error);
    if (sheetsResult.headerFound) {
      console.warn('Header row found:', sheetsResult.headerFound);
    }
    if (sheetsResult.preview) {
      console.warn('First parsed rows:', sheetsResult.preview);
    }
    if (sheetsResult.invalidRows && sheetsResult.invalidRows.length) {
      console.warn('Invalid rows (first 5):', sheetsResult.invalidRows.slice(0, 5));
    }
  } else if (sheetsResult.status === 'fetch-error') {
    console.warn('Google Sheets fetch failed:', sheetsResult.error);
  }

  const localCounts = loadLocalStorage();
  const localTotal = Object.values(localCounts).reduce((a, b) => a + b, 0);
  if (localTotal > 0) {
    renderCloud(localCounts, 'local', formatErrorMsg);
  } else {
    renderCloud(getDemoData(), 'demo', formatErrorMsg);
  }
}

// =============================================================================
// AUTO-REFRESH
// =============================================================================
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  if (!RESULTS_CSV_URL || RESULTS_CSV_URL.includes('PASTE_PUBLIC')) return;
  autoRefreshTimer = setInterval(loadData, 12000);
}

// =============================================================================
// INIT
// =============================================================================
document.getElementById('btn-refresh').addEventListener('click', loadData);
loadData();
startAutoRefresh();
