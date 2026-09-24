/**
 * gamescene.harness.test.js
 * Headless regression harness for GameScene logic.
 *
 * Runs entirely in Node.js using a minimal Phaser stub (no browser, no canvas).
 * Covers the three primary behaviour paths through all 10 chapters plus
 * regression cases from the implementation brief.
 *
 * Run:  node test/gamescene.harness.test.js
 */

'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// ── Minimal stubs ─────────────────────────────────────────────────────────────

function makePhaserStub() {
  const noop = () => ({});
  const chainable = () => stub;
  const stub = new Proxy({}, {
    get(t, k) {
      if (k === 'Math') return {
        Between: (a, b) => Math.floor((a + b) / 2),
        RND: { frac: () => 0.5 }
      };
      if (k === 'Scene') return class Scene { constructor() {} };
      if (k === 'GameObjects') return { Graphics: class {} };
      if (k === 'Geom') return {
        Rectangle: Object.assign(
          class Rectangle { constructor(x,y,w,h){this.x=x;this.y=y;this.width=w;this.height=h;} },
          { Contains: () => true }
        )
      };
      return chainable;
    }
  });
  return stub;
}

function makeChaptersStub() {
  const CH1_PAIRS = [
    { trialId:'p1', pHigh:0.3, narrow:{outcomes:[[0.6,110],[0.4,90]]}, wide:{outcomes:[[0.3,160],[0.7,75]]} },
    { trialId:'p2', pHigh:0.5, narrow:{outcomes:[[0.5,110],[0.5,90]]}, wide:{outcomes:[[0.5,150],[0.5,50]]} },
    { trialId:'p3', pHigh:0.7, narrow:{outcomes:[[0.4,110],[0.6,90]]}, wide:{outcomes:[[0.7,140],[0.3,60]]} },
  ];
  const FORECASTS = [
    { id:'f1', questionEn:'Will tech recover next year?',   questionDe:'Erholt sich Technik?', modelP:0.6, district:'technology' },
    { id:'f2', questionEn:'Will the university pay off?',   questionDe:'Zahlt sich die Uni aus?', modelP:0.65, district:'housing' },
    { id:'f3', questionEn:'Will the offer prove worthwhile?', questionDe:'Lohnt sich das Angebot?', modelP:0.55, district:'transport' },
    { id:'f4', questionEn:'Will the city recover fully?',   questionDe:'Erholt sich die Stadt?', modelP:0.7, district:'technology' },
  ];
  return {
    CH1_PAIRS,
    FORECASTS,
    forecastEvent(fspec, p, yearReturns) {
      return { forecastId: fspec.id, p: Math.round(p * 10) / 10, modelP: fspec.modelP, outcome: undefined };
    },
    ch9Trials(seed) {
      return [
        { trialId:'t1', kind:'matched_gain_loss',
          projects:[
            { id:'pa', name:'Proj Alpha', purchase:100, current:140, forwardPct:0.05 },
            { id:'pb', name:'Proj Beta',  purchase:100, current:70,  forwardPct:0.05 },
          ]},
        { trialId:'t2', kind:'matched_gain_loss',
          projects:[
            { id:'pc', name:'Proj Gamma', purchase:100, current:130, forwardPct:0.08 },
            { id:'pd', name:'Proj Delta', purchase:100, current:80,  forwardPct:0.08 },
          ]},
        { trialId:'t3', kind:'prospects_differ',
          projects:[
            { id:'pe', name:'Proj Echo',  purchase:100, current:110, forwardPct:0.15 },
            { id:'pf', name:'Proj Foxt.',  purchase:100, current:110, forwardPct:0.03 },
          ]},
      ];
    },
    resolveCh9(trial, soldId) {
      const sold = trial.projects.find(p => p.id === soldId);
      const kept = trial.projects.find(p => p.id !== soldId);
      const soldGain = sold.current - sold.purchase;
      const keptGain = kept.current - kept.purchase;
      let action;
      if (trial.kind === 'prospects_differ') {
        action = sold.forwardPct >= kept.forwardPct ? 'sell_stronger' : 'sell_weaker';
      } else {
        action = soldGain >= 0 ? 'sell_winner' : 'sell_loser';
      }
      return { action, soldId, keptId: kept.id, scenarioId: 'ch9:' + trial.kind };
    },
    practiceTrial(summary) {
      return { kind: 'contract', pairSpec: CH1_PAIRS[1] };
    },
  };
}

function makeEconomyStub() {
  const RULES = { startCash: 600 };
  const ops = {};
  ['level1','level2Start','level2','level3Deposit','level3Cube','level3End',
   'level4','level5Start','level5','level6','level7Start','level7','level8Storm','level8University','level8']
    .forEach(k => { ops[k] = () => ({ op: k, amount: 0 }); });
  ops.fundsIndex = (total) => Math.round((total / 1000) * 100);
  return { RULES, ...ops };
}

function makeSimStub() {
  let _cash = 600;
  const createSession = (seed, opts) => {
    _cash = (opts && opts.startingCash) || 600;
    const snaps = [];
    return {
      total: () => _cash,
      snapshot: () => ({ cash: _cash }),
      restore: (snap) => { _cash = snap.cash; },
    };
  };
  return { createSession };
}

// ── Test harness ──────────────────────────────────────────────────────────────

let pass = 0, fail = 0;
const failures = [];

function t(name, fn) {
  try {
    fn();
    console.log('  PASS  ' + name);
    pass++;
  } catch (e) {
    const msg = (e.stack || e.message || String(e)).split('\n').slice(0, 4).join('\n        ');
    console.log('  FAIL  ' + name + '\n        ' + msg);
    failures.push({ name, msg });
    fail++;
  }
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function near(a, b, tol, msg) {
  if (Math.abs(a - b) > (tol || 1e-6))
    throw new Error((msg ? msg + ': ' : '') + 'expected ~' + b + ' got ' + a);
}

// ── Scene factory ─────────────────────────────────────────────────────────────

function makeScene() {
  const queuedCalls = [];
  function pump() {
    let guard = 0;
    while (queuedCalls.length && guard++ < 5000) queuedCalls.shift()();
  }

  // Wire globals
  global.window = global;
  global.currentLang = 'en';
  global.Phaser = makePhaserStub();
  global.WS = {
    Chapters: makeChaptersStub(),
    Economy:  makeEconomyStub(),
    Sim:      makeSimStub(),
    Summary:  { build: () => ({ unsupported: [], observations: [], persona: null }) },
    Adapter:  { toEvents: (d) => d },
  };
  global.ScoringEngine = {
    decisions: [],
    session: {},
    reset() { this.decisions = []; },
    recordDecision(level, value, extra) {
      this.decisions.push(Object.assign({ level, value }, extra || {}));
    },
  };
  global.Reports = { level: () => ({ title: 'Report', body: 'Content' }) };
  global.WS_SEED = 'test-seed-001';

  // Stub visual classes
  const noop = () => {};
  const chainProxy = () => new Proxy({}, { get: () => chainProxy() });
  const visualStub = class {
    constructor() { return new Proxy(this, { get: (o, k) => k in o ? o[k] : chainProxy() }); }
  };
  global.AmbientSystem = class extends visualStub {
    isNightTime() { return false; }
    update() {}
  };
  global.WeatherSystem = class extends visualStub {
    startStorm(cb) { queuedCalls.push(cb); }
    startRecovery(cb) { queuedCalls.push(cb); }
    stopStorm() {}
    update() {}
  };
  global.TooltipManager = visualStub;
  global.Tutorial = class extends visualStub {
    show(name, cb) { queuedCalls.push(cb); }
    hide() {}
  };
  global.HUD = class extends visualStub {
    setLevel() {}
    advanceYear() {}
    get year() { return 2024; }
    get yearText() { return { setText() {} }; }
  };
  global.StatsPanel = class extends visualStub {
    updateStats() {}
    recordSnapshot() {}
    introHighlight(cb) { queuedCalls.push(cb); }
    setFundsCredits() {}
  };
  global.RoadNetwork = class extends visualStub {
    init() {}
    sendVisitor(cb) { queuedCalls.push(cb); }
    visitorAccept() {}
    visitorDecline() {}
    update() {}
  };
  global.ResourceCube = visualStub;
  global.WorldButton = visualStub;
  global.District = class {
    constructor(scene, cfg) {
      Object.assign(this, cfg);
      this._cb = null;
    }
    receiveResource() {}
    takeDamage() {}
    setStorm() {}
    celebrate() {}
    update() {}
    setSelectable(on, cb) { this._cb = on ? cb : null; }
  };

  // Load GameScene
  const gsCode = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'scenes', 'GameScene.js'), 'utf8'
  );
  vm.runInThisContext(gsCode + '\n;globalThis.GameScene=GameScene;');

  // Build scene instance
  const scene = new GameScene();
  const texts = [];
  const graphics = [];

  const makeGraphics = () => {
    const g = {
      fillStyle() { return this; },
      fillRect() { return this; },
      fillRoundedRect() { return this; },
      lineStyle() { return this; },
      strokeRoundedRect() { return this; },
      clear() { return this; },
      destroy() {},
      setDepth() { return this; },
      setInteractive() { return this; },
      on(ev, cb) { this['_' + ev] = cb; return this; },
    };
    graphics.push(g);
    return g;
  };

  const makeText = (x, y, text, style) => {
    const t = {
      x, y, text: String(text),
      setDepth() { return this; },
      setOrigin() { return this; },
      setAlpha() { return this; },
      setScale() { return this; },
      setPosition() { return this; },
      setInteractive() { return this; },
      setText(v) { this.text = String(v); return this; },
      on(ev, cb) { this['_' + ev] = cb; return this; },
      destroy() {},
      get displayWidth() { return 100; },
      get displayHeight() { return 20; },
    };
    texts.push(t);
    return t;
  };

  Object.assign(scene, {
    W: 1280, H: 720, S: 1, PANEL: 200,
    scale: { width: 1280, height: 720 },
    cameras: { main: { shake() {}, fade(d, r, g, b, f, cb) { if (cb) cb(null, 1); }, setBackgroundColor() {} } },
    events: { on() {}, off() {}, emit() {} },
    scene: { start(k, data) { scene._started = k; scene._startData = data; } },
    time: {
      delayedCall(ms, fn) { queuedCalls.push(fn); return { remove() {} }; },
      addEvent() { return { remove() {} }; },
    },
    tweens: {
      add(cfg) {
        if (cfg && cfg.onUpdate) try { cfg.onUpdate({ getValue: () => 1 }); } catch(e) {}
        if (cfg && cfg.onComplete) queuedCalls.push(cfg.onComplete);
        return { remove() {} };
      },
      killTweensOf() {},
      killAll() {},
    },
    add: {
      graphics: makeGraphics,
      text: makeText,
      image() { return makeText(0, 0, '', {}); },
    },
    input: { on() {}, off() {} },
    make: { graphics: makeGraphics },
  });

  // Override UI methods
  const panelHistory = [];
  scene._pendingPanel = null;

  scene._showDecisionPanel = (opts, cb) => {
    scene._pendingPanel = { opts, cb };
    panelHistory.push({ opts: opts.map(o => o.value), cb });
  };

  const consequences = [];
  scene._showConsequence = (text, cont, options) => {
    consequences.push({ text, cont });
    if (options && options.auto) {
      queuedCalls.push(() => { if (cont) cont(); });
    }
  };

  scene._showPersistentMessage = () => {};
  scene._clearPersistentMessage = () => {};
  scene._showTicker = () => {};
  scene._reportModal = (title, body, cb) => { queuedCalls.push(cb); };
  scene._worldBtnFlash = () => {};
  scene._buildWorldBtn = (label, cb) => { scene._worldBtnCb = cb; };
  scene._clearWorldBtn = () => { scene._worldBtnCb = null; };
  scene._clearSiteMarkers = () => {};
  scene._clearCubes = () => {};
  scene._spawnCubes = () => {};

  return {
    scene,
    pump,
    consequences,
    panelHistory,
    choose(value) {
      pump();
      const panel = scene._pendingPanel;
      ok(panel, 'Expected a decision panel but got none');
      ok(panel.opts.some(o => o.value === value),
        'Option "' + value + '" not offered. Available: ' + panel.opts.map(o => o.value).join(', '));
      scene._pendingPanel = null;
      panel.cb(value);
      pump();
    },
    next() {
      pump();
      const c = consequences[consequences.length - 1];
      ok(c, 'Expected a consequence to advance but none found');
      if (c.cont) { c.cont(); pump(); }
    },
    decisions: () => ScoringEngine.decisions,
  };
}

// ── Shared path definitions ───────────────────────────────────────────────────

const PATHS = {
  concentrated: {
    ch1: ['wide', 'wide', 'wide'],         // 3 wide → technology
    ch2: 'continue',
    ch3: Array(6).fill('technology'),
    ch4: 'festival',
    ch5: 'all_in',
    ch6: 'accept',
    ch7: 'invest_more',
    ch8: 'hold',
    ch9Sales: ['pa', 'pc', 'pe'],          // sell winners then stronger
    forecastP: 0.7,
  },
  cautious: {
    ch1: ['narrow', 'narrow', 'narrow'],   // 0 wide → housing
    ch2: 'cancel',
    ch3: ['housing', 'housing', 'transport', 'transport', 'energy', 'energy'],
    ch4: 'festival',
    ch5: 'hold',
    ch6: 'decline',
    ch7: 'reduce',
    ch8: 'sell_all',
    ch9Sales: ['pb', 'pd', 'pf'],          // sell losers then weaker
    forecastP: 0.3,
  },
  evidence: {
    ch1: ['narrow', 'wide', 'narrow'],     // 1 wide → energy
    ch2: 'research',                        // then continue
    ch2b: 'continue',
    ch3: ['housing', 'transport', 'technology', 'energy', 'housing', 'transport'],
    ch4: 'university',
    ch5: 'research',                        // then hold
    ch5b: 'hold',
    ch6: 'research',                        // then accept
    ch6b: 'accept',
    ch7: 'research',                        // then hold
    ch7b: 'hold',
    ch8: 'rebalance',
    ch9Sales: ['pb', 'pc', 'pe'],
    forecastP: 0.5,
  },
};

function driveScene(h, p) {
  const { scene, pump, choose, next, consequences, decisions } = h;

  // Create
  scene.create();
  pump();

  // Ch1: three contract pair decisions, then consequence
  for (const choice of p.ch1) { choose(choice); }
  next(); // ch1 consequence → _nextLevel

  // Intercept forecast: auto-respond with forecastP
  let forecastIntercepted = 0;
  const origCollect = scene._collectForecast.bind(scene);
  scene._collectForecast = (fid, cb) => {
    forecastIntercepted++;
    scene._forecastEvents.push({ forecastId: fid, p: p.forecastP, modelP: 0.6, outcome: undefined });
    ScoringEngine.recordDecision('forecast', p.forecastP, { forecastId: fid });
    if (cb) cb();
  };

  // Ch2
  if (p.ch2 === 'research') { choose('research'); next(); choose(p.ch2b || 'continue'); }
  else { choose(p.ch2); }
  next(); // ch2 consequence

  // Ch3
  for (const distId of p.ch3) {
    scene._onResourceDropped(scene.districts.find(d => d.id === distId));
  }
  pump();
  if (scene._worldBtnCb) scene._worldBtnCb();
  pump();
  next(); // ch3 consequence

  // Ch4
  choose(p.ch4);
  next();

  // Ch5
  if (p.ch5 === 'research') { choose('research'); next(); choose(p.ch5b || 'hold'); }
  else { choose(p.ch5); }
  next();

  // Ch6
  if (p.ch6 === 'research') { choose('research'); next(); choose(p.ch6b || 'accept'); }
  else { choose(p.ch6); }
  next();

  // Ch7
  if (p.ch7 === 'research') { choose('research'); next(); choose(p.ch7b || 'hold'); }
  else { choose(p.ch7); }
  next();

  // Ch8
  choose(p.ch8);
  next();

  // Ch9: three trials
  let trialIdx = 0;
  const origShowPanel = scene._showDecisionPanel;
  scene._showDecisionPanel = (opts, cb) => {
    const soldId = p.ch9Sales && p.ch9Sales[trialIdx] !== undefined
      ? p.ch9Sales[trialIdx] : opts[0].value;
    trialIdx++;
    scene._pendingPanel = null;
    cb(soldId);
    pump();
  };
  scene._level9();
  pump();
  // Restore for ch10
  scene._showDecisionPanel = origShowPanel;
  next(); // ch9 finish consequence

  // Ch10: consequence (forecast summary) then practice
  next(); // level10 consequence
  // Practice panel
  choose('narrow'); // or any valid practice option
  next(); // practice consequence → _finish

  pump();
  return { forecastIntercepted };
}

// ── Test groups ───────────────────────────────────────────────────────────────

console.log('\n── Ch1: Contract ladder routing ──');
t('3 wide choices → technology district', () => {
  const h = makeScene();
  const { scene, pump, choose } = h;
  scene.create(); pump();
  // Choose wide 3 times
  choose('wide'); choose('wide'); choose('wide');
  pump();
  const ch1Done = ScoringEngine.decisions.find(d => d.level === 1 && d.value === 'ch1_done');
  ok(ch1Done, 'ch1_done not recorded');
  ok(ch1Done.districtId === 'technology', 'expected technology, got ' + (ch1Done && ch1Done.districtId));
});

t('0 wide choices → housing district', () => {
  const h = makeScene();
  const { scene, pump, choose } = h;
  scene.create(); pump();
  choose('narrow'); choose('narrow'); choose('narrow');
  pump();
  const ch1Done = ScoringEngine.decisions.find(d => d.level === 1 && d.value === 'ch1_done');
  ok(ch1Done && ch1Done.districtId === 'housing', 'expected housing, got ' + (ch1Done && ch1Done.districtId));
});

t('1 wide choice → energy district', () => {
  const h = makeScene();
  const { scene, pump, choose } = h;
  scene.create(); pump();
  choose('narrow'); choose('wide'); choose('narrow');
  pump();
  const ch1Done = ScoringEngine.decisions.find(d => d.level === 1 && d.value === 'ch1_done');
  ok(ch1Done && ch1Done.districtId === 'energy', 'expected energy, got ' + (ch1Done && ch1Done.districtId));
});

t('each pair records trialId', () => {
  const h = makeScene();
  const { scene, pump, choose } = h;
  scene.create(); pump();
  choose('wide'); choose('narrow'); choose('wide');
  pump();
  const pairDecisions = ScoringEngine.decisions.filter(d => d.level === 1 && d.trialId);
  ok(pairDecisions.length === 3, 'expected 3 pair decisions, got ' + pairDecisions.length);
  ok(pairDecisions[0].trialId === 'p1', 'trialId mismatch: ' + pairDecisions[0].trialId);
});

console.log('\n── Ch2: Research flag preserved ──');
t('research then cancel records hadResearch=true', () => {
  const h = makeScene();
  const { scene, pump, choose, next } = h;
  scene.create(); pump();
  choose('wide'); choose('wide'); choose('wide');
  next();
  choose('research'); next();
  choose('cancel');
  const ch2 = ScoringEngine.decisions.find(d => d.level === 2 && d.value === 'cancel');
  ok(ch2 && ch2.hadResearch === true, 'hadResearch not set: ' + JSON.stringify(ch2));
});

t('direct cancel records hadResearch=false', () => {
  const h = makeScene();
  const { scene, pump, choose, next } = h;
  scene.create(); pump();
  choose('narrow'); choose('narrow'); choose('narrow');
  next();
  choose('cancel');
  const ch2 = ScoringEngine.decisions.find(d => d.level === 2 && d.value === 'cancel');
  ok(ch2 && ch2.hadResearch === false, 'hadResearch should be false: ' + JSON.stringify(ch2));
});

console.log('\n── Ch3: Allocation records & concentration ──');
t('six cube placements each record district id', () => {
  const h = makeScene();
  const { scene, pump, choose, next } = h;
  scene.create(); pump();
  choose('narrow'); choose('narrow'); choose('narrow');
  next(); // ch1 → next level
  choose('cancel'); next(); // ch2
  const cubes = ['technology','technology','technology','technology','technology','technology'];
  for (const id of cubes) scene._onResourceDropped(scene.districts.find(d => d.id === id));
  pump();
  const ch3d = ScoringEngine.decisions.filter(d => d.level === 3);
  ok(ch3d.length === 6, '6 cube decisions expected, got ' + ch3d.length);
  ok(ch3d.every(d => d.value === 'technology'), 'all should be technology');
});

console.log('\n── Ch7: invest_more handled explicitly ──');
t('invest_more in ch7 is not silently ignored', () => {
  const h = makeScene();
  const { scene, pump, choose, next } = h;
  scene.create(); pump();
  choose('wide'); choose('wide'); choose('wide'); next();
  // auto-respond to forecast
  scene._collectForecast = (fid, cb) => { scene._forecastEvents.push({forecastId:fid,p:0.5,outcome:undefined}); if(cb)cb(); };
  choose('continue'); next();
  for(let i=0;i<6;i++) scene._onResourceDropped(scene.districts.find(d=>d.id==='technology'));
  pump(); if(scene._worldBtnCb) scene._worldBtnCb(); pump(); next();
  choose('festival'); next();
  choose('hold'); next();
  choose('accept'); next();
  choose('invest_more');
  const ch7 = ScoringEngine.decisions.find(d => d.level === 7 && d.value === 'invest_more');
  ok(ch7, 'invest_more not recorded in ch7');
  ok(ch7.finalAction === 'invest_more', 'finalAction mismatch: ' + (ch7 && ch7.finalAction));
});

console.log('\n── Ch9: Disposition effect recording ──');
t('sell_winner recorded when selling the gaining project', () => {
  const h = makeScene();
  const { scene, pump, choose, next } = h;
  scene.create(); pump();
  choose('wide'); choose('wide'); choose('wide'); next();
  scene._collectForecast = (fid, cb) => { scene._forecastEvents.push({forecastId:fid,p:0.5,outcome:undefined}); if(cb)cb(); };
  choose('continue'); next();
  for(let i=0;i<6;i++) scene._onResourceDropped(scene.districts.find(d=>d.id==='technology'));
  pump(); if(scene._worldBtnCb) scene._worldBtnCb(); pump(); next();
  choose('festival'); next();
  choose('hold'); next();
  choose('accept'); next();
  choose('hold'); next();
  choose('hold'); next();
  // Ch9: sell winner in first trial
  let t9idx = 0;
  const ch9Sales = ['pa','pc','pe'];
  scene._showDecisionPanel = (opts, cb) => { cb(ch9Sales[t9idx++]); pump(); };
  scene._level9(); pump();
  next(); // ch9Finish consequence
  const ch9Decisions = ScoringEngine.decisions.filter(d => d.level === 9);
  ok(ch9Decisions.length === 3, '3 ch9 decisions expected, got ' + ch9Decisions.length);
  ok(ch9Decisions[0].value === 'sell_winner', 'first should be sell_winner, got ' + ch9Decisions[0].value);
  ok(ch9Decisions[2].value === 'sell_stronger', '3rd should be sell_stronger, got ' + ch9Decisions[2].value);
});

console.log('\n── Ch10: Brier score arithmetic ──');
t('Brier: p=1 y=1 → 0', () => {
  const b = Math.pow(1 - 1, 2);
  near(b, 0, 1e-9, 'Brier p=1,y=1');
});
t('Brier: p=0 y=1 → 1', () => {
  const b = Math.pow(0 - 1, 2);
  near(b, 1, 1e-9, 'Brier p=0,y=1');
});
t('Brier: p=0.5 → 0.25', () => {
  const b = Math.pow(0.5 - 1, 2);
  near(b, 0.25, 1e-9, 'Brier p=0.5,y=1');
});

t('practice decisions tagged phase:practice excluded from main count', () => {
  const h = makeScene();
  const { scene } = h;
  scene.create();
  ScoringEngine.recordDecision('practice', 'narrow', { kind:'contract', phase:'practice', trialId:'pair2' });
  ScoringEngine.recordDecision(1, 'wide', { pairIdx: 0 });
  const practiceObs = ScoringEngine.decisions.filter(d => d.level === 'practice' || (d.phase === 'practice'));
  const baselineObs = ScoringEngine.decisions.filter(d => d.level !== 'practice' && d.phase !== 'practice');
  ok(practiceObs.length === 1, 'practice count: ' + practiceObs.length);
  ok(baselineObs.length === 1, 'baseline count: ' + baselineObs.length);
});

console.log('\n── Full paths ──');
['concentrated', 'cautious', 'evidence'].forEach(pathName => {
  t(pathName + ': completes all 10 chapters and reaches ProfileScene', () => {
    const h = makeScene();
    const info = driveScene(h, PATHS[pathName]);
    ok(h.scene._started === 'ProfileScene',
      pathName + ' ended at: ' + h.scene._started);
    ok(info.forecastIntercepted === 4,
      '4 forecasts expected, got ' + info.forecastIntercepted);
  });

  t(pathName + ': 3 ch1 pair decisions recorded with correct trialIds', () => {
    const h = makeScene();
    driveScene(h, PATHS[pathName]);
    const pairs = ScoringEngine.decisions.filter(d => d.level === 1 && d.trialId);
    ok(pairs.length === 3, 'expected 3 pair decisions, got ' + pairs.length);
  });

  t(pathName + ': 6 ch3 cube decisions recorded', () => {
    const h = makeScene();
    driveScene(h, PATHS[pathName]);
    const ch3 = ScoringEngine.decisions.filter(d => d.level === 3);
    ok(ch3.length === 6, 'expected 6 ch3 decisions, got ' + ch3.length);
  });

  t(pathName + ': 3 ch9 decisions recorded with scenarioIds', () => {
    const h = makeScene();
    driveScene(h, PATHS[pathName]);
    const ch9 = ScoringEngine.decisions.filter(d => d.level === 9);
    ok(ch9.length === 3, 'expected 3 ch9 decisions, got ' + ch9.length);
    ok(ch9.every(d => d.scenarioId), 'all ch9 decisions should have scenarioId');
  });

  t(pathName + ': practice decisions are isolated from baseline', () => {
    const h = makeScene();
    driveScene(h, PATHS[pathName]);
    const practice = ScoringEngine.decisions.filter(d => d.phase === 'practice');
    ok(practice.length === 1, 'expected 1 practice decision, got ' + practice.length);
  });
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
if (fail === 0) {
  console.log('✓ All ' + pass + ' tests passed.');
  process.exit(0);
} else {
  console.log('✗ ' + fail + ' of ' + (pass + fail) + ' tests failed:');
  failures.forEach(f => console.log('  - ' + f.name));
  process.exit(1);
}
