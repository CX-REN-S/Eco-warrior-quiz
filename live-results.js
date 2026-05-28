// =============================================================================
// LIVE RESULTS — Pledge word cloud
// =============================================================================
const PLEDGES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpFde2T9Aieyt5lKHF7yScDD_HQpZ9St8wdX5nboTaZWjAny1STNhmng_nh0ml5UQSo76taq_99Evp/pub?gid=1837305357&single=true&output=csv';

const PLEDGE_COLORS        = ['#2c4a2e','#4a7c59','#7aab8a','#8c6d3f','#5a8a6a','#3d6b4f','#6b9e7a','#a07840'];
const SKIP_PLEDGES         = new Set(['other (please specify)', 'other']);
const MAX_REASONABLE_COUNT = 100000;
const MAX_DISPLAY_PLEDGES  = 200;
const CSV_FORMAT_ERROR_MSG = 'The connected Google Sheets CSV does not look like the PublicPledges sheet (expected columns: pledge, count).';

let autoRefreshTimer = null;

// =============================================================================
// TEXT SANITISE
// =============================================================================
function sanitisePledge(raw) {
  const s = raw.replace(/\s+/g, ' ').trim().slice(0, 50);
  if (!s) return null;
  if (SKIP_PLEDGES.has(s.toLowerCase())) return null;
  // Skip strings that are mostly one repeated character (gibberish guard)
  if (s.length > 6 && /^(.)\1+$/.test(s.replace(/\s/g, ''))) return null;
  return s;
}

// =============================================================================
// CSV FETCH + PARSE
// =============================================================================
async function fetchGoogleSheets() {
  if (!PLEDGES_CSV_URL || PLEDGES_CSV_URL.includes('PASTE_PUBLIC')) return { status: 'unconfigured' };
  let res;
  try { res = await fetch(PLEDGES_CSV_URL); } catch (e) { return { status: 'fetch-error', error: e.message }; }
  if (!res.ok) return { status: 'fetch-error', error: `HTTP ${res.status}` };
  return parseCSV(await res.text());
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { status: 'format-error', error: CSV_FORMAT_ERROR_MSG };

  const header    = lines[0].toLowerCase().split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  const pledgeIdx = header.indexOf('pledge');
  const countIdx  = header.indexOf('count');
  if (pledgeIdx === -1 || countIdx === -1) {
    return { status: 'format-error', error: CSV_FORMAT_ERROR_MSG, headerFound: lines[0] };
  }

  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const cells  = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const pledge = sanitisePledge(cells[pledgeIdx] || '');
    const count  = parseInt(cells[countIdx], 10);
    if (!pledge) continue;
    if (!Number.isInteger(count) || count < 0 || count > MAX_REASONABLE_COUNT) continue;
    entries.push({ pledge, count });
  }

  if (entries.length === 0) return { status: 'format-error', error: CSV_FORMAT_ERROR_MSG };
  return { status: 'ok', entries };
}

function getDemoData() {
  return [
    { pledge: 'join a community green initiative', count: 7 },
    { pledge: 'reduce my carbon footprint',        count: 6 },
    { pledge: 'protect local wildlife habitats',   count: 5 },
    { pledge: 'adopt or foster an animal',         count: 4 },
    { pledge: 'throw money at tigers',             count: 1 },
  ];
}

// =============================================================================
// RENDER
// =============================================================================
function renderCloud(entries, source, errorMsg) {
  const cloudEl   = document.getElementById('live-cloud');
  const sourceEl  = document.getElementById('live-source');
  const totalEl   = document.getElementById('live-total');
  const updatedEl = document.getElementById('live-updated');
  const noticeEl  = document.getElementById('live-notice');

  const total = entries.reduce((a, e) => a + e.count, 0);

  if (errorMsg) {
    noticeEl.textContent = errorMsg;
    noticeEl.classList.remove('hidden');
  } else {
    noticeEl.classList.add('hidden');
    noticeEl.textContent = '';
  }

  if (errorMsg) {
    sourceEl.textContent = '⚠️ Google Sheets CSV format error — showing demo data';
    sourceEl.className   = 'live-source live-source--error';
  } else if (source === 'sheets') {
    sourceEl.textContent = '🌐 Showing live pledge results';
    sourceEl.className   = 'live-source live-source--sheets';
  } else {
    sourceEl.textContent = '🎭 Showing demo data';
    sourceEl.className   = 'live-source live-source--demo';
  }

  totalEl.textContent   = `${total} pledge${total !== 1 ? 's' : ''}`;
  updatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

  const sorted   = [...entries].sort((a, b) => b.count - a.count).slice(0, MAX_DISPLAY_PLEDGES);
  const n        = sorted.length;
  const maxCount = Math.max(...sorted.map(e => e.count), 1);

  const isMobile = window.innerWidth < 768;

  // Global density scale: 1.0 at ≤10 pledges, ~0.38 at 200.
  const densityScale = Math.max(0.38, 1 / Math.pow(n / 10, 0.52));

  const minRem = isMobile ? 0.65 : 0.95;
  const maxRem = isMobile ? 1.3  : 2.6;

  // Build items with final font sizes.
  const items = sorted.map((e, i) => {
    const pct     = e.count / maxCount;
    const rem     = (minRem + pct * (maxRem - minRem)) * densityScale;
    return {
      pledge:  e.pledge,
      rem,
      pct,
      opacity: 0.60 + pct * 0.40,
      color:   PLEDGE_COLORS[i % PLEDGE_COLORS.length],
    };
  });

  // ------------------------------------------------------------------
  // Ring assignment (by rank index, 0-based):
  //   0        → center
  //   1–6      → inner ring  (up to 6 items)
  //   7–24     → middle ring (up to 18 items)
  //   25+      → outer bands (groups of ~24, split top/bottom)
  //
  // Each ring is rendered as one or two flex rows that wrap naturally.
  // No absolute positioning — overlap is impossible by construction.
  // ------------------------------------------------------------------
  const center = items[0];
  const inner  = items.slice(1, 7);
  const middle = items.slice(7, 25);
  const outer  = items.slice(25);

  // Split an array into two halves: first half goes "top", second "bottom".
  function halve(arr) {
    const mid = Math.ceil(arr.length / 2);
    return [arr.slice(0, mid), arr.slice(mid)];
  }

  // Chunk outer pledges into bands of ~24 for additional top/bottom rows.
  function chunkOuter(arr, size) {
    const bands = [];
    for (let i = 0; i < arr.length; i += size) bands.push(arr.slice(i, i + size));
    return bands;
  }

  function makeSpan(item, idx) {
    const el = document.createElement('span');
    el.className            = 'cloud-word';
    el.textContent          = item.pledge;
    el.style.fontSize       = item.rem.toFixed(2) + 'rem';
    el.style.color          = item.color;
    el.style.opacity        = item.opacity;
    el.style.animationDelay = (idx * 0.04) + 's';
    return el;
  }

  function makeRow(itemsInRow, startIdx, extraClass) {
    const row = document.createElement('div');
    row.className = 'cloud-row' + (extraClass ? ' ' + extraClass : '');
    itemsInRow.forEach((item, i) => row.appendChild(makeSpan(item, startIdx + i)));
    return row;
  }

  // Build DOM structure: outer bands → middle → inner → center → inner → middle → outer bands
  cloudEl.innerHTML    = '';
  cloudEl.style.position = '';
  cloudEl.style.height   = '';

  let delayBase = 0;

  const outerBands = chunkOuter(outer, 24);

  // Top outer bands (least common, farthest)
  [...outerBands].reverse().forEach(band => {
    const [top] = halve(band);
    if (top.length) { cloudEl.appendChild(makeRow(top, delayBase, 'cloud-row--outer')); delayBase += top.length; }
  });

  // Top middle
  const [midTop, midBot] = halve(middle);
  if (midTop.length) { cloudEl.appendChild(makeRow(midTop, delayBase, 'cloud-row--middle')); delayBase += midTop.length; }

  // Top inner
  const [innerTop, innerBot] = halve(inner);
  if (innerTop.length) { cloudEl.appendChild(makeRow(innerTop, delayBase, 'cloud-row--inner')); delayBase += innerTop.length; }

  // Center row
  const centerRow = document.createElement('div');
  centerRow.className = 'cloud-center-row';
  centerRow.appendChild(makeSpan(center, delayBase));
  delayBase++;
  cloudEl.appendChild(centerRow);

  // Bottom inner
  if (innerBot.length) { cloudEl.appendChild(makeRow(innerBot, delayBase, 'cloud-row--inner')); delayBase += innerBot.length; }

  // Bottom middle
  if (midBot.length) { cloudEl.appendChild(makeRow(midBot, delayBase, 'cloud-row--middle')); delayBase += midBot.length; }

  // Bottom outer bands
  outerBands.forEach(band => {
    const [, bot] = halve(band);
    if (bot.length) { cloudEl.appendChild(makeRow(bot, delayBase, 'cloud-row--outer')); delayBase += bot.length; }
  });
}

// =============================================================================
// LOAD ORCHESTRATION
// =============================================================================
async function loadData() {
  const result = await fetchGoogleSheets();
  if (result.status === 'ok') {
    renderCloud(result.entries, 'sheets', null);
    return;
  }
  if (result.status === 'format-error') {
    console.warn('Pledge CSV format error:', result.error, result.headerFound || '');
    renderCloud(getDemoData(), 'demo', result.error);
  } else {
    if (result.status === 'fetch-error') console.warn('Pledge CSV fetch failed:', result.error);
    renderCloud(getDemoData(), 'demo', null);
  }
}

// =============================================================================
// AUTO-REFRESH
// =============================================================================
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  if (!PLEDGES_CSV_URL || PLEDGES_CSV_URL.includes('PASTE_PUBLIC')) return;
  autoRefreshTimer = setInterval(loadData, 12000);
}

// =============================================================================
// INIT
// =============================================================================
document.getElementById('btn-refresh').addEventListener('click', loadData);
loadData();
startAutoRefresh();
