const C = require('../js/core/Chapters.js').Chapters;
const E = require('../js/core/Evidence.js').Evidence;
const S = require('../js/core/Summary.js').Summary;
const Sim = require('../js/core/Sim.js').Sim;
let pass=0, fail=0;
function t(n,f){ try{f();console.log('  PASS  '+n);pass++;}catch(e){console.log('  FAIL  '+n+'\n        '+e.message);fail++;} }
function eq(a,b,m){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' expected '+JSON.stringify(b)+' got '+JSON.stringify(a)); }
function near(a,b,tol,m){ if(Math.abs(a-b)>(tol||1e-9)) throw new Error((m||'')+' expected ~'+b+' got '+a); }
function ok(c,m){ if(!c) throw new Error(m||'falsy'); }
const pair=(id,a)=>({scenarioId:'ch1:pair',trialId:id,action:a,phase:'baseline'});

console.log('\n── Chapter 1: contract ladder is valid ──');
t('probabilities in every option sum to 1', ()=>{
  C.CH1_PAIRS.forEach(p=>[p.narrow,p.wide].forEach(o=>
    near(o.outcomes.reduce((s,x)=>s+x[0],0),1,1e-12,p.trialId)));
});
t('expected values are exactly as declared', ()=>{
  near(C.expected(C.CH1_PAIRS[0].narrow),102,1e-9);
  near(C.expected(C.CH1_PAIRS[0].wide),71,1e-9);
  near(C.expected(C.CH1_PAIRS[1].wide),105,1e-9);
  near(C.expected(C.CH1_PAIRS[2].wide),139,1e-9);
});
t('no option dominates the other in any pair', ()=>{
  C.CH1_PAIRS.forEach(p=>{
    ok(!C.dominates(p.wide,p.narrow), p.trialId+': wide dominates');
    ok(!C.dominates(p.narrow,p.wide), p.trialId+': narrow dominates');
  });
});
t('wide contract always has the wider spread', ()=>{
  C.CH1_PAIRS.forEach(p=>ok(C.spread(p.wide)>C.spread(p.narrow),p.trialId));
});
t('wide contract becomes more attractive down the ladder', ()=>{
  const ev=C.CH1_PAIRS.map(p=>C.expected(p.wide));
  ok(ev[0]<ev[1] && ev[1]<ev[2]);
});
t('a risk-neutral chooser would switch at the middle row', ()=>{
  const choose=C.CH1_PAIRS.map(p=>C.expected(p.wide)>C.expected(p.narrow)?'wide':'narrow');
  eq(choose,['narrow','wide','wide']);
});

console.log('\n── Chapter 1: switch point is reported, not fitted ──');
t('single switch is monotonic with its threshold', ()=>{
  const r=C.riskPairs([pair('pair1','narrow'),pair('pair2','wide'),pair('pair3','wide')]);
  eq([r.monotonic,r.switchAt,r.wideCount],[true,0.5,2]);
});
t('switching back is reported as non-monotonic, with no threshold', ()=>{
  const r=C.riskPairs([pair('pair1','wide'),pair('pair2','narrow'),pair('pair3','wide')]);
  eq([r.monotonic,r.switchAt],[false,null]);
});
t('never choosing wide has no switch point', ()=>{
  const r=C.riskPairs(['pair1','pair2','pair3'].map(i=>pair(i,'narrow')));
  eq([r.monotonic,r.switchAt,r.wideCount],[true,null,0]);
});
t('ladder choices and the district choice read as one repeated pattern', ()=>{
  const evs=[{scenarioId:'ch1:contract',trialId:'L1',action:'aggressive',phase:'baseline'}]
    .concat(['pair1','pair2','pair3'].map(i=>pair(i,'wide')));
  eq(E.coverage(E.observations(evs).observations,E.DIM.RISK).label,'repeated');
});
t('no risk coefficient is ever produced', ()=>{
  const r=C.riskPairs([pair('pair1','narrow'),pair('pair2','wide'),pair('pair3','wide')]);
  ok(!('coefficient' in r) && !('r' in r) && !('crra' in r));
});

console.log('\n── Chapter 9: matched trials isolate purchase price ──');
const trials=C.ch9Trials('seed-9');
t('four trials: three matched, one prospects', ()=>{
  eq(trials.filter(x=>x.type==='matched').length,3);
  eq(trials.filter(x=>x.type==='prospects').length,1);
});
t('in matched trials only the purchase price differs', ()=>{
  trials.filter(x=>x.type==='matched').forEach(tr=>{
    const [a,b]=tr.projects;
    eq([a.current,a.forward,a.fee],[b.current,b.forward,b.fee],tr.trialId);
    ok(a.purchase!==b.purchase);
    ok((a.purchase<a.current)!==(b.purchase<b.current),'one gain, one loss');
  });
});
t('the resource need can be met by selling either holding', ()=>{
  trials.forEach(tr=>tr.projects.forEach(p=>ok(p.current>=tr.need,tr.trialId)));
});
t('in the prospects trial, history points against prospects', ()=>{
  const tr=trials.filter(x=>x.type==='prospects')[0];
  const weak=tr.projects.reduce((a,b)=>a.forward<b.forward?a:b);
  ok(weak.purchase<weak.current,'weaker outlook stands at a gain');
});
t('same seed gives identical trials; different seeds rotate names or order', ()=>{
  eq(C.ch9Trials('x'),C.ch9Trials('x'));
  const sig=s=>JSON.stringify(C.ch9Trials(s).map(tr=>tr.trialId+tr.projects.map(p=>p.name).join()));
  const sigs=new Set(['a','b','c','d','e'].map(sig));
  ok(sigs.size>1,'rotation must vary with seed');
});
t('selling the gain in a matched trial resolves to sell_winner', ()=>{
  const tr=trials.filter(x=>x.type==='matched')[0];
  const g=tr.projects.filter(p=>p.purchase<p.current)[0];
  eq(C.resolveCh9(tr,g.id).action,'sell_winner');
});
t('the prospects trial is scored under its own scenario', ()=>{
  const tr=trials.filter(x=>x.type==='prospects')[0];
  const e=C.resolveCh9(tr,tr.projects[0].id);
  eq(e.scenarioId,'ch9:prospects');
  ok(['sell_weaker','sell_stronger'].indexOf(e.action)!==-1);
});
t('gain/loss counts exclude the prospects trial', ()=>{
  const evs=trials.map(tr=>C.resolveCh9(tr,tr.projects[0].id));
  const d=C.disposition(evs);
  eq(d.n,3); eq(d.soldGain+d.soldLoss,3);
});
t('unknown project id is rejected, not guessed', ()=>{
  let threw=false; try{ C.resolveCh9(trials[0],'nope'); }catch(e){ threw=true; }
  ok(threw);
});

console.log('\n── Chapter 10: forecasts ──');
t('model probability of a rise follows the declared model', ()=>{
  const d=Sim.DISTRICTS.housing;
  ok(C.modelPUp('housing')>0.5 && C.modelPUp('housing')<1);
  ok(C.modelPUp('housing')>C.modelPUp('technology'),'lower-variance district rises more reliably');
});
t('forecasts resolve against the seeded simulation', ()=>{
  const s=Sim.createSession('fc'); s.invest('housing',600);
  const r=s.advanceYear();
  const e=C.forecastEvent(C.FORECASTS[1],0.8,r);
  eq(e.outcome, r.housing>0?1:0);
});
t('forecast probability is clamped and snapped to 10% steps', ()=>{
  eq(C.forecastEvent(C.FORECASTS[0],1.7,{technology:1}).p,1);
  eq(C.forecastEvent(C.FORECASTS[0],0.64,{technology:1}).p,0.6);
});
t('unresolved forecasts are excluded from accuracy', ()=>{
  const e=C.forecastEvent(C.FORECASTS[0],0.5,null);
  eq(E.brier([e]).available,false);
});
t('distance from model is reported separately from accuracy', ()=>{
  const evs=C.FORECASTS.map(f=>C.forecastEvent(f,0.5,{[f.district]:0.1}));
  ok(C.modelGap(evs).available); ok(E.brier(evs).available);
  ok(C.modelGap(evs).meanGap!==E.brier(evs).brier);
});
t('forecast text exists in both languages', ()=>{
  C.FORECASTS.forEach(f=>{ ok(/How likely/.test(C.forecastText(f,'en'))); ok(/Wie wahrscheinlich/.test(C.forecastText(f,'de'))); });
});

console.log('\n── Practice is chosen from observed evidence and never scored ──');
t('a concentrated allocation leads to allocation practice', ()=>{
  const p=C.practiceTrial({concentration:{available:true,largestShare:0.5},patterns:[]});
  eq([p.kind,p.phase],['allocation','practice']);
});
t('transfer reports change without claiming improvement', ()=>{
  const p=C.practiceTrial({concentration:{available:true,largestShare:0.5},patterns:[]});
  const tr=C.transfer(p,['housing','housing','transport','transport','energy','technology']
    .map(d=>({scenarioId:'ch3:allocate',districtId:d,phase:'practice'})));
  eq(tr.changed,true); ok(tr.after<tr.before);
  ok(!('improved' in tr) && !('better' in tr),'must not claim improvement');
});
t('practice events never enter baseline coverage', ()=>{
  const evs=[pair('pair1','wide'),Object.assign(pair('pair2','wide'),{phase:'practice'}),
             Object.assign(pair('pair3','wide'),{phase:'practice'})];
  eq(E.coverage(E.observations(evs).observations,E.DIM.RISK).n,1);
  eq(C.riskPairs(evs).n,1);
});

console.log('\n── Full ten-chapter session, both languages ──');
function fullSession(){
  const s=Sim.createSession('full'); const ev=[]; let yr;
  ev.push(pair('pair1','narrow'),pair('pair2','wide'),pair('pair3','wide'));
  ev.push({scenarioId:'ch1:contract',trialId:'L1',action:'aggressive',phase:'baseline'});
  yr=s.advanceYear(); ev.push(C.forecastEvent(C.FORECASTS[0],0.7,yr));
  ev.push({scenarioId:'ch2:setback',trialId:'L2',action:'research',phase:'baseline'},
          {scenarioId:'ch2:setback',trialId:'L2',action:'continue',phase:'baseline',afterEvidence:true});
  ['technology','technology','technology','housing','energy','transport']
    .forEach((d,i)=>ev.push({scenarioId:'ch3:allocate',trialId:'cube'+i,action:'allocate',districtId:d,phase:'baseline'}));
  yr=s.advanceYear(); ev.push(C.forecastEvent(C.FORECASTS[1],0.6,yr));
  ev.push({scenarioId:'ch4:timing',trialId:'L4',action:'university',phase:'baseline'});
  ev.push({scenarioId:'ch5:boom',trialId:'L5',action:'hold',phase:'baseline'});
  yr=s.advanceYear(); ev.push(C.forecastEvent(C.FORECASTS[2],0.5,yr));
  ev.push({scenarioId:'ch6:delegation',trialId:'L6',action:'decline',phase:'baseline'});
  ev.push({scenarioId:'ch7:news',trialId:'L7',action:'hold',phase:'baseline'});
  yr=s.advanceYear(); ev.push(C.forecastEvent(C.FORECASTS[3],0.4,yr));
  ev.push({scenarioId:'ch8:storm',trialId:'L8',action:'hold',phase:'baseline'});
  C.ch9Trials('full').forEach(tr=>{
    const gain=tr.projects.filter(p=>p.purchase<p.current)[0]||tr.projects[0];
    ev.push(C.resolveCh9(tr,gain.id));
  });
  return ev;
}
const evs=fullSession();
const en=S.build(evs,{q0:'safe',q1:'patient'},{lang:'en'});
const de=S.build(evs,{q0:'safe',q1:'patient'},{lang:'de'});
t('no action in a full session is unsupported', ()=>eq(en.unsupported,[]));
t('both languages produce the same number of statements', ()=>eq(de.did.length,en.did.length));
t('both languages agree on every coverage label', ()=>{
  eq(de.patterns.map(p=>p.coverage),en.patterns.map(p=>p.coverage));
});
t('every number stated in English is stated in German', ()=>{
  const nums=a=>a.map(d=>(d.text.replace(/0,25/g,'0.25').match(/\d+(\.\d+)?/g)||[]).join(',')).join('|');
  eq(nums(de.did),nums(en.did));
});
t('no English leaks into the German summary', ()=>{
  // Only displayed strings — internal ids like 'ch10:forecast' are never shown
  const shown=[].concat(de.did.map(d=>d.text), de.did.map(d=>d.constraint||''),
    de.patterns.map(p=>p.label+' '+p.text), de.readings.map(r=>r.claim+' '+r.alternative),
    de.comparison.map(c=>c.label+' '+c.note), de.nextSteps).join(' | ');
  const all=shown;
  ['You ','reviews where','forecast','contract pairs','Based on','percentage points'].forEach(w=>
    ok(all.indexOf(w)===-1,'leaked: '+w));
});
t('ladder, review and forecast facts all appear', ()=>{
  const txt=en.did.map(d=>d.text).join(' ');
  ok(/contract pairs/.test(txt)); ok(/identical future prospects/.test(txt));
  ok(/Brier/.test(txt)); ok(/model/.test(txt));
});
t('selling the gain in all three matched reviews is stated as a count, not a bias', ()=>{
  const lines=en.did.filter(d=>d.scenario==='ch9:review');
  eq(lines.length,1,'matched reviews summarised in exactly one line');
  const line=lines[0].text;
  ok(/3 times/.test(line) && /0 times/.test(line));
  ok(!/bias|disposition effect|mistake|error/i.test(line));
});
t('a full session can still correctly produce no overall label', ()=>{
  const l=S.optionalLabel(en);
  ok(typeof l.available==='boolean');
  if(!l.available) ok(l.reason.length>10);
});

console.log('\n' + (fail===0?'ALL PASS':'FAILURES') + '  —  ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail===0?0:1);
