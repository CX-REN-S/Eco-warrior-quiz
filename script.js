// =============================================================================
// ECO-WARRIOR QUIZ — script.js
// =============================================================================
//
// SETUP CHECKLIST:
//   1. Set TEST_MODE = true first and open the quiz in a browser.
//      Complete the quiz — a modal will show all field IDs + values.
//      Confirm the data looks right before wiring up the real form.
//
//   2. Replace FORM_CONFIG.formUrl with your Google Form action URL:
//      Open your form → click ⋮ → "Get pre-filled link" → fill any field
//      → submit → copy the URL up to and including "/formResponse"
//
//   3. Replace each entry.XXXXXXXXXX with real field IDs from your form.
//      Find them in the pre-filled URL (?entry.XXXXXXX=value&...) or by
//      right-clicking each form field → Inspect → look for name="entry.XXX"
//
//   4. Set TEST_MODE = false when ready to go live.
//
// HOW TO EDIT QUESTIONS:
//   Edit the QUESTIONS array below. Each question has:
//     text       — the question string shown to the user
//     type       — 'single' (radio) or 'multi' (checkboxes)
//     formField  — key in FORM_CONFIG.fields used for submission
//     options    — array of { text, scores: { archetypeKey: points } }
//   For multi-select, one option may have isOther: true to show a text input.
//
// ARCHETYPE KEYS: sirAnimalot | drEnvironlove | captainSustainables | warriorOfTheWild
// =============================================================================

// ---- TEST MODE ---------------------------------------------------------------
// true  → show red banner + modal after quiz showing all data to be submitted
// false → silently submit to Google Form (go live)
const TEST_MODE = false;

// ---- GOOGLE FORM CONFIG ------------------------------------------------------
// Replace ALL placeholder values before going live.
const FORM_CONFIG = {
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSecsaH29n3g-x-o9aCQU8nyLlFRUr8QHicd5Cn97argkxr8eA/formResponse',
  fields: {
    participant_id:             'entry.213383740',
    q1:                         'entry.1540349076',
    q2:                         'entry.1325859119',
    q3:                         'entry.1011393997',
    advocacy_method:            'entry.1276548255',
    primary_cause:              'entry.1638700094',
    singapore_vision:           'entry.272963326',
    landmark:                   'entry.90584085',
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

// ---- ARCHETYPES --------------------------------------------------------------
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

// Tie-breaker: first key in this list wins when percentages are equal
const TIE_BREAKER = ['captainSustainables', 'warriorOfTheWild', 'drEnvironlove', 'sirAnimalot'];

// ---- QUESTIONS ---------------------------------------------------------------
// To add a question: push a new object into this array following the same shape.
// To change scoring: edit the scores object inside each option.
const QUESTIONS = [
  {
    text: 'You spot an injured bird in the park. What do you do?',
    type: 'single',
    formField: 'q1',
    options: [
      { text: 'Call a wildlife rescue hotline immediately',  scores: { sirAnimalot: 3 } },
      { text: 'Research the species and proper care online', scores: { drEnvironlove: 3 } },
      { text: 'Organise a community response to help',       scores: { captainSustainables: 3 } },
      { text: 'Stay with it and protect it from harm',       scores: { warriorOfTheWild: 3 } },
    ],
  },
  {
    text: 'Your dream weekend activity is...',
    type: 'single',
    formField: 'q2',
    options: [
      { text: 'Volunteering at an animal shelter',           scores: { sirAnimalot: 3 } },
      { text: 'Attending an environmental science workshop', scores: { drEnvironlove: 3 } },
      { text: 'Leading a neighbourhood clean-up drive',      scores: { captainSustainables: 3 } },
      { text: 'Hiking and documenting local wildlife',       scores: { warriorOfTheWild: 3 } },
    ],
  },
  {
    text: 'When you see litter in a nature reserve, you...',
    type: 'single',
    formField: 'q3',
    options: [
      { text: 'Pick it up and comfort any animals affected', scores: { sirAnimalot: 2, warriorOfTheWild: 1 } },
      { text: 'Document it and report to authorities',       scores: { drEnvironlove: 2, captainSustainables: 1 } },
      { text: 'Organise a clean-up event',                   scores: { captainSustainables: 2, drEnvironlove: 1 } },
      { text: 'Immediately clean it up yourself',            scores: { warriorOfTheWild: 2, sirAnimalot: 1 } },
    ],
  },
  {
    text: 'How do you prefer to advocate for the environment?',
    type: 'single',
    formField: 'advocacy_method',
    options: [
      { text: 'Through caring for animals directly',         scores: { sirAnimalot: 3 } },
      { text: 'Through education and research',              scores: { drEnvironlove: 3 } },
      { text: 'Through community programs and policy',       scores: { captainSustainables: 3 } },
      { text: 'Through direct action and fieldwork',         scores: { warriorOfTheWild: 3 } },
    ],
  },
  {
    text: 'Which cause resonates most with you?',
    type: 'single',
    formField: 'primary_cause',
    options: [
      { text: 'Animal welfare and rescue',                   scores: { sirAnimalot: 3 } },
      { text: 'Climate science and research',                scores: { drEnvironlove: 3 } },
      { text: 'Sustainable living and green cities',         scores: { captainSustainables: 3 } },
      { text: 'Biodiversity and habitat protection',         scores: { warriorOfTheWild: 3 } },
    ],
  },
  {
    text: "What's your vision for Singapore's future?",
    type: 'single',
    formField: 'singapore_vision',
    options: [
      { text: 'A city where every animal is protected',      scores: { sirAnimalot: 2, drEnvironlove: 1 } },
      { text: 'A hub for environmental innovation',          scores: { drEnvironlove: 2, captainSustainables: 1 } },
      { text: 'A model of sustainable urban living',         scores: { captainSustainables: 2, warriorOfTheWild: 1 } },
      { text: 'A green corridor for wildlife',               scores: { warriorOfTheWild: 2, sirAnimalot: 1 } },
    ],
  },
  {
    text: 'Which Singapore landmark inspires you most?',
    type: 'single',
    formField: 'landmark',
    options: [
      { text: 'Singapore Zoo',                               scores: { sirAnimalot: 3 } },
      { text: 'Science Centre',                              scores: { drEnvironlove: 3 } },
      { text: 'Gardens by the Bay',                          scores: { captainSustainables: 3 } },
      { text: 'Sungei Buloh Wetland Reserve',                scores: { warriorOfTheWild: 3 } },
    ],
  },
  {
    text: 'I pledge to... (select all that apply)',
    type: 'multi',
    formField: 'pledge_actions',
    options: [
      { text: 'Adopt or foster an animal',                   scores: { sirAnimalot: 2 } },
      { text: 'Reduce my carbon footprint',                  scores: { drEnvironlove: 2 } },
      { text: 'Join a community green initiative',           scores: { captainSustainables: 2 } },
      { text: 'Protect local wildlife habitats',             scores: { warriorOfTheWild: 2 } },
      { text: 'Other (please specify)',                      scores: {}, isOther: true },
    ],
  },
];

// =============================================================================
// STATE
// =============================================================================
let currentQ = 0;
const answers = new Array(QUESTIONS.length).fill(null); // index (single) or [] (multi)
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

  q.options.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'option-check-label' + (saved.includes(i) ? ' selected' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = saved.includes(i);

    const span = document.createElement('span');
    span.textContent = opt.text;
    label.append(cb, span);
    elOptionsMulti.appendChild(label);

    if (opt.isOther) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'other-input' + (saved.includes(i) ? '' : ' hidden');
      input.placeholder = 'Please specify...';
      input.value = otherText;
      input.addEventListener('input', e => { otherText = e.target.value; });
      elOptionsMulti.appendChild(input);

      cb.addEventListener('change', () => input.classList.toggle('hidden', !cb.checked));
    }

    cb.addEventListener('change', () => {
      label.classList.toggle('selected', cb.checked);
      const current = answers[currentQ] ? [...answers[currentQ]] : [];
      if (cb.checked) { if (!current.includes(i)) current.push(i); }
      else { const idx = current.indexOf(i); if (idx > -1) current.splice(idx, 1); }
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
    // multi: require at least one selection
    elBtnNext.disabled = !answers[currentQ] || answers[currentQ].length === 0;
  }
}

// =============================================================================
// SCORING
// =============================================================================
function calcScores() {
  const scores = { sirAnimalot: 0, drEnvironlove: 0, captainSustainables: 0, warriorOfTheWild: 0 };

  QUESTIONS.forEach((q, qi) => {
    const ans = answers[qi];
    if (ans === null) return;
    const indices = q.type === 'single' ? [ans] : ans;
    indices.forEach(i => {
      const s = q.options[i].scores;
      Object.keys(s).forEach(k => { scores[k] = (scores[k] || 0) + s[k]; });
    });
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const pcts = {};
  Object.keys(scores).forEach(k => { pcts[k] = Math.round(scores[k] / total * 100); });

  // Sort by percentage, using tie-breaker order for equal values
  const ranked = Object.keys(scores).sort((a, b) => {
    if (pcts[b] !== pcts[a]) return pcts[b] - pcts[a];
    return TIE_BREAKER.indexOf(a) - TIE_BREAKER.indexOf(b);
  });

  return { scores, pcts, primary: ranked[0], secondary: ranked[1] };
}

// =============================================================================
// RESULT PAGE
// =============================================================================
function showResult() {
  const { scores, pcts, primary, secondary } = calcScores();
  const p = ARCHETYPES[primary];
  const s = ARCHETYPES[secondary];

  document.getElementById('result-icon').textContent = p.icon;
  document.getElementById('result-title').textContent = p.name;
  document.getElementById('result-desc').textContent = p.description;
  document.getElementById('secondary-name').textContent = `${s.icon} ${s.name}`;

  // Score bars — render in fixed display order
  const displayOrder = ['captainSustainables', 'warriorOfTheWild', 'drEnvironlove', 'sirAnimalot'];
  const barsEl = document.getElementById('score-bars');
  barsEl.innerHTML = '';
  displayOrder.forEach(key => {
    const arch = ARCHETYPES[key];
    const pct = pcts[key];
    const row = document.createElement('div');
    row.className = 'score-row' + (key === primary ? ' primary' : '');
    row.innerHTML = `
      <div class="score-row-header">
        <span class="score-name">${arch.icon} ${arch.name}</span>
        <span class="score-pct">${pct}%</span>
      </div>
      <div class="score-bar-bg">
        <div class="score-bar-fill" style="width:0%"></div>
      </div>`;
    barsEl.appendChild(row);
    // Animate bar after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector('.score-bar-fill').style.width = pct + '%';
      });
    });
  });

  showPage('result');

  // Set Explore Archetypes link with highlight parameter
  const slugMap = {
    sirAnimalot: 'sir-animalot',
    drEnvironlove: 'dr-environlove',
    captainSustainables: 'captain-sustainables',
    warriorOfTheWild: 'warrior-of-the-wild',
  };
  document.getElementById('btn-explore').href = `archetypes.html?highlight=${slugMap[primary]}`;

  saveToHistory(primary, pcts);
  submitToGoogleForm(scores, pcts, primary, secondary);
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
function submitToGoogleForm(scores, pcts, primary, secondary) {
  // Generate anonymous submission ID (timestamp + random string)
  const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Build field → value map
  const data = {
    [FORM_CONFIG.fields.participant_id]:             submissionId,
    [FORM_CONFIG.fields.primary_archetype]:          ARCHETYPES[primary].name,
    [FORM_CONFIG.fields.secondary_archetype]:        ARCHETYPES[secondary].name,
    [FORM_CONFIG.fields.sir_animalot_score]:         scores.sirAnimalot,
    [FORM_CONFIG.fields.dr_environlove_score]:       scores.drEnvironlove,
    [FORM_CONFIG.fields.captain_sustainables_score]: scores.captainSustainables,
    [FORM_CONFIG.fields.warrior_wild_score]:         scores.warriorOfTheWild,
    [FORM_CONFIG.fields.sir_animalot_pct]:           pcts.sirAnimalot,
    [FORM_CONFIG.fields.dr_environlove_pct]:         pcts.drEnvironlove,
    [FORM_CONFIG.fields.captain_sustainables_pct]:   pcts.captainSustainables,
    [FORM_CONFIG.fields.warrior_wild_pct]:           pcts.warriorOfTheWild,
  };

  // Map each question's answer text to its form field
  const fieldMap = {
    q1: 'q1', q2: 'q2', q3: 'q3',
    advocacy_method: 'advocacy_method',
    primary_cause: 'primary_cause',
    singapore_vision: 'singapore_vision',
    landmark: 'landmark',
  };
  QUESTIONS.forEach((q, qi) => {
    if (q.type === 'single' && fieldMap[q.formField] && answers[qi] !== null) {
      data[FORM_CONFIG.fields[q.formField]] = q.options[answers[qi]].text;
    }
  });

  // Pledge multi-select
  const pledgeQ = QUESTIONS.find(q => q.formField === 'pledge_actions');
  const pledgeAns = answers[QUESTIONS.indexOf(pledgeQ)] || [];
  const pledgeTexts = pledgeAns
    .filter(i => !pledgeQ.options[i].isOther)
    .map(i => pledgeQ.options[i].text);
  data[FORM_CONFIG.fields.pledge_actions] = pledgeTexts.join(', ');
  data[FORM_CONFIG.fields.pledge_other]   = otherText;

  if (TEST_MODE) {
    showTestModal(data);
    return;
  }

  // Build and submit hidden form
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

// Show test banner on load if TEST_MODE is on
if (TEST_MODE) document.getElementById('test-banner').classList.remove('hidden');
