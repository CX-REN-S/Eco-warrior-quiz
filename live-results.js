const HISTORY_KEY = 'ecoQuizHistory';
const ARCHETYPE_META = {
  sirAnimalot:         { name: 'Sir Animalot',         icon: '🐾' },
  drEnvironlove:       { name: 'Dr. Environlove',       icon: '🔬' },
  captainSustainables: { name: 'Captain Sustainables',  icon: '♻️' },
  warriorOfTheWild:    { name: 'Warrior of the Wild',   icon: '🌲' },
};
const ORDER = ['captainSustainables', 'warriorOfTheWild', 'drEnvironlove', 'sirAnimalot'];

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function render() {
  const history = loadHistory();
  const metaEl  = document.getElementById('results-meta');
  const gridEl  = document.getElementById('results-grid');
  const barsEl  = document.getElementById('results-bars');
  const noData  = document.getElementById('no-data');

  if (history.length === 0) {
    noData.classList.remove('hidden');
    gridEl.classList.add('hidden');
    barsEl.classList.add('hidden');
    metaEl.textContent = '';
    return;
  }

  noData.classList.add('hidden');
  gridEl.classList.remove('hidden');
  barsEl.classList.remove('hidden');

  // Count primary archetype wins
  const counts = { sirAnimalot: 0, drEnvironlove: 0, captainSustainables: 0, warriorOfTheWild: 0 };
  history.forEach(r => { if (counts[r.primary] !== undefined) counts[r.primary]++; });
  const total = history.length;

  metaEl.textContent = `Based on ${total} quiz attempt${total !== 1 ? 's' : ''} on this device.`;

  // Stat cards
  gridEl.innerHTML = '';
  ORDER.forEach(key => {
    const m   = ARCHETYPE_META[key];
    const pct = Math.round(counts[key] / total * 100);
    const card = document.createElement('div');
    card.className = 'result-stat-card';
    card.innerHTML = `<div class="stat-icon">${m.icon}</div>
      <div class="stat-name">${m.name}</div>
      <div class="stat-pct">${pct}%</div>
      <div class="stat-count">${counts[key]} of ${total}</div>`;
    gridEl.appendChild(card);
  });

  // Score bars (average pct across all attempts)
  const avgPcts = {};
  ORDER.forEach(key => {
    const sum = history.reduce((acc, r) => acc + (r.pcts?.[key] || 0), 0);
    avgPcts[key] = Math.round(sum / total);
  });

  barsEl.innerHTML = '<h2>Average score breakdown</h2>';
  ORDER.forEach(key => {
    const m   = ARCHETYPE_META[key];
    const pct = avgPcts[key];
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <div class="score-row-header">
        <span class="score-name">${m.icon} ${m.name}</span>
        <span class="score-pct">${pct}%</span>
      </div>
      <div class="score-bar-bg"><div class="score-bar-fill" style="width:0%"></div></div>`;
    barsEl.appendChild(row);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      row.querySelector('.score-bar-fill').style.width = pct + '%';
    }));
  });
}

render();
