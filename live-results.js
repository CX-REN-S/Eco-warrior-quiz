// =============================================================================
// LIVE RESULTS — Pledge word cloud
// =============================================================================
// PublicPledges tab published as CSV:
const PLEDGES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpFde2T9Aieyt5lKHF7yScDD_HQpZ9St8wdX5nboTaZWjAny1STNhmng_nh0ml5UQSo76taq_99Evp/pub?gid=1837305357&single=true&output=csv';

const PLEDGE_COLORS = ['#2c4a2e','#4a7c59','#7aab8a','#8c6d3f','#5a8a6a','#3d6b4f','#6b9e7a','#a07840'];
const SKIP_PLEDGES  = new Set(['other (please specify)', 'other']);
const MAX_REASONABLE_COUNT = 100000;
const MAX_DISPLAY_PLEDGES  = 25;
const CSV_FORMAT_ERROR_MSG = 'The connected Google Sheets CSV does not look like the PublicPledges sheet (expected columns: pledge, count).';

let autoRefreshTimer = null;

// =============================================================================
// SEEDED PRNG — gives stable placement across re-renders of the same data
// =============================================================================
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// =============================================================================
// TEXT SANITISE
// =============================================================================
function sanitisePledge(raw) {
  const s = raw.replace(/\s+/g, ' ').trim().slice(0, 50);
  if (!s || SKIP_PLEDGES.has(s.toLowerCase())) return null;
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
  if (pledgeIdx === -1 || countIdx === -1) return { status: 'format-error', error: CSV_FORMAT_ERROR_MSG, headerFound: lines[0] };

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
// WORD CLOUD PLACEMENT
// Uses a seeded PRNG so the layout is stable on every re-render of same data.
// Attempts to place each word without overlapping previously placed words,
// using a spiral search from a candidate centre.
// =============================================================================
function buildCloud(entries, containerW, containerH) {
  // Sort by count desc, cap at MAX_DISPLAY_PLEDGES
  const sorted = [...entries].sort((a, b) => b.count - a.count).slice(0, MAX_DISPLAY_PLEDGES);
  const maxCount = Math.max(...sorted.map(e => e.count), 1);

  // Font size range depends on container width
  const isMobile = containerW < 640;
  const minFs = isMobile ? 11 : 14;  // px
  const maxFs = isMobile ? 26 : 48;

  // Rotation choices: mostly horizontal, a few tilted, rare vertical
  const rotations = [0, 0, 0, 0, -15, 15, -30, 30, -90, 90];

  const rng = mulberry32(sorted.reduce((acc, e) => acc + e.count, 0) * 1000 + sorted.length);

  const placed = []; // { cx, cy, hw, hh, rot } — bounding box half-extents after rotation

  function overlaps(cx, cy, hw, hh) {
    for (const p of placed) {
      // AABB check on approximate bounding circles (fast enough for ≤25 items)
      const dx = Math.abs(cx - p.cx);
      const dy = Math.abs(cy - p.cy);
      const minDx = hw + p.hw + 6;
      const minDy = hh + p.hh + 4;
      if (dx < minDx && dy < minDy) return true;
    }
    return false;
  }

  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    const e   = sorted[i];
    const pct = e.count / maxCount;
    const fs  = Math.round(minFs + pct * (maxFs - minFs));

    // Choose rotation — higher-count words tend to be horizontal
    const rotPool = pct > 0.6
      ? [0, 0, 0, -15, 15]
      : pct > 0.3
        ? [0, 0, -15, 15, -30, 30]
        : rotations;
    const rotDeg = rotPool[Math.floor(rng() * rotPool.length)];
    const rotRad = rotDeg * Math.PI / 180;

    // Approximate rendered size: chars * fs * 0.55 wide, fs * 1.3 tall
    const estW = Math.min(e.pledge.length * fs * 0.55, containerW * 0.85);
    const estH = fs * 1.3;

    // Half-extents after rotation (bounding box of rotated rect)
    const hw = (Math.abs(Math.cos(rotRad)) * estW + Math.abs(Math.sin(rotRad)) * estH) / 2;
    const hh = (Math.abs(Math.sin(rotRad)) * estW + Math.abs(Math.cos(rotRad)) * estH) / 2;

    // Candidate centre — start near middle, spiral outward
    const startCx = containerW / 2 + (rng() - 0.5) * containerW * 0.15;
    const startCy = containerH / 2 + (rng() - 0.5) * containerH * 0.15;

    let cx = startCx, cy = startCy, placed_ok = false;
    const step = Math.max(fs, 12);

    for (let attempt = 0; attempt < 400; attempt++) {
      const angle  = attempt * 0.45;
      const radius = step * 0.28 * attempt;
      cx = startCx + radius * Math.cos(angle);
      cy = startCy + radius * Math.sin(angle) * 0.65; // flatten vertically

      // Clamp so the word stays inside the container
      cx = Math.max(hw + 4, Math.min(containerW - hw - 4, cx));
      cy = Math.max(hh + 4, Math.min(containerH - hh - 4, cy));

      if (!overlaps(cx, cy, hw, hh)) { placed_ok = true; break; }
    }

    if (!placed_ok) {
      // Fallback: place somewhere random without overlap check
      cx = hw + 4 + rng() * Math.max(0, containerW - 2 * hw - 8);
      cy = hh + 4 + rng() * Math.max(0, containerH - 2 * hh - 8);
    }

    placed.push({ cx, cy, hw, hh });
    result.push({ pledge: e.pledge, count: e.count, fs, rotDeg, cx, cy, opacity: 0.6 + pct * 0.4, color: PLEDGE_COLORS[i % PLEDGE_COLORS.length] });
  }

  return result;
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

  // Notice banner
  if (errorMsg) {
    noticeEl.textContent = errorMsg;
    noticeEl.classList.remove('hidden');
  } else {
    noticeEl.classList.add('hidden');
    noticeEl.textContent = '';
  }

  // Source label
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

  // Build cloud
  cloudEl.innerHTML = '';
  const W = cloudEl.offsetWidth  || 340;
  const H = cloudEl.offsetHeight || 340;

  const layout = buildCloud(entries, W, H);

  layout.forEach((item, i) => {
    const el = document.createElement('span');
    el.className          = 'cloud-word';
    el.textContent        = item.pledge;
    el.style.left         = item.cx + 'px';
    el.style.top          = item.cy + 'px';
    el.style.fontSize     = item.fs + 'px';
    el.style.color        = item.color;
    el.style.opacity      = '0';                      // animation starts here; keyframe ends at 1
    el.style.transform    = `translate(-50%, -50%) rotate(${item.rotDeg}deg)`;
    el.style.animationDelay = (i * 0.07) + 's';
    el.style.animationFillMode = 'forwards';
    // Hold final opacity via a one-shot end via animationend
    el.addEventListener('animationend', () => { el.style.opacity = String(item.opacity); }, { once: true });
    cloudEl.appendChild(el);
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
// AUTO-REFRESH — also re-layout on window resize
// =============================================================================
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  if (!PLEDGES_CSV_URL || PLEDGES_CSV_URL.includes('PASTE_PUBLIC')) return;
  autoRefreshTimer = setInterval(loadData, 12000);
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(loadData, 250);
});

// =============================================================================
// INIT
// =============================================================================
document.getElementById('btn-refresh').addEventListener('click', loadData);
loadData();
startAutoRefresh();
