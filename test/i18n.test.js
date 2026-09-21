const E = require('../js/core/Evidence.js').Evidence;
const S = require('../js/core/Summary.js').Summary;
const A = require('../js/core/Adapter.js').Adapter;
let pass=0, fail=0;
function t(n,f){ try{f();console.log('  PASS  '+n);pass++;}catch(e){console.log('  FAIL  '+n+'\n        '+e.message);fail++;} }
function eq(a,b,m){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' expected '+JSON.stringify(b)+' got '+JSON.stringify(a)); }
function ok(c,m){ if(!c) throw new Error(m||'falsy'); }

function keysDeep(o, p){
  p=p||''; let out=[];
  Object.keys(o).sort().forEach(k=>{
    const v=o[k], path=p?p+'.'+k:k;
    if(v && typeof v==='object' && !Array.isArray(v)) out=out.concat(keysDeep(v,path));
    else out.push(path+':'+typeof v);
  });
  return out;
}

const session = [
  {level:1,value:'aggressive',districtId:'technology'},{level:2,value:'invest_more'},
  ...['housing','transport','technology','energy','technology','technology'].map(d=>({level:3,value:'allocate',districtId:d})),
  {level:4,value:'university'},{level:5,value:'hold'},
  {level:6,value:'research'},{level:6,value:'accept',afterResearch:true},
  {level:7,value:'invest_more'},{level:8,value:'rebalance'}
];

console.log('\n── Every action is described in both languages ──');
t('every action has a German note', ()=>{
  Object.keys(E.ACTIONS).forEach(sc=>Object.keys(E.ACTIONS[sc]).forEach(a=>{
    const s=E.ACTIONS[sc][a];
    ok(s.noteDE && s.noteDE.length>3, sc+':'+a+' missing noteDE');
  }));
});
t('every constraint reason has a German version', ()=>{
  Object.keys(E.ACTIONS).forEach(sc=>Object.keys(E.ACTIONS[sc]).forEach(a=>{
    const s=E.ACTIONS[sc][a];
    if(s.why) ok(s.whyDE, sc+':'+a+' missing whyDE');
  }));
});

console.log('\n── Templates are structurally identical ──');
t('EN and DE template trees have the same keys and types', ()=>{
  eq(keysDeep(S.T.de), keysDeep(S.T.en));
});

console.log('\n── Same session, same substance in both languages ──');
const en=S.build(A.toEvents(session),A.toStated(['safe','moderate','wait']),{lang:'en'});
const de=S.build(A.toEvents(session),A.toStated(['safe','moderate','wait']),{lang:'de'});
t('same number of factual statements', ()=>eq(de.did.length,en.did.length));
t('identical coverage label for every dimension', ()=>{
  eq(de.patterns.map(p=>p.dimension+'='+p.coverage), en.patterns.map(p=>p.dimension+'='+p.coverage));
});
t('identical interpretations by kind', ()=>{
  eq(de.readings.map(r=>r.dimension+'/'+r.kind), en.readings.map(r=>r.dimension+'/'+r.kind));
});
t('identical stated-vs-observed verdicts', ()=>{
  eq(de.comparison.map(c=>c.key+'='+c.agrees), en.comparison.map(c=>c.key+'='+c.agrees));
});
t('identical number of next steps', ()=>eq(de.nextSteps.length,en.nextSteps.length));
t('identical overall-label availability', ()=>{
  eq(S.optionalLabel(de).available, S.optionalLabel(en).available);
});

console.log('\n── No language leakage ──');
t('German factual statements are in German', ()=>{
  de.did.forEach(d=>ok(/^Du /.test(d.text),'not German: '+d.text));
});
t('English factual statements are in English', ()=>{
  en.did.forEach(d=>ok(/^You /.test(d.text),'not English: '+d.text));
});
t('no English words leak into German output', ()=>{
  const all=JSON.stringify([de.did,de.patterns,de.readings,de.comparison,de.nextSteps,de.disclaimer]);
  ['You ','Based on','Not enough','occasions','districts;','reports that'].forEach(w=>{
    ok(all.indexOf(w)===-1,'English leaked into German: "'+w+'"');
  });
});
t('German numbers match English numbers', ()=>{
  const nums=s=>(s.match(/\d+/g)||[]).join(',');
  eq(nums(de.did.map(d=>d.text).join(' ')), nums(en.did.map(d=>d.text).join(' ')));
});

console.log('\n' + (fail===0?'ALL PASS':'FAILURES') + '  —  ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail===0?0:1);
