// Real GameScene callbacks -> ScoringEngine -> Adapter -> Evidence/Summary.
// No Phaser, no canvas. Uses a minimal shim.

const { Evidence } = require('../js/core/Evidence.js');
const { Adapter }  = require('../js/core/Adapter.js');

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

// ── Simulate a minimal ScoringEngine record sequence ─────────────────────────────
const decisions = [];

function record(level, value, extra) {
  extra = extra || {};
  decisions.push(Object.assign({ level, value }, extra));
}

// Ch1: three pairs
record(1, 'narrow', { scenarioId:'ch1:pair', trialId:'pair1', pHigh:0.3, pairIdx:0, phase:'baseline' });
record(1, 'wide',   { scenarioId:'ch1:pair', trialId:'pair2', pHigh:0.5, pairIdx:1, phase:'baseline' });
record(1, 'wide',   { scenarioId:'ch1:pair', trialId:'pair3', pHigh:0.7, pairIdx:2, phase:'baseline' });
record(1, 'ch1_done', { choices:['narrow','wide','wide'], districtId:'transport' });

// Ch2: research then decide
record(2, 'research',  { scenarioId:'ch2:setback', phase:'baseline' });
record(2, 'wait',      { scenarioId:'ch2:setback', trialId:'l2main', hadResearch:true, phase:'baseline' });

// Ch3: cube placements
['housing','technology','technology','energy','transport','housing'].forEach((d, i) => {
  record(3, d, { cubeIndex:i+1, scenarioId:'ch3:allocate', phase:'baseline' });
});

// Ch4
record(4, 'festival', { scenarioId:'ch4:timing', phase:'baseline' });

// Ch5
record(5, 'hold', { scenarioId:'ch5:boom', phase:'baseline' });

// Ch6
record(6, 'accept', { scenarioId:'ch6:delegation', phase:'baseline' });

// Ch7
record(7, 'hold', { scenarioId:'ch7:news', phase:'baseline' });

// Ch8
record(8, 'rebalance', { scenarioId:'ch8:storm', phase:'baseline' });

// Ch9
record(9, 'sell', { scenarioId:'ch9:matched_gain_loss', action:'sell_winner', trialId:'review1', phase:'baseline' });
record(9, 'sell', { scenarioId:'ch9:matched_gain_loss', action:'sell_loser',  trialId:'review2', phase:'baseline' });
record(9, 'sell', { scenarioId:'ch9:matched_gain_loss', action:'sell_winner', trialId:'review3', phase:'baseline' });
record(9, 'sell', { scenarioId:'ch9:prospects',         action:'sell_weaker', trialId:'review4', phase:'baseline' });

// Ch10
record('forecast', 0.6, { forecastId:'f1', scenarioId:'ch10:forecast', action:'forecast', p:0.6, modelP:0.55, phase:'baseline' });

// ── Convert via Adapter ─────────────────────────────────────────────────────────────
const events = Adapter.toEvents(decisions);

// ch1_done marker is filtered out
assert(!events.some(e => e.value === 'ch1_done'), 'ch1_done filtered');

// All ch1 pairs are present
const ch1 = events.filter(e => e.scenarioId === 'ch1:pair');
assert(ch1.length === 3, 'ch1: 3 pair events');
assert(ch1[0].action === 'narrow', 'ch1 pair1: action=narrow');
assert(ch1[1].action === 'wide',   'ch1 pair2: action=wide');

// Ch3 allocate: districtId and action='allocate'
const ch3 = events.filter(e => e.scenarioId === 'ch3:allocate');
assert(ch3.length === 6, 'ch3: 6 cube events');
ch3.forEach(e => {
  assert(e.action === 'allocate', 'ch3 cube: action=allocate');
  assert(typeof e.districtId === 'string', 'ch3 cube: has districtId');
});

// Ch9 matched
const ch9m = events.filter(e => e.scenarioId === 'ch9:matched_gain_loss');
assert(ch9m.length === 3, 'ch9 matched: 3 events');
assert(ch9m.filter(e => e.action==='sell_winner').length === 2, 'ch9: 2 sell_winner');
assert(ch9m.filter(e => e.action==='sell_loser' ).length === 1, 'ch9: 1 sell_loser');

// Forecast
const ch10 = events.filter(e => e.action === 'forecast');
assert(ch10.length === 1, 'ch10: 1 forecast event');
assert(ch10[0].p === 0.6, 'ch10: p=0.6');

// ── Evidence layer ──────────────────────────────────────────────────────────────
const conc = Evidence.concentration(events);
assert(conc.available, 'concentration: available');
assert(conc.total === 6, 'concentration: 6 cubes');
assert(conc.largestShare > 0, 'concentration: largestShare > 0');

const disp = Evidence.disposition(events);
assert(disp.available, 'disposition: available from events');
assert(disp.n === 3, 'disposition: n=3 matched');

console.log('feedback.integration.test.js: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
