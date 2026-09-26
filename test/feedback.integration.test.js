// Real GameScene callbacks -> ScoringEngine -> Adapter -> Evidence/Summary.
// Only rendering and scene navigation are stubbed; no evidence modules are stubbed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const WS = Object.assign({}, ...['Sim','Economy','Chapters','Evidence','Adapter','Summary']
  .map(n => require('../js/core/' + n + '.js')));
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const scoring = html.match(/<script>\s*(const ScoringEngine[\s\S]*?)<\/script>/)[1];
const ctx = vm.createContext({ WS, window:{WS}, Phaser:{Scene:class {}}, console:{log(){},error:console.error}, Date });
vm.runInContext(scoring + '\nthis.engine = ScoringEngine;', ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/scenes/GameScene.js'), 'utf8') + '\nthis.GameScene = GameScene;', ctx);
const g = new ctx.GameScene();
g.de = () => false;
g._showPersistentMessage = text => { g.question = text; };
g._clearPersistentMessage = () => {};
g._showDecisionPanel = (opts, cb) => { g.options = opts; g.choose = cb; };
g.sim = WS.Sim.createSession('feedback-regression');
g._forecastEvents = [];
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }
function summary() { return WS.Summary.build(WS.Adapter.toEvents(ctx.engine.decisions), {}); }

test('legacy contract pairs retain three distinct trials and affect risk feedback', () => {
  const records = WS.Chapters.CH1_PAIRS.map((p,i) => ({level:1,value:i?'wide':'narrow',trialId:p.trialId,pairIdx:i}));
  records.push({level:1,value:'ch1_done'});
  const events = WS.Adapter.toEvents(records);
  assert.equal(events.length,3);
  assert.equal(WS.Chapters.riskPairs(events).wideCount,2);
  assert.equal(WS.Chapters.riskPairs(events).n,3);
  assert.equal(WS.Summary.build(events,{}).unsupported.length,0);
});
test('actual contract callback records a recognized pair', () => {
  g._ch1PairIdx=0; g._ch1Choices=[]; g.districts=[];
  g._showConsequence=()=>{}; g._updateStats=()=>{};
  g._ch1ShowPair(); g.choose('narrow');
  assert.equal(ctx.engine.decisions[0].scenarioId,'ch1:pair');
  assert.equal(summary().unsupported.length,0);
  assert.equal(WS.Chapters.riskPairs(WS.Adapter.toEvents(ctx.engine.decisions)).n,1);
});
test('forecast UI shows the real question and records canonical unresolved evidence', () => {
  g._collectForecast('f1',()=>{}); g.choose(0.5);
  assert.match(g.question,/Technology/);
  assert.match(g.question,/next year/);
  assert.equal(g._forecastEvents[0],ctx.engine.decisions.at(-1));
  assert.equal(summary().unsupported.length,0);
  assert.equal(summary().forecast.available,false);
});
test('the next actual economy year resolves the forecast in the final summary', () => {
  const ec = g._econ('level2','wait');
  assert.equal(ctx.engine.decisions.at(-1).outcome,ec.returns.technology>0?1:0);
  assert.equal(summary().forecast.n,1);
  assert.equal(summary().forecast.brier,0.25);
  const firstOutcome=g._forecastEvents[0].outcome;
  g._econ('level3End');
  assert.equal(g._forecastEvents[0].outcome,firstOutcome);
  assert.equal(g._forecastEvents[0].resolvedBy,'level2');
});
test('four forecasts resolve once each across subsequent simulated years', () => {
  for (const [id,fn] of [['f2','level5'],['f3','level7'],['f4','level8']]) {
    g._collectForecast(id,()=>{}); g.choose(0.5); g._econ(fn,'hold');
  }
  assert.equal(summary().forecast.n,4);
  assert.equal(summary().forecast.brier,0.25);
  assert.equal(summary().unsupported.length,0);
});
test('legacy unresolved forecasts are retained without invented outcomes', () => {
  const events=WS.Adapter.toEvents([{level:'forecast',value:0.5,forecastId:'f1'}]);
  assert.equal(events[0].p,0.5);
  assert.equal(WS.Summary.build(events,{}).unsupported.length,0);
  assert.equal(WS.Evidence.brier(events).available,false);
});
test('unknown actions remain visible as unsupported', () => {
  assert.equal(WS.Summary.build(WS.Adapter.toEvents([{level:1,value:'invented'}]),{}).unsupported.length,1);
});
test('real Play Again callback clears decisions, answers and timer and navigates', () => {
  ctx.Tutorial={skipAll:true};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/scenes/ProfileScene.js'),'utf8')+'\nthis.ProfileScene=ProfileScene;',ctx);
  const p=new ctx.ProfileScene(); let restart;
  const visual=new Proxy({}, {get:(_,key)=>key==='on'?((event,cb)=>{if(event==='pointerup')restart=cb;return visual;}):(()=>visual)});
  p.add={graphics:()=>visual,text:()=>visual,rectangle:()=>visual};
  p._add=x=>x; p.s=x=>x; p.y=0;p.W=1000;p.scene={start:name=>{p.destination=name;}};
  ctx.engine.recordStartingAnswer(0,'patient');ctx.engine.startTimer();
  p._playAgain(); restart();
  assert.equal(ctx.engine.decisions.length,0);assert.equal(ctx.engine.startingAnswers.length,0);
  assert.equal(ctx.engine.levelStartTime,null);assert.equal(ctx.Tutorial.skipAll,false);
  assert.equal(p.destination,'GameScene');assert.equal(summary().forecast.available,false);
});
console.log(checks+' integration checks passed');
