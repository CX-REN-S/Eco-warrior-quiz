const TEST_MODE = false;

const FORM_CONFIG = {
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSecsaH29n3g-x-o9aCQU8nyLlFRUr8QHicd5Cn97argkxr8eA/formResponse',
  fields: {
    participant_id:             'entry.213383740',
    injured_bird:               'entry.1540349076',
    dream_activity:             'entry.1325859119',
    litter_in_nr:               'entry.1011393997',
    advocacy_method:            'entry.1276548255',
    primary_cause:              'entry.1638700094',
    singapore_vision:           'entry.272963326',
    landmark:                   'entry.90584085',
    view_change:                'entry.1877724165',
    pledge_actions:             'entry.818603826',
    pledge_other:               'entry.1434375857',
    primary_archetype:          'entry.1051711614',
    secondary_archetype:        'entry.1374228856',
    sir_animalot_score:         'entry.291002955',
    dr_environlove_score:       'entry.805351353',
    captain_sustainables_score: 'entry.1498845200',
    warrior_wild_score:         'entry.1214125334',
    sir_animalot_pct:           'entry.156051671',
    dr_environlove_pct:         'entry.995578410',
    captain_sustainables_pct:   'entry.1084441400',
    warrior_wild_pct:           'entry.1025319680',
  }
};

const ARCHETYPES = {
  sirAnimalot: {
    name: 'Sir Animalot',
    icon: '🐾',
    description: 'You lead with your heart. Animals are your greatest allies, and your compassion drives real change. You believe every creature deserves care and protection.',
    scoreField: 'sir_animalot_score',
    pctField:   'sir_animalot_pct',
  },
  drEnvironlove: {
    name: 'Dr. Environlove',
    icon: '🔬',
    description: 'You lead with your mind. Science and knowledge are your superpowers. You understand that solving environmental challenges requires data, research, and innovation.',
    scoreField: 'dr_environlove_score',
    pctField:   'dr_environlove_pct',
  },
  captainSustainables: {
    name: 'Captain Sustainables',
    icon: '♻️',
    description: 'You lead with action. You believe in building systems that last — green cities, sustainable habits, and community-driven change.',
    scoreField: 'captain_sustainables_score',
    pctField:   'captain_sustainables_pct',
  },
  warriorOfTheWild: {
    name: 'Warrior of the Wild',
    icon: '🌲',
    description: 'You lead with courage. The wild calls to you, and you answer. You protect biodiversity and habitats with fierce dedication.',
    scoreField: 'warrior_wild_score',
    pctField:   'warrior_wild_pct',
  },
};

const SLUG_MAP = {
  sirAnimalot: 'sir-animalot',
  drEnvironlove: 'dr-environlove',
  captainSustainables: 'captain-sustainables',
  warriorOfTheWild: 'warrior-of-the-wild',
};

// Q9 pledge tiebreaker mapping
const PLEDGE_TIEBREAKER = {
  0: 'warriorOfTheWild',    // cruelty-free & wildlife-friendly
  1: 'sirAnimalot',         // keep pet on leash
  2: 'captainSustainables', // reduce carbon footprint
  3: 'drEnvironlove',       // join beach clean-up
  // index 4 = Other, no scoring
};

const QUESTIONS = [
  // Q1 — not scored, stored as injured_bird
  {
    text: 'Before this event, when you show up for work and go about your day, how closely tied do you feel to protecting the environment?',
    type: 'single',
    formField: 'injured_bird',
    scored: false,
    options: [
      { text: 'Not connected at all — my daily tasks have nothing to do with "green" work.' },
      { text: 'A little — there\'s an occasional overlap, but it\'s rare.' },
      { text: 'Quite — I often see where my skills can cross over.' },
      { text: 'Very — my daily tasks and skills directly impact sustainability.' },
      { text: 'Extremely so — my day-to-day work is fundamentally green.' },
    ],
  },
  // Q2 — scored, stored as dream_activity
  {
    text: 'Your company/school wants to launch a new green initiative. What role would you naturally take?',
    type: 'single',
    formField: 'dream_activity',
    scored: true,
    options: [
      { text: 'I would help turn the idea into a practical plan, finding pragmatic ways to reduce waste, save resources, and make the initiative a part of daily routines.', scores: { captainSustainables: 1 } },
      { text: 'I would speak up directly, advocating for others to support wildlife, protect green spaces, or take action for a green cause.', scores: { warriorOfTheWild: 1 } },
      { text: 'I would research the issue and share relevant environmental facts with people so they understand why the initiative matters.', scores: { drEnvironlove: 1 } },
      { text: 'I would focus on helping animals, whether by supporting rescues, protecting local wildlife, or encouraging more animal-friendly choices.', scores: { sirAnimalot: 1 } },
    ],
  },
  // Q3 — scored, stored as litter_in_nr
  {
    text: 'You have a free Saturday afternoon in Singapore. What would you prefer doing?',
    type: 'single',
    formField: 'litter_in_nr',
    scored: true,
    options: [
      { text: 'Exploring the eco-architecture and climate tech systems at Gardens by the Bay.', scores: { captainSustainables: 1 } },
      { text: 'Tracking rare species or birdwatching at Sungei Buloh Wetland Reserve.', scores: { warriorOfTheWild: 1 } },
      { text: 'Attending a local botany workshop or checking out a community urban farm.', scores: { drEnvironlove: 1 } },
      { text: 'Volunteering at an animal shelter, or visiting a cat/dog cafe to show love to vulnerable creatures.', scores: { sirAnimalot: 1 } },
    ],
  },
  // Q4 — multi, scored, stored as advocacy_method
  {
    text: 'You notice a displaced, disoriented animal wandering near traffic. What is your immediate instinct?',
    type: 'multi',
    formField: 'advocacy_method',
    scored: true,
    hasAllOption: true,
    options: [
      { text: 'I would use my phone to report the location through the proper channels so the right people can respond quickly and safely.', scores: { captainSustainables: 1 } },
      { text: 'I would stay in the vicinity, ensuring the animal\'s safety.', scores: { warriorOfTheWild: 1 } },
      { text: 'I would observe carefully, note what kind of animal it is, and try to understand what may have caused it to end up there.', scores: { drEnvironlove: 1 } },
      { text: 'I would immediately contact an animal or wildlife rescue group and stay nearby, from a safe distance, until help arrives.', scores: { sirAnimalot: 1 } },
      { text: 'All of the above', isAll: true, scores: { captainSustainables: 1, warriorOfTheWild: 1, drEnvironlove: 1, sirAnimalot: 1 } },
    ],
  },
  // Q5 — multi, scored, stored as primary_cause
  {
    text: "When you think about Singapore evolving into a true 'City in Nature', what matters most to you?",
    type: 'multi',
    formField: 'primary_cause',
    scored: true,
    hasAllOption: true,
    options: [
      { text: 'A city where everyday systems are greener, from transport and buildings to waste, energy, and how businesses operate.', scores: { captainSustainables: 1 } },
      { text: 'A city where nature has real space to thrive, with connected green areas that protect wildlife and reduce conflict between people and animals.', scores: { warriorOfTheWild: 1 } },
      { text: 'A city with healthier ecosystems, cleaner air and water, stronger native plants, and natural spaces that are cared for and restored.', scores: { drEnvironlove: 1 } },
      { text: 'A kinder city where pets, stray animals, and urban wildlife are treated with care, safety, and respect.', scores: { sirAnimalot: 1 } },
      { text: 'All of the above', isAll: true, scores: { captainSustainables: 1, warriorOfTheWild: 1, drEnvironlove: 1, sirAnimalot: 1 } },
    ],
  },
  // Q6 — scored, stored as singapore_vision
  {
    text: 'If you could have one superpower to help the planet, which would you pick?',
    type: 'single',
    formField: 'singapore_vision',
    scored: true,
    options: [
      { text: 'The power to make everyday life instantly greener — less waste, clean energy, zero emissions, and better habits.', scores: { captainSustainables: 1 } },
      { text: 'The power to protect wild flora and fauna with an invisible shield, keeping wild endangered species safe from harm.', scores: { warriorOfTheWild: 1 } },
      { text: 'The power to heal nature — bring dead soil back to life, clean all polluted water, and help ecosystems thrive.', scores: { drEnvironlove: 1 } },
      { text: 'The capability to understand exactly what individual animals need, and the ability to ensure that no single creature suffers.', scores: { sirAnimalot: 1 } },
    ],
  },
  // Q7 — scored, stored as landmark
  {
    text: 'You are trying to convince your friends to care about the environment. What would you say?',
    type: 'single',
    formField: 'landmark',
    scored: true,
    options: [
      { text: '"Sustainability is practical, smart, and creates the jobs of the future. It\'s a just and good strategy."', scores: { captainSustainables: 1 } },
      { text: '"We\'re not the only ones living here. Singapore has amazing wildlife, and they deserve space to survive."', scores: { warriorOfTheWild: 1 } },
      { text: '"Nature is connected to everything — our air, water, food, weather, and health. If we damage it too much, it affects all of us."', scores: { drEnvironlove: 1 } },
      { text: '"Animals can\'t always protect themselves. Caring for the environment means looking out for the creatures that depend on it."', scores: { sirAnimalot: 1 } },
    ],
  },
  // Q8 — not scored for archetype, stored as view_change
  {
    text: "Now that you've discovered your archetype, how has your view on 'green skills' changed?",
    type: 'single',
    formField: 'view_change',
    scored: false,
    options: [
      { text: 'No change — I still feel environmental action is best left to the specialized scientists and experts.' },
      { text: 'Slight shift — I see how individual actions like recycling matter, but I don\'t think it connects deeply to my regular professional life.' },
      { text: 'Strategy — I realize that my professional skills can actively build systems that protect the planet.' },
      { text: 'Advocacy — I realize that my voice, choices, and everyday boundary-setting can protect local species.' },
      { text: 'Action — I realize that my direct actions, scientific curiosity, or community efforts can directly heal ecosystems and save lives.' },
    ],
  },
  // Q9 — pledge, multi, stored as pledge_actions / pledge_other
  {
    text: 'As an eco-warrior, I pledge to... (select all that apply)',
    type: 'multi',
    formField: 'pledge_actions',
    scored: false,
    options: [
      { text: 'Choose cruelty-free & wildlife-friendly products' },
      { text: 'Keep my pet on a leash in nature areas' },
      { text: 'Reduce my carbon footprint' },
      { text: 'Join a beach clean-up' },
      { text: 'Other (please specify)', isOther: true },
    ],
  },
];

// =============================================================================
// STATE
// =============================================================================
let currentQ = 0;
const answers = new Array(QUESTIONS.length).fill(null);
let otherText = '';

// =============================================================================
// DOM
// =============================================================================
const pages = {
  landing: document.getElementById('page-landing'),
  quiz:    document.getElementById('page-quiz'),
  result:  document.getElementById('page-result'),
};
const elProgressFill  = document.getElementById('progress-fill');
const elProgressLabel = document.getElementById('progress-label');
const elQNumber       = document.getElementById('q-number');
const elQText         = document.getElementById('q-text');
const elOptionsSingle = document.getElementById('options-single');
const elOptionsMulti  = document.getElementById('options-multi');
const elBtnBack       = document.getElementById('btn-back');
const elBtnNext       = document.getElementById('btn-next');

// =============================================================================
// NAVIGATION
// =============================================================================
function showPage(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
}

document.getElementById('btn-start').addEventListener('click', () => {
  currentQ = 0;
  answers.fill(null);
  otherText = '';
  showPage('quiz');
  renderQuestion();
});

document.getElementById('btn-retake').addEventListener('click', () => showPage('landing'));

elBtnBack.addEventListener('click', () => {
  if (currentQ > 0) { currentQ--; renderQuestion(); }
  else showPage('landing');
});

elBtnNext.addEventListener('click', () => {
  if (currentQ < QUESTIONS.length - 1) { currentQ++; renderQuestion(); }
  else showResult();
});

// =============================================================================
// RENDER QUESTION
// =============================================================================
function renderQuestion() {
  const q = QUESTIONS[currentQ];
  const total = QUESTIONS.length;

  elProgressFill.style.width = (currentQ / total * 100) + '%';
  elProgressLabel.textContent = `Question ${currentQ + 1} of ${total}`;
  elQNumber.textContent = `Q${currentQ + 1}`;
  elQText.textContent = q.text;
  elBtnNext.textContent = currentQ === total - 1 ? 'See My Result' : 'Next';
  elBtnBack.style.visibility = currentQ === 0 ? 'hidden' : 'visible';

  if (q.type === 'single') {
    elOptionsSingle.classList.remove('hidden');
    elOptionsMulti.classList.add('hidden');
    renderSingleOptions(q);
  } else {
    elOptionsSingle.classList.add('hidden');
    elOptionsMulti.classList.remove('hidden');
    renderMultiOptions(q);
  }
  updateNextBtn();
}

function renderSingleOptions(q) {
  elOptionsSingle.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (answers[currentQ] === i ? ' selected' : '');
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      answers[currentQ] = i;
      elOptionsSingle.querySelectorAll('.option-btn').forEach((b, j) => b.classList.toggle('selected', j === i));
      updateNextBtn();
    });
    elOptionsSingle.appendChild(btn);
  });
}

function renderMultiOptions(q) {
  elOptionsMulti.innerHTML = '';
  const saved = answers[currentQ] || [];
  const allIdx = q.hasAllOption ? q.options.findIndex(o => o.isAll) : -1;
  const allSelected = allIdx !== -1 && saved.includes(allIdx);

  const checkboxes = [];
  const labels = [];

  q.options.forEach((opt, i) => {
    const label = document.createElement('label');
    const isRegular = allIdx !== -1 && !opt.isAll && !opt.isOther;
    const forcedByAll = allSelected && isRegular;
    label.className = 'option-check-label'
      + (saved.includes(i) || forcedByAll ? ' selected' : '')
      + (forcedByAll ? ' disabled' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = saved.includes(i) || forcedByAll;
    if (forcedByAll) cb.disabled = true;

    const span = document.createElement('span');
    span.textContent = opt.text;
    label.append(cb, span);
    elOptionsMulti.appendChild(label);
    checkboxes.push(cb);
    labels.push(label);

    if (opt.isOther) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'other-input' + (saved.includes(i) ? '' : ' hidden');
      input.placeholder = 'Please specify...';
      input.maxLength = 50;
      input.value = otherText;
      input.addEventListener('input', e => { otherText = e.target.value.trim().slice(0, 50); updateNextBtn(); });
      elOptionsMulti.appendChild(input);
      cb.addEventListener('change', () => input.classList.toggle('hidden', !cb.checked));
    }

    cb.addEventListener('change', () => {
      if (opt.isAll) {
        // Toggle all regular options
        const nowChecked = cb.checked;
        checkboxes.forEach((ocb, j) => {
          const isReg = allIdx !== -1 && !q.options[j].isAll && !q.options[j].isOther;
          if (isReg) {
            ocb.checked = nowChecked;
            ocb.disabled = nowChecked;
            labels[j].classList.toggle('selected', nowChecked);
            labels[j].classList.toggle('disabled', nowChecked);
          }
        });
      }
      label.classList.toggle('selected', cb.checked);
      // Rebuild answers from current checkbox states, excluding force-disabled regular ones when All is checked
      const allCb = allIdx !== -1 ? checkboxes[allIdx] : null;
      const allNowChecked = allCb && allCb.checked;
      const current = [];
      checkboxes.forEach((ocb, j) => {
        const isReg = allIdx !== -1 && !q.options[j].isAll && !q.options[j].isOther;
        if (allNowChecked && isReg) return; // don't store individual indices when All is checked
        if (ocb.checked) current.push(j);
      });
      if (allNowChecked) current.push(allIdx);
      answers[currentQ] = current;
      updateNextBtn();
    });
  });
}

function updateNextBtn() {
  const q = QUESTIONS[currentQ];
  if (q.type === 'single') {
    elBtnNext.disabled = answers[currentQ] === null;
  } else {
    const sel = answers[currentQ] || [];
    if (sel.length === 0) { elBtnNext.disabled = true; return; }
    // If this question has an Other option and it is selected, require non-blank text
    const otherIdx = q.options.findIndex(o => o.isOther);
    if (otherIdx !== -1 && sel.includes(otherIdx) && otherText.trim() === '') {
      elBtnNext.disabled = true; return;
    }
    elBtnNext.disabled = false;
  }
}

// =============================================================================
// SCORING — Q2 through Q7 only
// =============================================================================
function calcScores() {
  const scores = { sirAnimalot: 0, drEnvironlove: 0, captainSustainables: 0, warriorOfTheWild: 0 };

  QUESTIONS.forEach((q, qi) => {
    if (!q.scored) return;
    const ans = answers[qi];
    if (ans === null) return;

    if (q.type === 'single') {
      const s = q.options[ans].scores || {};
      Object.keys(s).forEach(k => { scores[k] += s[k]; });
    } else if (q.type === 'multi') {
      const indices = ans;
      const allIdx = q.options.findIndex(o => o.isAll);
      const hasAll = allIdx !== -1 && indices.includes(allIdx);

      if (hasAll) {
        // "All of the above" — add its scores once, ignore individual selections
        const s = q.options[allIdx].scores || {};
        Object.keys(s).forEach(k => { scores[k] += s[k]; });
      } else {
        indices.forEach(i => {
          const s = q.options[i].scores || {};
          Object.keys(s).forEach(k => { scores[k] += s[k]; });
        });
      }
    }
  });

  return scores;
}

function calcPcts(scores) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const pcts = {};
  Object.keys(scores).forEach(k => { pcts[k] = Math.round(scores[k] / total * 100); });
  return pcts;
}

function findTiedTopKeys(scores) {
  const max = Math.max(...Object.values(scores));
  return Object.keys(scores).filter(k => scores[k] === max);
}

function applyQ9Tiebreaker(scores, tiedKeys) {
  const q9idx = QUESTIONS.findIndex(q => q.formField === 'pledge_actions');
  const q9ans = answers[q9idx] || [];
  const q9 = QUESTIONS[q9idx];

  const broken = { ...scores };
  q9ans.forEach(i => {
    const archetype = PLEDGE_TIEBREAKER[i];
    if (archetype && tiedKeys.includes(archetype)) {
      broken[archetype] += 1;
    }
  });
  return broken;
}

// =============================================================================
// RESULT PAGE
// =============================================================================
function showResult() {
  let scores = calcScores();
  let tiedKeys = findTiedTopKeys(scores);

  // Apply Q9 tiebreaker only if there's a tie
  if (tiedKeys.length > 1) {
    scores = applyQ9Tiebreaker(scores, tiedKeys);
    tiedKeys = findTiedTopKeys(scores);
  }

  const pcts = calcPcts(scores);

  // Determine primary archetypes (may be multiple if still tied)
  const primaryKeys = tiedKeys;

  // Secondary: only shown when there is exactly one primary
  const secondaryKey = primaryKeys.length === 1
    ? Object.keys(scores).filter(k => !primaryKeys.includes(k)).sort((a, b) => scores[b] - scores[a])[0]
    : null;

  // Result display
  const firstPrimary = ARCHETYPES[primaryKeys[0]];
  const secondary = ARCHETYPES[secondaryKey];

  if (primaryKeys.length === 1) {
    document.getElementById('result-icon').textContent = firstPrimary.icon;
    document.getElementById('result-title').textContent = firstPrimary.name;
    document.getElementById('result-desc').textContent = firstPrimary.description;
    document.getElementById('result-multi-block').classList.add('hidden');
    document.getElementById('result-single-block').classList.remove('hidden');
  } else {
    // Multiple tied archetypes
    document.getElementById('result-single-block').classList.add('hidden');
    const multiBlock = document.getElementById('result-multi-block');
    multiBlock.classList.remove('hidden');
    multiBlock.querySelector('.result-multi-list').innerHTML = primaryKeys.map(k =>
      `<div class="result-multi-item"><span class="result-multi-icon">${ARCHETYPES[k].icon}</span><span class="result-multi-name">${ARCHETYPES[k].name}</span></div>`
    ).join('');
    document.getElementById('result-icon').textContent = '';
  }

  if (secondary) {
    document.getElementById('secondary-name').textContent = `${secondary.icon} ${secondary.name}`;
    document.getElementById('secondary-block').classList.remove('hidden');
  } else {
    document.getElementById('secondary-block').classList.add('hidden');
  }

  // Score bars
  const displayOrder = ['captainSustainables', 'warriorOfTheWild', 'drEnvironlove', 'sirAnimalot'];
  const barsEl = document.getElementById('score-bars');
  barsEl.innerHTML = '';
  displayOrder.forEach(key => {
    const arch = ARCHETYPES[key];
    const pct = pcts[key];
    const isPrimary = primaryKeys.includes(key);
    const row = document.createElement('div');
    row.className = 'score-row' + (isPrimary ? ' primary' : '');
    row.innerHTML = `
      <div class="score-row-header">
        <span class="score-name">${arch.icon} ${arch.name}</span>
        <span class="score-pct">${pct}%</span>
      </div>
      <div class="score-bar-bg">
        <div class="score-bar-fill" style="width:0%"></div>
      </div>`;
    barsEl.appendChild(row);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector('.score-bar-fill').style.width = pct + '%';
      });
    });
  });

  showPage('result');

  // Explore Archetypes link — pass all primary slugs
  const slugs = primaryKeys.map(k => SLUG_MAP[k]).join(',');
  document.getElementById('btn-explore').href = `archetypes.html?highlight=${slugs}`;

  saveToHistory(primaryKeys[0], pcts);
  submitToGoogleForm(scores, pcts, primaryKeys, secondaryKey);
}

// =============================================================================
// LOCAL HISTORY
// =============================================================================
function saveToHistory(primary, pcts) {
  const HISTORY_KEY = 'ecoQuizHistory';
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history.push({ primary, pcts, ts: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
}

// =============================================================================
// GOOGLE FORM SUBMISSION
// =============================================================================
function submitToGoogleForm(scores, pcts, primaryKeys, secondaryKey) {
  const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const data = {
    [FORM_CONFIG.fields.participant_id]:             submissionId,
    [FORM_CONFIG.fields.primary_archetype]:          primaryKeys.map(k => ARCHETYPES[k].name).join(', '),
    [FORM_CONFIG.fields.secondary_archetype]:        secondaryKey ? ARCHETYPES[secondaryKey].name : '',
    [FORM_CONFIG.fields.sir_animalot_score]:         scores.sirAnimalot,
    [FORM_CONFIG.fields.dr_environlove_score]:       scores.drEnvironlove,
    [FORM_CONFIG.fields.captain_sustainables_score]: scores.captainSustainables,
    [FORM_CONFIG.fields.warrior_wild_score]:         scores.warriorOfTheWild,
    [FORM_CONFIG.fields.sir_animalot_pct]:           pcts.sirAnimalot,
    [FORM_CONFIG.fields.dr_environlove_pct]:         pcts.drEnvironlove,
    [FORM_CONFIG.fields.captain_sustainables_pct]:   pcts.captainSustainables,
    [FORM_CONFIG.fields.warrior_wild_pct]:           pcts.warriorOfTheWild,
  };

  // Single-select questions mapped to their form fields
  QUESTIONS.forEach((q, qi) => {
    if (q.type === 'single' && FORM_CONFIG.fields[q.formField] && answers[qi] !== null) {
      data[FORM_CONFIG.fields[q.formField]] = q.options[answers[qi]].text;
    }
  });

  // Q4 and Q5 multi-select — if All is selected, submit only "All of the above"
  [3, 4].forEach(qi => {
    const q = QUESTIONS[qi];
    const ans = answers[qi] || [];
    const allIdx = q.options.findIndex(o => o.isAll);
    const hasAll = allIdx !== -1 && ans.includes(allIdx);
    data[FORM_CONFIG.fields[q.formField]] = hasAll
      ? q.options[allIdx].text
      : ans.map(i => q.options[i].text).join(', ');
  });

  // Q9 pledge
  const pledgeQIdx = QUESTIONS.findIndex(q => q.formField === 'pledge_actions');
  const pledgeQ = QUESTIONS[pledgeQIdx];
  const pledgeAns = answers[pledgeQIdx] || [];
  const pledgeTexts = pledgeAns
    .filter(i => !pledgeQ.options[i].isOther)
    .map(i => pledgeQ.options[i].text);
  data[FORM_CONFIG.fields.pledge_actions] = pledgeTexts.join(', ');
  data[FORM_CONFIG.fields.pledge_other] = pledgeAns.some(i => pledgeQ.options[i].isOther) ? otherText : '';

  // Q8 — submit raw answer text to view_change
  const q8idx = QUESTIONS.findIndex(q => q.formField === 'view_change');
  const q8ans = answers[q8idx];
  if (q8ans !== null) {
    data[FORM_CONFIG.fields.view_change] = QUESTIONS[q8idx].options[q8ans].text;
  }

  if (TEST_MODE) {
    showTestModal(data);
    return;
  }

  const form = document.getElementById('google-form');
  form.action = FORM_CONFIG.formUrl;
  form.innerHTML = '';
  Object.entries(data).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  form.submit();
}

// =============================================================================
// TEST MODE MODAL
// =============================================================================
function showTestModal(data) {
  document.getElementById('test-banner').classList.remove('hidden');
  const lines = Object.entries(data).map(([k, v]) => `${k}\n  → "${v}"`).join('\n\n');
  document.getElementById('test-modal-content').textContent = lines;
  document.getElementById('test-modal').classList.remove('hidden');
}

document.getElementById('test-modal-close').addEventListener('click', () => {
  document.getElementById('test-modal').classList.add('hidden');
});

if (TEST_MODE) document.getElementById('test-banner').classList.remove('hidden');
