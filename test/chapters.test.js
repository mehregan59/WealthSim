const C = require('../js/core/Chapters.js').Chapters;
const E = require('../js/core/Evidence.js').Evidence;
const Sim = require('../js/core/Sim.js').Sim;
// Chapters.js loads Sim via closure argument; in Node we pass it directly.
const Ch = (function(){
  let root = {};
  // Re-execute Chapters factory with the real Sim
  const factory = require('../js/core/Chapters.js');
  // The IIFE exports to root.Chapters; factory = module.exports = root
  return root.Chapters || factory.Chapters;
})();

// ── Chapters.js self-contained tests ──────────────────────────────────────────────────
let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}
function assertApprox(a, b, msg, tol) {
  tol = tol || 1e-9;
  assert(Math.abs(a - b) < tol, msg + ' (got ' + a + ', expected ' + b + ')');
}

// ── 1. expected() and spread() ──────────────────────────────────────────────────
const NARROW = C.NARROW;
const ev = C.expected(NARROW);
assert(Math.abs(ev - (0.6*110 + 0.4*90)) < 1e-9, 'expected(NARROW) = 102');
assert(Math.abs(ev - 102) < 1e-9, 'expected(NARROW) = 102 exact');
const sp = C.spread(NARROW);
const expVar = 0.6*Math.pow(110-102,2) + 0.4*Math.pow(90-102,2);
assertApprox(sp, Math.sqrt(expVar), 'spread(NARROW)');

// ── 2. dominates(): no pair dominates the other ───────────────────────────────
C.CH1_PAIRS.forEach(function (p, i) {
  assert(!C.dominates(p.narrow, p.wide),  'pair' + (i+1) + ': narrow does not dominate wide');
  assert(!C.dominates(p.wide,   p.narrow),'pair' + (i+1) + ': wide does not dominate narrow');
});

// ── 3. riskPairs: empty input ──────────────────────────────────────────────────
const rp0 = C.riskPairs([]);
assert(rp0.available === false, 'riskPairs([]) -> available:false');

// ── 4. riskPairs: monotone wide sequence ─────────────────────────────────────
const evtsMonotone = [
  { scenarioId:'ch1:pair', trialId:'pair1', action:'narrow', phase:'baseline' },
  { scenarioId:'ch1:pair', trialId:'pair2', action:'wide',   phase:'baseline' },
  { scenarioId:'ch1:pair', trialId:'pair3', action:'wide',   phase:'baseline' },
];
const rpm = C.riskPairs(evtsMonotone);
assert(rpm.available,            'riskPairs monotone: available');
assert(rpm.n === 3,              'riskPairs monotone: n=3');
assert(rpm.wideCount === 2,      'riskPairs monotone: wideCount=2');
assert(rpm.monotonic === true,   'riskPairs monotone: monotonic');
assertApprox(rpm.switchAt, 0.5,  'riskPairs monotone: switchAt=0.5');

// ── 5. riskPairs: non-monotone ──────────────────────────────────────────────
const evtsNon = [
  { scenarioId:'ch1:pair', trialId:'pair1', action:'wide',   phase:'baseline' },
  { scenarioId:'ch1:pair', trialId:'pair2', action:'narrow', phase:'baseline' },
  { scenarioId:'ch1:pair', trialId:'pair3', action:'wide',   phase:'baseline' },
];
const rpn = C.riskPairs(evtsNon);
assert(rpn.monotonic === false, 'riskPairs non-monotone: monotonic=false');
assert(rpn.switchAt  === null,  'riskPairs non-monotone: switchAt=null');

// ── 6. ch9Trials determinism ─────────────────────────────────────────────────
const t1 = C.ch9Trials('abc');
const t2 = C.ch9Trials('abc');
assert(t1.length === 4, 'ch9Trials returns 4 trials');
assert(JSON.stringify(t1) === JSON.stringify(t2), 'ch9Trials is deterministic');
// All project ids are unique within each trial
t1.forEach(function (t) {
  const ids = t.projects.map(function (p){ return p.id; });
  assert(new Set(ids).size === ids.length, 'ch9Trials: unique project ids in trial ' + t.trialId);
});
// Trial types: 3 matched + 1 prospects
const types = t1.map(function (t){ return t.type; });
assert(types.filter(function (x){ return x==='matched'; }).length === 3, 'ch9Trials: 3 matched');
assert(types.filter(function (x){ return x==='prospects'; }).length === 1, 'ch9Trials: 1 prospects');

// ── 7. resolveCh9 ──────────────────────────────────────────────────────────
const matchedTrial = t1.find(function (t){ return t.type==='matched'; });
const gainProj  = matchedTrial.projects.find(function (p){ return p.purchase < p.current; });
const lossProj  = matchedTrial.projects.find(function (p){ return p.purchase > p.current; });
if (gainProj && lossProj) {
  const rg = C.resolveCh9(matchedTrial, gainProj.id);
  assert(rg.action === 'sell_winner', 'resolveCh9: sell gain project = sell_winner');
  assert(rg.scenarioId === 'ch9:matched_gain_loss', 'resolveCh9: scenarioId matched');
  const rl = C.resolveCh9(matchedTrial, lossProj.id);
  assert(rl.action === 'sell_loser', 'resolveCh9: sell loss project = sell_loser');
}

// ── 8. disposition ───────────────────────────────────────────────────────────
const dispEvts = [
  { scenarioId:'ch9:matched_gain_loss', action:'sell_winner', phase:'baseline' },
  { scenarioId:'ch9:matched_gain_loss', action:'sell_winner', phase:'baseline' },
  { scenarioId:'ch9:matched_gain_loss', action:'sell_loser',  phase:'baseline' },
];
const disp = C.disposition(dispEvts);
assert(disp.available,        'disposition: available');
assert(disp.n === 3,          'disposition: n=3');
assert(disp.soldGain === 2,   'disposition: soldGain=2');
assert(disp.soldLoss === 1,   'disposition: soldLoss=1');
// Practice events are excluded
const dispEvts2 = dispEvts.concat([{ scenarioId:'ch9:matched_gain_loss', action:'sell_winner', phase:'practice' }]);
const disp2 = C.disposition(dispEvts2);
assert(disp2.n === 3, 'disposition: practice events excluded');

// ── 9. forecastEvent ─────────────────────────────────────────────────────────
const f1 = C.FORECASTS[0]; // technology
const fe = C.forecastEvent(f1, 0.73);
assertApprox(fe.p, 0.7, 'forecastEvent: p rounded to 0.7', 1e-9);
assert(fe.scenarioId === 'ch10:forecast', 'forecastEvent: scenarioId');
assert(fe.action === 'forecast', 'forecastEvent: action');
assert(typeof fe.modelP === 'number' && fe.modelP >= 0 && fe.modelP <= 1, 'forecastEvent: modelP in [0,1]');
assert(fe.outcome === undefined, 'forecastEvent: no yearReturns -> outcome undefined');
// With yearReturns
const fe2 = C.forecastEvent(f1, 0.6, { technology: 0.05 });
assert(fe2.outcome === 1, 'forecastEvent: positive return -> outcome=1');
const fe3 = C.forecastEvent(f1, 0.4, { technology: -0.02 });
assert(fe3.outcome === 0, 'forecastEvent: negative return -> outcome=0');

// ── 10. modelGap ──────────────────────────────────────────────────────────
const mgEvts = [
  { action:'forecast', p:0.6, modelP:0.5 },
  { action:'forecast', p:0.4, modelP:0.6 },
];
const mg = C.modelGap(mgEvts);
assert(mg.available, 'modelGap: available');
assertApprox(mg.meanGap, 0.15, 'modelGap: mean = (0.1+0.2)/2 = 0.15', 0.001);
assert(C.modelGap([]).available === false, 'modelGap: empty -> available:false');

// ── 11. practiceTrial ────────────────────────────────────────────────────────
const pt1 = C.practiceTrial({ concentration: { available:true, largestShare:0.6 } });
assert(pt1.kind === 'allocation', 'practiceTrial: high concentration -> allocation');
assert(pt1.phase === 'practice',  'practiceTrial: phase=practice');

const pt2 = C.practiceTrial({ concentration: { available:false }, patterns: [
  { dimension:'response_to_social_cues', coverage:'moderate' }
]});
assert(pt2.kind === 'headline', 'practiceTrial: news pattern -> headline');

const pt3 = C.practiceTrial({ concentration: { available:false }, patterns:[] });
assert(pt3.kind === 'contract', 'practiceTrial: fallback -> contract');

// ── 12. transfer ────────────────────────────────────────────────────────────
const pr1 = { kind:'allocation', baseline:{ largestShare:0.7 } };
const trEvts1 = [
  { scenarioId:'ch3:allocate', districtId:'technology', phase:'practice' },
  { scenarioId:'ch3:allocate', districtId:'technology', phase:'practice' },
  { scenarioId:'ch3:allocate', districtId:'housing',    phase:'practice' },
];
const tr1 = C.transfer(pr1, trEvts1);
assert(tr1.available, 'transfer allocation: available');
assert(tr1.kind === 'allocation', 'transfer allocation: kind');
assertApprox(tr1.practiceLargestShare, 2/3, 'transfer allocation: largestShare=2/3', 1e-9);

// ── Result ───────────────────────────────────────────────────────────────
console.log('chapters.test.js: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
