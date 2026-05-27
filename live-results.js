// =============================================================================
// LIVE RESULTS — Pledge word cloud
// =============================================================================
const PLEDGES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpFde2T9Aieyt5lKHF7yScDD_HQpZ9St8wdX5nboTaZWjAny1STNhmng_nh0ml5UQSo76taq_99Evp/pub?gid=1837305357&single=true&output=csv';

const PLEDGE_COLORS        = ['#2c4a2e','#4a7c59','#7aab8a','#8c6d3f','#5a8a6a','#3d6b4f','#6b9e7a','#a07840'];
const SKIP_PLEDGES         = new Set(['other (please specify)', 'other']);
const MAX_REASONABLE_COUNT = 100000;
const MAX_DISPLAY_PLEDGES  = 15;
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
  const maxCount = Math.max(...sorted.map(e => e.count), 1);

  const isMobile = window.innerWidth < 768;
  const minRem   = isMobile ? 0.65 : 1.0;
  const maxRem   = isMobile ? 1.25 : 2.6;

  // Estimate display width of a pledge at its font size (px).
  // ~0.58 × fontSize(px) × charCount is a reasonable monospace-safe approximation.
  const BASE_PX   = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const CHAR_COEF = 0.58;

  function estWidth(pledge, remSize) {
    return pledge.length * remSize * BASE_PX * CHAR_COEF;
  }

  // Available inner width of the cloud container (minus padding already in CSS).
  const containerW = cloudEl.offsetWidth || (window.innerWidth - 32);

  // Build item objects with pre-computed sizes.
  const items = sorted.map((e, i) => {
    const pct   = e.count / maxCount;
    const rem   = minRem + pct * (maxRem - minRem);
    return {
      pledge:  e.pledge,
      rem,
      pct,
      opacity: 0.65 + pct * 0.35,
      color:   PLEDGE_COLORS[i % PLEDGE_COLORS.length],
      estW:    estWidth(e.pledge, rem),
    };
  });

  // ------------------------------------------------------------------
  // Row packing: greedy left-to-right bin packing.
  // A row fits a second item only when both items' estimated widths
  // plus a gap fit within the container and neither item is "large"
  // (pct > 0.55 → solo row so it gets prominence it deserves).
  // ------------------------------------------------------------------
  const GAP_PX    = isMobile ? 12 : 24;
  const SOLO_PCT  = isMobile ? 0.70 : 0.55; // narrower solo threshold on mobile
  const rows     = [];
  let   i        = 0;

  while (i < items.length) {
    const cur = items[i];
    const next = items[i + 1];

    const curSolo = cur.pct > SOLO_PCT;

    const pairFits = next &&
      !curSolo &&
      next.pct <= SOLO_PCT &&
      (cur.estW + next.estW + GAP_PX) <= containerW * 0.92;

    if (pairFits) {
      rows.push([cur, next]);
      i += 2;
    } else {
      rows.push([cur]);
      i += 1;
    }
  }

  // ------------------------------------------------------------------
  // DOM: one .cloud-row <div> per row, items as <span class="cloud-word">
  // ------------------------------------------------------------------
  cloudEl.innerHTML = '';
  let delayIdx = 0;

  rows.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'cloud-row';

    row.forEach(item => {
      const el = document.createElement('span');
      el.className            = 'cloud-word';
      el.textContent          = item.pledge;
      el.style.fontSize       = item.rem.toFixed(2) + 'rem';
      el.style.color          = item.color;
      el.style.opacity        = item.opacity;
      el.style.animationDelay = (delayIdx * 0.07) + 's';
      rowEl.appendChild(el);
      delayIdx++;
    });

    cloudEl.appendChild(rowEl);
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
