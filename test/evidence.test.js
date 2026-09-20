const E = require('../js/core/Evidence.js').Evidence;

let pass=0, fail=0;
function t(name, fn){
  try { fn(); console.log('  PASS  ' + name); pass++; }
  catch(err){ console.log('  FAIL  ' + name + '\n        ' + err.message); fail++; }
}
function eq(a,b,m){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' expected '+JSON.stringify(b)+' got '+JSON.stringify(a)); }
function ok(c,m){ if(!c) throw new Error(m||'expected truthy'); }

const ev=(o)=>Object.assign({eventId:Math.random().toString(36).slice(2),phase:'baseline'},o);

console.log('\n── Unknown actions never become neutral evidence ──');
t('unrecognised action is flagged, not scored', ()=>{
  const r=E.observations([ev({scenarioId:'ch7:news',trialId:'t1',action:'teleport'})]);
  eq(r.observations.length,0,'no observation');
  eq(r.unsupported.length,1,'one unsupported');
});
t('every ch7 option incl. invest_more is recognised', ()=>{
  ['sell','reduce','hold','invest_more'].forEach(a=>{
    ok(E.lookup('ch7:news',a), a+' must be declared');
  });
});
t('every offered action across all chapters is declared', ()=>{
  Object.keys(E.ACTIONS).forEach(sc=>{
    Object.keys(E.ACTIONS[sc]).forEach(a=>{
      const s=E.lookup(sc,a);
      ok(s && s.dim && s.note, sc+':'+a+' needs dim and note');
    });
  });
});

console.log('\n── Absent data is insufficient, never average ──');
t('no events -> insufficient, n=0', ()=>{
  const c=E.coverage([], E.DIM.RISK);
  eq(c.label,'insufficient'); eq(c.n,0);
});
t('one event -> single, not a pattern', ()=>{
  const r=E.observations([ev({scenarioId:'ch1:contract',trialId:'a',action:'aggressive'})]);
  eq(E.coverage(r.observations,E.DIM.RISK).label,'single');
});
t('three same-level -> repeated', ()=>{
  const r=E.observations(['a','b','c'].map(id=>ev({scenarioId:'ch1:contract',trialId:id,action:'safe'})));
  const c=E.coverage(r.observations,E.DIM.RISK);
  eq(c.label,'repeated'); eq(c.n,3);
});
t('conflicting levels -> mixed', ()=>{
  const r=E.observations([
    ev({scenarioId:'ch1:contract',trialId:'a',action:'safe'}),
    ev({scenarioId:'ch1:contract',trialId:'b',action:'aggressive'})
  ]);
  eq(E.coverage(r.observations,E.DIM.RISK).label,'mixed');
});

console.log('\n── Duplicate clicks are not extra evidence ──');
t('same trial clicked twice counts once', ()=>{
  const r=E.observations([
    ev({scenarioId:'ch7:news',trialId:'t1',action:'hold'}),
    ev({scenarioId:'ch7:news',trialId:'t1',action:'hold'})
  ]);
  eq(r.observations.length,1);
});
t('opening the same report twice counts as one trial', ()=>{
  const u=E.evidenceUse([
    ev({scenarioId:'ch6:delegation',trialId:'t1',action:'research'}),
    ev({scenarioId:'ch6:delegation',trialId:'t1',action:'research'})
  ]);
  eq(u.reportsOpened,1); eq(u.rawOpens,2);
});

console.log('\n── Research then decide preserves the final action ──');
t('research + accept keeps accept as the decision', ()=>{
  const r=E.observations([
    ev({scenarioId:'ch6:delegation',trialId:'t1',action:'research'}),
    ev({scenarioId:'ch6:delegation',trialId:'t1',action:'accept',afterEvidence:true})
  ]);
  eq(r.observations.length,1);
  eq(r.observations[0].level,'accepted_offer');
});
t('opening a report alone yields no decision observation', ()=>{
  const r=E.observations([ev({scenarioId:'ch6:delegation',trialId:'t1',action:'research'})]);
  eq(r.observations.length,0);
});
t('reports opened does not claim learning', ()=>{
  const u=E.evidenceUse([ev({scenarioId:'ch6:delegation',trialId:'t1',action:'research'})]);
  ok(!/learn|understood|information-seeking/i.test(u.note), 'note must not claim learning: '+u.note);
});
t('revision after informative vs uninformative evidence is separated', ()=>{
  const u=E.evidenceUse([
    ev({action:'forecast',scenarioId:'ch7:news',trialId:'a',revisedAfterEvidence:true,evidenceInformative:true}),
    ev({action:'forecast',scenarioId:'ch7:news',trialId:'b',revisedAfterEvidence:true,evidenceInformative:false})
  ]);
  eq(u.revisedAfterInformative,1); eq(u.revisedAfterUninformative,1);
});

console.log('\n── Concentration: real shares, feasible normalisation ──');
t('3/1/1/1 reports 50% largest share, not "diversified"', ()=>{
  const evs=[['housing'],['transport'],['technology'],['energy'],['technology'],['technology']]
    .map((d,i)=>ev({scenarioId:'ch3:allocate',trialId:'c'+i,action:'allocate',districtId:d[0]}));
  const c=E.concentration(evs,6,4);
  eq(c.largestShare,0.5);
  ok(/largest single share 50%/.test(c.note), c.note);
});
t('2/2/1/1 is the evenest feasible with 6 units and scores 100', ()=>{
  const ds=['housing','housing','transport','transport','technology','energy'];
  const evs=ds.map((d,i)=>ev({scenarioId:'ch3:allocate',trialId:'c'+i,action:'allocate',districtId:d}));
  const c=E.concentration(evs,6,4);
  eq(c.evenestFeasible,[2,2,1,1]);
  eq(c.spreadVsFeasible,100);
});
t('all six in one district scores 0', ()=>{
  const evs=[0,1,2,3,4,5].map(i=>ev({scenarioId:'ch3:allocate',trialId:'c'+i,action:'allocate',districtId:'technology'}));
  eq(E.concentration(evs,6,4).spreadVsFeasible,0);
});
t('no allocation -> unavailable, not a score', ()=>{
  eq(E.concentration([],6,4).available,false);
});

console.log('\n── Constraint actions excluded from preference patterns ──');
t('funding a due repair is not a timing preference', ()=>{
  const r=E.observations([ev({scenarioId:'ch4:timing',trialId:'t2',action:'repair'})]);
  ok(r.observations[0].excluded,'must be excluded');
  eq(E.coverage(r.observations,E.DIM.TIMING).label,'insufficient');
});
t('meeting a reserve is not a downturn reaction', ()=>{
  const r=E.observations([ev({scenarioId:'ch8:storm',trialId:'s1',action:'meet_reserve'})]);
  ok(r.observations[0].excluded);
});

console.log('\n── Baseline and post-feedback practice stay separate ──');
t('practice events excluded from baseline coverage', ()=>{
  const r=E.observations([
    ev({scenarioId:'ch1:contract',trialId:'a',action:'safe'}),
    Object.assign(ev({scenarioId:'ch1:contract',trialId:'p1',action:'safe'}),{phase:'practice'}),
    Object.assign(ev({scenarioId:'ch1:contract',trialId:'p2',action:'safe'}),{phase:'practice'})
  ]);
  eq(E.coverage(r.observations,E.DIM.RISK).n,1,'only baseline counts');
});

console.log('\n── Brier ──');
t('p=1,y=1 -> 0', ()=>{ eq(E.brier([ev({action:'forecast',p:1,outcome:1})]).brier,0); });
t('p=0,y=1 -> 1', ()=>{ eq(E.brier([ev({action:'forecast',p:0,outcome:1})]).brier,1); });
t('p=0.5 -> 0.25', ()=>{ eq(E.brier([ev({action:'forecast',p:0.5,outcome:1})]).brier,0.25); });
t('unresolved forecasts excluded', ()=>{
  eq(E.brier([ev({action:'forecast',p:0.7})]).available,false);
});
t('is labelled accuracy, not calibration', ()=>{
  const b=E.brier([ev({action:'forecast',p:1,outcome:1})]);
  eq(b.label,'forecast accuracy');
  ok(!/calibrat/i.test(b.label));
});

console.log('\n── Regression: the concentrated "Strategist" ──');
t('all-in + no research cannot yield diversified or information-seeking', ()=>{
  const evs=[0,1,2,3,4,5].map(i=>ev({scenarioId:'ch3:allocate',trialId:'c'+i,action:'allocate',districtId:'technology'}))
    .concat([
      ev({scenarioId:'ch4:timing',trialId:'t1',action:'university'}),
      ev({scenarioId:'ch5:boom',trialId:'b1',action:'hold'}),
      ev({scenarioId:'ch6:delegation',trialId:'d1',action:'decline'}),
      ev({scenarioId:'ch7:news',trialId:'n1',action:'hold'}),
      ev({scenarioId:'ch8:storm',trialId:'s1',action:'hold'})
    ]);
  const c=E.concentration(evs,6,4);
  eq(c.spreadVsFeasible,0,'fully concentrated');
  eq(c.districtsUsed,1);
  const u=E.evidenceUse(evs);
  eq(u.reportsOpened,0,'no research occurred');
  const r=E.observations(evs);
  [E.DIM.TIMING,E.DIM.MOMENTUM,E.DIM.SOCIAL,E.DIM.DOWNTURN].forEach(d=>{
    eq(E.coverage(r.observations,d).label,'single',d+' must be single');
  });
  eq(E.coverage(r.observations,E.DIM.RISK).label,'insufficient','ch1 never played');
});

console.log('\n── Stated vs observed shown separately ──');
t('disagreement is reported, not blended into one number', ()=>{
  const r=E.observations([ev({scenarioId:'ch1:contract',trialId:'a',action:'aggressive'})]);
  const p=E.statedVsObserved({q0:'safe'}, r.observations);
  eq(p.length,1);
  eq(p[0].stated,'safe');
  eq(p[0].observed,['higher_variance']);
  eq(p[0].agrees,false);
  ok(typeof p[0] === 'object' && p[0].blended === undefined,'no blended score');
});

console.log('\n' + (fail===0?'ALL PASS':'FAILURES') + '  —  ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail===0?0:1);
