// Session state for the demo. Every user action becomes a reducer action, and
// the reducer appends chat messages, so the whole flow is replayable and testable.
//
// Scenes: home → setup (optional) → plan → parts → build → test → done, plus
// the Lab 4 debugging demo. Long-running checks set `pending`; App resolves
// them after a short delay so the UI can show "Checking…".

import { LAB3 } from '../data/lab.js';
import { reply } from '../assistant/replies.js';

export const initialState = {
  scene: 'home',
  messages: [],
  pending: null,
  tab: 'bench',
  seq: 0,
  setup: { railConfirmed: false, done: false, started: false },
  plan: { choice: null },
  parts: { scanned: false },
  build: { step: 2, statuses: { 1: 'done' }, times: {}, attempts: {} },
  test: { lit: null },
  done: { rating: null },
  debug: { reported: false, fixed: false },
  log: [],
};

// ---------------------------------------------------------------- helpers

function add(state, message) {
  const id = state.seq + 1;
  return { ...state, seq: id, messages: [...state.messages, { id, ...message }] };
}

let blockSeq = 0;
const key = name => `${name}-${++blockSeq}`;

const say = (state, text, time, blocks = []) => add(state, { kind: 'assistant', time, text, blocks });
const you = (state, text) => add(state, { kind: 'you', text });
const activity = (state, icon, text, time, tone) => add(state, { kind: 'activity', icon, text, time, tone });
const divider = (state, text, tone = 'done') => add(state, { kind: 'divider', text, tone });
const runlog = (state, summary, rows, open = true) => add(state, { kind: 'runlog', summary, rows, open });
const options = (on, question, opts, hint) => ({ type: 'options', key: key('options'), on, question, options: opts, hint, answer: null });
const actions = (on, buttons) => ({ type: 'actions', key: key('actions'), on, buttons, answer: null });
const logEvent = (state, entry) => ({ ...state, log: [...state.log, entry] });
const wait = (state, on, label, extra = {}) => ({ ...state, pending: { on, label, ...extra } });

function markAnswered(state, blockKey, value) {
  return {
    ...state,
    messages: state.messages.map(m => (m.blocks?.some(b => b.key === blockKey)
      ? { ...m, blocks: m.blocks.map(b => (b.key === blockKey ? { ...b, answer: value } : b)) }
      : m)),
  };
}

function closeOpen(state, type, value) {
  return {
    ...state,
    messages: state.messages.map(m => (m.blocks?.some(b => b.type === type && b.answer == null)
      ? { ...m, blocks: m.blocks.map(b => (b.type === type && b.answer == null ? { ...b, answer: value } : b)) }
      : m)),
  };
}

function lastOpenBlock(state) {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const block = state.messages[i].blocks?.find(b => ['options', 'actions', 'rating', 'check', 'diff'].includes(b.type) && b.on && b.answer == null);
    if (block) return block;
  }
  return null;
}

// ---------------------------------------------------------------- scenes

function enter(state, scene, t) {
  const base = { ...state, scene, pending: null };
  switch (scene) {
    case 'home':
      return { ...base, messages: [], tab: 'bench' };
    case 'setup':
      return say({ ...base, messages: [], tab: 'camera', setup: { ...initialState.setup, started: true } }, 'Let’s teach the camera your bench. Take everything off the breadboard so every hole is visible, then tell me.', t);
    case 'plan': {
      let s = you({ ...base, messages: [], tab: 'plan', plan: { choice: null } }, 'I want to make an LED light up. I’ve got the kit from class.');
      return say(s, 'Good first build. Should it stay on, blink, or turn on when you press a button?', t, [planQuestion()]);
    }
    case 'parts':
      return say({ ...base, messages: [], tab: 'bench' }, 'Lay your parts on the mat where the camera can see them — spread out, not in a pile.', t);
    case 'build': {
      const s = { ...base, messages: [], tab: 'bench', build: { ...initialState.build, times: { 1: t } } };
      return presentStep(s, 2, t);
    }
    case 'debug': {
      let s = { ...base, messages: [], tab: 'code', debug: { reported: false, fixed: false } };
      s = activity(s, 'arrow-up', 'Sketch uploaded to the Arduino Uno', t, 'ok');
      return say(s, 'The sketch is running. I can see the red and yellow LEDs blinking — tell me if anything looks off.', t);
    }
    default:
      return base;
  }
}

const planQuestion = () => options('plan-choice', 'How should the LED behave?', [
  { id: 'on', title: 'Just stay on', sub: 'No code needed' },
  { id: 'blink', title: 'Blink', sub: 'Uses the Arduino and a short sketch' },
  { id: 'button', title: 'Turn on with a button', sub: 'Adds a push button' },
]);

function presentStep(state, step, t) {
  const s = { ...state, build: { ...state.build, step } };
  return say(s, `Step ${step}: ${LAB3.steps[step - 1].ask}. Tell me when it’s done.`, t);
}

function passStep(state, step, t, rows) {
  let s = runlog(state, `Checked camera, board and plan · step ${step} matches`, rows, false);
  s = { ...s, build: { ...s.build, statuses: { ...s.build.statuses, [step]: 'done' }, times: { ...s.build.times, [step]: t } } };
  s = divider(s, `Step ${step} verified · ${t}`);
  return s;
}

function enterTest(state, t) {
  let s = { ...state, scene: 'test', tab: 'bench' };
  s = divider(s, `Build complete · ${t}`);
  s = activity(s, 'zap', 'Power detected — switched to live current readings', t, 'ok');
  s = logEvent(s, { status: 'done', time: t, title: 'Power on', sub: '13.6 mA · 2.01 V' });
  s = say(s, 'Power’s on. The LED draws **13.6 mA**, right inside its safe range, and row 3 sits at **2.01 V** — the voltage a red LED drops when it’s lit.', t, [{ type: 'chart' }]);
  return say(s, 'Last check is yours — the camera sees a glow, but you’re closer.', t, [ledQuestion()]);
}

const ledQuestion = () => options('test-lit', 'Is the LED lit on your desk?', [
  { id: 'yes', title: 'Yes, it’s on', sub: 'Finish the lab' },
  { id: 'no', title: 'No, it’s dark', sub: 'We’ll find out why together' },
]);

function enterDone(state, t) {
  let s = { ...state, scene: 'done', tab: 'session', test: { lit: true } };
  s = logEvent(s, { status: 'done', time: t, title: 'LED lit', sub: 'you confirmed it' });
  s = divider(s, `Lab 3 complete · ${t}`);
  s = say(s, 'That’s the lab done — the LED is lit and every check passed.', t, [
    { type: 'summary' },
    actions('done-next', [{ id: 'lab4', label: 'Start Lab 4 · Three LEDs', primary: true, icon: 'chev-right' }, { id: 'save', label: 'Save notes', icon: 'book' }]),
  ]);
  return say(s, 'One quick question for the course study: how hard did this lab feel?', t, [{ type: 'rating', key: key('rating'), on: 'rating', answer: null }]);
}

// ---------------------------------------------------------------- handlers

const HANDLERS = {
  'plan-choice'(s, value, t) {
    const titles = { on: 'Just stay on', blink: 'Blink', button: 'Turn on with a button' };
    s = you(s, titles[value]);
    if (value !== 'on') {
      return say(s, 'Good idea for later — that one needs a short sketch (it’s close to Lab 1 and Lab 2). For this guided build, pick **Just stay on**.', t, [planQuestion()]);
    }
    return wait({ ...s, plan: { choice: 'on' } }, 'plan-draft', 'Drafting the plan…');
  },
  'plan-next'(s, value, t) {
    if (value === 'approve') return enter(s, 'parts', t);
    s = you(s, 'Change something');
    return say(s, 'Sure — what would you like to change? Parts, rows or how it behaves; just describe it.', t);
  },
  'setup-rail'(s, value, t) {
    s = you(s, value === 'top' ? 'Yes — the red stripe is on top' : 'No — it’s along the bottom edge');
    s = { ...s, setup: { ...s.setup, railConfirmed: true } };
    if (value === 'bottom') s = say(s, 'Got it — I’ve flipped the rail labels, so + is along the bottom edge.', t);
    return wait(s, 'setup-finish', 'Checking sensing strips and Arduino…');
  },
  'setup-next'(s, value, t) {
    return enter(s, 'home', t);
  },
  'parts-next'(s, value, t) {
    if (value === 'start') {
      const next = enter(logEvent(s, { status: 'done', time: t, title: 'Parts checked', sub: 'everything on the list was there' }), 'build', t);
      return { ...next, parts: { scanned: true } };
    }
    return wait(you(s, 'Scan again'), 'parts-scan', 'Scanning the table…');
  },
  'led-direction'(s, value, t) {
    if (value === 'row3') {
      s = you(s, 'Row 3');
      s = logEvent(s, { status: 'done', time: t, title: 'Step 3 · LED direction', sub: 'you confirmed the long leg' });
      s = say(s, 'Then it’s the right way round — the long leg goes toward the resistor.', t);
      s = { ...s, build: { ...s.build, statuses: { ...s.build.statuses, 3: 'done' }, times: { ...s.build.times, 3: t } } };
      s = divider(s, `Step 3 verified · ${t}`);
      return presentStep(s, 4, t);
    }
    if (value === 'row4') {
      s = you(s, 'Row 4');
      s = { ...s, build: { ...s.build, statuses: { ...s.build.statuses, 3: 'fix' }, attempts: { ...s.build.attempts, 3: 1 } } };
      return say(s, 'Then it’s backwards — LEDs only light one way. Pull it out, turn it around so the long leg is in row 3, and tell me when it’s back in.', t);
    }
    s = you(s, 'I can’t tell');
    return say(s, 'Look at the legs, not the top: one is a few millimetres longer — that’s +. If they’ve been trimmed, the flat edge on the LED’s rim marks the − side.', t, [ledDirectionQuestion()]);
  },
  'check-fail'(s, value, t) {
    return userDone(you(s, 'I’ve swapped it'), t);
  },
  'test-lit'(s, value, t) {
    if (value === 'yes') return enterDone(you(s, 'Yes, it’s on'), t);
    s = you(s, 'No, it’s dark');
    return say(s, 'The board says current is flowing, so let’s rule out the simple things: is the long leg in row 3, and are you looking straight down at it? Some red LEDs are dim from the side.', t, [ledQuestion()]);
  },
  'done-next'(s, value, t) {
    if (value === 'lab4') return enter(s, 'debug', t);
    return say(you(s, 'Save notes'), 'Saved with this session (demo only — nothing leaves the browser yet).', t);
  },
  rating(s, value, t) {
    return say({ ...s, done: { rating: value } }, `Thanks — noted ${value} of 7. That helps us tune how much the assistant explains.`, t);
  },
  'debug-fix'(s, value, t) {
    if (value === 'fix') return wait(you(s, 'Fix the code and upload'), 'debug-upload', 'Uploading the sketch…');
    s = you(s, 'I’ll move the wire to pin 12');
    return say({ ...s, debug: { ...s.debug, movingWire: true } }, 'That works too — move the green LED’s wire from pin 11 to pin 12 and tell me when it’s done.', t);
  },
  'debug-next'(s, value, t) {
    return enter(s, 'home', t);
  },
};

const ledDirectionQuestion = () => options('led-direction', 'Which row is the long leg in?', [
  { id: 'row3', title: 'Row 3', sub: 'Matches the plan' },
  { id: 'row4', title: 'Row 4', sub: 'I’ll help you flip it' },
  { id: 'cant', title: 'I can’t tell', sub: 'Show me how to check' },
], 'Or stand the LED up straight and I’ll look again.');

// Results of long-running checks.
const RESOLVERS = {
  'plan-draft'(s, p, t) {
    s = runlog(s, 'Drafted the spec and checked it · 3 checks passed', [
      ['Plan', 'done', 'Parts — red LED, 220Ω, 3 jumpers, all in the supported set'],
      ['Plan', 'done', 'Wiring — rows 1, 3, 4 and 8 all exist on your board'],
      ['Plan', 'done', 'Current — (5 V − 2 V) ÷ 220Ω ≈ 13.6 mA, under the LED’s 20 mA limit'],
    ]);
    return say({ ...s, tab: 'plan' }, 'Here’s the plan — it’s on the right. Next I’ll look at your table to make sure you have everything.', t, [
      actions('plan-next', [{ id: 'approve', label: 'Looks good — check my parts', primary: true, icon: 'check' }, { id: 'change', label: 'Change something' }]),
    ]);
  },
  'setup-scan'(s, p, t) {
    s = runlog(s, 'Calibrated from one frame', [
      ['Camera', 'done', 'Found the hole grid at 2.54 mm spacing and flattened the view'],
      ['Camera', 'done', 'Read the printed numbers — **row 1 is on your left**'],
      ['Camera', 'unsure', 'The red stripe looks like it’s along the top edge, so + is on top'],
      ['Camera', 'done', 'Found an Arduino Uno left of the board — pin labels are readable'],
    ]);
    return say(s, 'Nearly there. Please confirm one thing — a flipped rail would put 5V where ground should be.', t, [
      options('setup-rail', 'Is the red (+) rail along the top edge?', [
        { id: 'top', title: 'Yes — the red stripe is on top', sub: 'Matches the photo on the right' },
        { id: 'bottom', title: 'No — it’s along the bottom edge', sub: 'I’ll flip the rail labels' },
      ], 'The red line is printed right next to the + rail.'),
    ]);
  },
  'setup-finish'(s, p, t) {
    s = runlog(s, 'Checked the rest of the bench', [
      ['Board', 'done', 'All 16 sensing strips respond'],
      ['Bench', 'done', 'Arduino Uno connected over USB serial'],
    ]);
    s = { ...s, setup: { ...s.setup, done: true } };
    return say(s, 'Your bench is ready. I’ll recalibrate automatically if the camera or the board moves.', t, [
      actions('setup-next', [{ id: 'home', label: 'Back to home', primary: true, icon: 'home' }]),
    ]);
  },
  'parts-scan'(s, p, t) {
    s = runlog(s, 'Scanned the table · 12 parts', [
      ['Camera', 'done', '2 red LEDs, 5 jumper wires, 1 push button, 1 capacitor'],
      ['Camera', 'done', '3 resistors: two **220Ω** (red–red–brown) and one **10kΩ** (brown–black–orange)'],
      ['Plan', 'done', 'Everything on the parts list is here'],
    ]);
    s = { ...s, parts: { scanned: true } };
    return say(s, 'You’re all set. One heads-up: the 10kΩ looks a lot like the 220Ω. Keep it to one side so it doesn’t end up on the board.', t, [
      { type: 'tiles', tiles: [
        { zoom: 'table220', label: 'Use one of these', value: '220Ω', tone: 'good' },
        { zoom: 'table10k', label: 'Set this aside', value: '10kΩ', tone: 'warn' },
      ] },
      actions('parts-next', [{ id: 'start', label: 'Start building', primary: true, icon: 'chev-right' }, { id: 'rescan', label: 'Scan again', icon: 'scan' }]),
    ]);
  },
  'build-check'(s, p, t) {
    const step = s.build.step;
    const attempts = s.build.attempts[step] || 0;
    s = { ...s, build: { ...s.build, attempts: { ...s.build.attempts, [step]: attempts + 1 } } };
    if (step === 2) {
      s = passStep(s, 2, t, [['Camera', 'done', 'Red jumper + → row 1, black jumper − → row 8'], ['Board', 'done', 'Row 1 connects to the + rail, row 8 to −'], ['Plan', 'done', 'Matches step 2']]);
      return presentStep(s, 3, t);
    }
    if (step === 3 && attempts === 0) {
      s = activity(s, 'eye', 'Hands over the board — waited until they moved away', t, 'ok');
      s = runlog(s, 'Checked camera, board and plan · 1 unsure', [
        ['Camera', 'unsure', 'LED is across rows 3–4 but leaning over its legs — I can’t see which one is longer'],
        ['Board', 'done', 'Something bridges rows 3 and 4'],
        ['Plan', 'done', 'The long leg (+) should be in row 3, on the resistor’s side'],
      ]);
      s = { ...s, build: { ...s.build, statuses: { ...s.build.statuses, 3: 'unsure' } } };
      return say(s, 'The LED is in the right rows, but I can’t tell which way round it is. LEDs only light one way, so this matters.', t, [ledDirectionQuestion()]);
    }
    if (step === 3) {
      s = logEvent(s, { status: 'done', time: t, title: 'Step 3 · LED direction', sub: 'flipped and re-checked' });
      s = passStep(s, 3, t, [['Camera', 'done', 'LED upright, long leg in row 3'], ['Board', 'done', 'Rows 3–4 conduct one way, as expected']]);
      return presentStep(s, 4, t);
    }
    if (step === 4) {
      s = passStep(s, 4, t, [['Camera', 'done', 'Yellow jumper from row 4 to row 8'], ['Board', 'done', 'Rows 4 and 8 are connected'], ['Plan', 'done', 'Matches step 4']]);
      return presentStep(s, 5, t);
    }
    if (step === 5 && attempts === 0) {
      s = runlog(s, 'Checked camera, board and plan', [
        ['Camera', 'fix', 'Resistor in rows 1 → 3 reads **brown–black–orange** (10kΩ)'],
        ['Board', 'fix', 'Row 1 draws **0.30 mA** — a 220Ω would allow ~13 mA'],
        ['Plan', 'done', 'Placement matches step 5: rows 1 → 3'],
      ], false);
      s = { ...s, build: { ...s.build, statuses: { ...s.build.statuses, 5: 'fix' } } };
      s = logEvent(s, { status: 'fix', time: t, title: 'Step 5 · wrong resistor', sub: '10kΩ instead of 220Ω' });
      return say(s, 'Right rows, wrong resistor. That’s a **10kΩ** (brown–black–orange) — it lets so little current through that the LED can’t light. Pull it out and push a 220Ω into the same holes.', t, [
        { type: 'check', variant: 'fail', key: key('check'), on: 'check-fail', answer: null },
        { type: 'feedback', key: key('feedback'), answer: null },
      ]);
    }
    // step 5, second attempt
    s = closeOpen(s, 'check', 'swapped');
    s = logEvent(s, { status: 'done', time: t, title: 'Step 5 passed', sub: 'after the swap' });
    s = say(s, 'That’s the one. Row 1 now draws 13.6 mA and row 3 reads 2.01 V — right where they should be.', t, [{ type: 'check', variant: 'pass' }]);
    s = { ...s, build: { ...s.build, statuses: { ...s.build.statuses, 5: 'done' }, times: { ...s.build.times, 5: t }, step: 6 } };
    s = divider(s, `Step 5 verified · ${t}`);
    return enterTest(s, t);
  },
  'debug-check'(s, p, t) {
    s = runlog(s, 'Debugged with 4 sources', [
      ['Camera', 'fix', 'Red and yellow LEDs blink; the green one stays dark'],
      ['Board', 'fix', 'The green LED’s row draws 0.00 mA — no current reaches it'],
      ['Serial', 'done', 'Your sketch prints “LED 3 on (pin 12)”'],
      ['Code', 'fix', '`leds[]` lists pin **12**, but the green wire is in pin **11**'],
    ]);
    s = { ...s, debug: { ...s.debug, reported: true }, tab: 'code' };
    return say(s, 'Found it — your wiring is fine. The sketch turns on pin 12, but the green LED’s wire goes to pin 11.', t, [
      { type: 'tiles', tiles: [
        { zoom: 'lab4Red', label: 'Red · pin 9', value: 'Blinking', tone: 'good' },
        { zoom: 'lab4Green', label: 'Green · pin 11', value: 'Dark', tone: 'bad' },
      ] },
      { type: 'diff', key: key('diff'), on: 'debug-fix', answer: null },
      { type: 'feedback', key: key('feedback'), answer: null },
    ]);
  },
  'debug-upload'(s, p, t) {
    s = closeOpen({ ...s, debug: { ...s.debug, fixed: true, fixedBy: 'code' } }, 'diff', 'fix');
    s = activity(s, 'arrow-up', 'Uploaded the fixed sketch to the Arduino Uno', t, 'ok');
    return say(s, 'All three LEDs blink now, and the serial monitor shows pin 11 for LED 3. Every test passes.', t, [
      actions('debug-next', [{ id: 'home', label: 'Back to home', primary: true, icon: 'home' }]),
    ]);
  },
};

RESOLVERS['debug-wire'] = (s, p, t) => {
  s = closeOpen({ ...s, debug: { ...s.debug, fixed: true, fixedBy: 'wire' } }, 'diff', 'wire');
  return say(s, 'All three LEDs blink now — the green LED is on pin 12, which is the pin your sketch drives. Every test passes.', t, [
    actions('debug-next', [{ id: 'home', label: 'Back to home', primary: true, icon: 'home' }]),
  ]);
};

// Text the user types (or a chip they click) that means "do the next thing".
const INTENTS = {
  setup: [[/\b(empty|clear|ready|done)\b/, s => (s.setup.done || s.pending ? null : 'setup-scan')]],
  parts: [[/\b(all out|they.?re out|ready|done|laid|spread)\b/, s => (s.parts.scanned ? null : 'parts-scan')]],
  build: [[/\b(done|finished|it.?s in|placed|swapp?ed|replaced|flipped|ok|okay)\b/, () => 'build-check']],
  debug: [
    [/green|isn.?t blinking|not blinking|dark|doesn.?t blink/, s => (s.debug.reported ? null : 'debug-check')],
    [/\b(done|moved|swapp?ed)\b/, s => (s.debug.movingWire && !s.debug.fixed ? 'debug-wire' : null)],
  ],
};

function userDone(s, t) {
  const step = s.build.step;
  return wait(s, 'build-check', step === 5 && (s.build.attempts[5] || 0) > 0 ? 'Checking the new resistor…' : 'Watching for your hands to leave the board…', { t });
}

// ---------------------------------------------------------------- reducer

export function reducer(state, action) {
  const t = action.time;
  switch (action.type) {
    case 'go':
      return enter(state, action.scene, t);
    case 'preset':
      return initFromPreset(action.name, t);
    case 'reset':
      return enter({ ...initialState }, 'home', t);
    case 'tab':
      return { ...state, tab: action.tab };
    case 'toggle-runlog':
      return { ...state, messages: state.messages.map(m => (m.id === action.id ? { ...m, open: !m.open } : m)) };
    case 'feedback':
      return markAnswered(state, action.key, action.value);
    case 'answer': {
      if (state.pending) return state;
      const block = action.key === 'last' ? lastOpenBlock(state) : state.messages.flatMap(m => m.blocks || []).find(b => b.key === action.key);
      if (!block || block.answer != null) return state;
      if (block.on === 'check-fail' && action.value === 'show') return { ...state, tab: 'bench', highlight: (state.highlight || 0) + 1 };
      const s = markAnswered(state, block.key, action.value);
      return HANDLERS[block.on](s, action.value, t);
    }
    case 'say': {
      const text = action.text.trim();
      if (!text || state.pending) return state;
      let s = you(state, text);
      const rules = INTENTS[state.scene] || [];
      for (const [test, pick] of rules) {
        if (test.test(text.toLowerCase())) {
          const on = pick(state);
          if (on === 'build-check') return userDone(s, t);
          if (on) return wait(s, on, { 'setup-scan': 'Calibrating from one frame…', 'parts-scan': 'Scanning the table…', 'debug-check': 'Reading camera, board, serial and code…', 'debug-wire': 'Re-checking all three LEDs…' }[on]);
        }
      }
      const r = reply(text, state.scene);
      s = say(s, r.text, t, r.blocks || []);
      return r.tab ? { ...s, tab: r.tab } : s;
    }
    case 'resolve': {
      if (!state.pending) return state;
      const { on } = state.pending;
      return RESOLVERS[on]({ ...state, pending: null }, state.pending, t);
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------- presets (?scene=)

const R = { type: 'resolve' };
const PRESETS = {
  home: [],
  setup: [{ type: 'go', scene: 'setup' }, { type: 'say', text: 'ok, it’s empty' }, R],
  plan: [{ type: 'go', scene: 'plan' }, { type: 'answer', key: 'last', value: 'on' }, R],
  parts: [{ type: 'go', scene: 'parts' }, { type: 'say', text: 'ok they’re all out' }, R],
  unsure: [{ type: 'go', scene: 'build' }, { type: 'say', text: 'done' }, R, { type: 'say', text: 'done' }, R],
};
PRESETS.check = [...PRESETS.unsure, { type: 'answer', key: 'last', value: 'row3' }, { type: 'say', text: 'done' }, R, { type: 'say', text: 'done, resistor is in' }, R];
PRESETS.map = [...PRESETS.check, { type: 'say', text: 'how do I tell them apart? they look the same to me' }];
PRESETS.test = [...PRESETS.check, { type: 'answer', key: 'last', value: 'swapped' }, R];
PRESETS.done = [...PRESETS.test, { type: 'answer', key: 'last', value: 'yes' }];
PRESETS.debug = [{ type: 'go', scene: 'debug' }, { type: 'say', text: 'the green one isn’t blinking' }, R];

export const SCENES = Object.keys(PRESETS);

export function initFromPreset(name, time) {
  const steps = PRESETS[name] || [];
  return steps.reduce((s, a) => reducer(s, { ...a, time }), { ...initialState });
}
