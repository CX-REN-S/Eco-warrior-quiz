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
    { pledge: 'join ark as a volunteer today',             count: 1 },
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
      rank:    i,
      opacity: 0.60 + pct * 0.40,
      color:   PLEDGE_COLORS[i % PLEDGE_COLORS.length],
    };
  });

  // ------------------------------------------------------------------
  // Improved layout: center-out zones with better packing.
  // Instead of strict ring isolation, we allow smaller pledges to
  // fill gaps beside larger ones in the same row.
  // ------------------------------------------------------------------
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

  // Build a row from items, optionally with a class.
  function makeRow(itemsInRow, startIdx, extraClass) {
    const row = document.createElement('div');
    row.className = 'cloud-row' + (extraClass ? ' ' + extraClass : '');
    itemsInRow.forEach((item, i) => row.appendChild(makeSpan(item, startIdx + i)));
    return row;
  }

  cloudEl.innerHTML      = '';
  cloudEl.style.position = '';
  cloudEl.style.height   = '';

  if (items.length === 0) return;

  // Assign items to zones by rank:
  //   0: center (solo)
  //   1–4: inner-top
  //   5–8: inner-bottom
  //   9–16: middle-top
  //   17–24: middle-bottom
  //   25+: outer (split top/bottom in chunks)
  const center      = items[0];
  const innerTop    = items.slice(1, 5);
  const innerBot    = items.slice(5, 9);
  const middleTop   = items.slice(9, 17);
  const middleBot   = items.slice(17, 25);
  const outer       = items.slice(25);

  // Split outer into top/bottom bands
  function splitOuter(arr) {
    const bands = [];
    for (let i = 0; i < arr.length; i += 20) bands.push(arr.slice(i, i + 20));
    const topBands = [], botBands = [];
    bands.forEach((band, idx) => {
      const mid = Math.ceil(band.length / 2);
      if (idx % 2 === 0) {
        topBands.push(band.slice(0, mid));
        botBands.push(band.slice(mid));
      } else {
        botBands.push(band.slice(0, mid));
        topBands.push(band.slice(mid));
      }
    });
    return { topBands, botBands };
  }

  const { topBands, botBands } = splitOuter(outer);

  let delayBase = 0;

  // Top outer bands (farthest)
  topBands.reverse().forEach(band => {
    if (band.length) { cloudEl.appendChild(makeRow(band, delayBase, 'cloud-row--outer')); delayBase += band.length; }
  });

  // Top middle
  if (middleTop.length) { cloudEl.appendChild(makeRow(middleTop, delayBase, 'cloud-row--middle')); delayBase += middleTop.length; }

  // Top inner
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
  if (middleBot.length) { cloudEl.appendChild(makeRow(middleBot, delayBase, 'cloud-row--middle')); delayBase += middleBot.length; }

  // Bottom outer bands
  botBands.forEach(band => {
    if (band.length) { cloudEl.appendChild(makeRow(band, delayBase, 'cloud-row--outer')); delayBase += band.length; }
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
