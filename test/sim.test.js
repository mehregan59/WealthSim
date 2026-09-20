const Sim = require('../js/core/Sim.js').Sim;
let pass=0, fail=0;
function t(n,f){ try{f();console.log('  PASS  '+n);pass++;}catch(e){console.log('  FAIL  '+n+'\n        '+e.message);fail++;} }
function eq(a,b,m){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' expected '+JSON.stringify(b)+' got '+JSON.stringify(a)); }
function near(a,b,tol,m){ if(Math.abs(a-b)>(tol||1e-9)) throw new Error((m||'')+' expected ~'+b+' got '+a); }
function ok(c,m){ if(!c) throw new Error(m||'falsy'); }

console.log('\n── Determinism ──');
t('same seed produces an identical session', ()=>{
  const run=()=>{ const s=Sim.createSession('seed-A');
    s.invest('technology',300); s.invest('housing',300);
    s.advanceYear(); s.advanceYear(); s.applyShock(1);
    return s.snapshot(); };
  eq(run(), run());
});
t('different seeds diverge', ()=>{
  const run=(sd)=>{ const s=Sim.createSession(sd);
    s.invest('technology',600); s.advanceYear(); return s.total(); };
  ok(Math.abs(run('A')-run('B'))>1e-9,'seeds must differ');
});
t('replaying the ledger reproduces the same totals', ()=>{
  const s=Sim.createSession('replay');
  s.invest('energy',600); s.advanceYear(); s.applyShock(1);
  const t1=s.state.ledger.map(l=>l.totalAfter.toFixed(6));
  const s2=Sim.createSession('replay');
  s2.invest('energy',600); s2.advanceYear(); s2.applyShock(1);
  eq(t1, s2.state.ledger.map(l=>l.totalAfter.toFixed(6)));
});

console.log('\n── Money is conserved on transfers ──');
t('investing moves value, never creates it', ()=>{
  const s=Sim.createSession('x'); const before=s.total();
  s.invest('housing',250); near(s.total(),before,1e-9);
});
t('cannot invest more cash than held', ()=>{
  const s=Sim.createSession('x');
  const moved=s.invest('housing',99999);
  eq(moved,600); eq(s.state.cash,0);
});
t('divesting returns value to cash', ()=>{
  const s=Sim.createSession('x');
  s.invest('energy',400); const before=s.total();
  s.divest('energy'); near(s.total(),before,1e-9); eq(s.state.holdings.energy,0);
});

console.log('\n── Shock follows exposure, not the storyline ──');
t('all-in technology loses far more than an even split', ()=>{
  const a=Sim.createSession('s'); a.invest('technology',600);
  const b=Sim.createSession('s');
  b.districtIds.forEach(id=>b.invest(id,150));
  const la=a.applyShock(1).totalLoss, lb=b.applyShock(1).totalLoss;
  ok(la>lb*1.5, 'concentrated loss '+la.toFixed(1)+' should far exceed spread '+lb.toFixed(1));
});
t('shock loss equals declared drawdown times holding', ()=>{
  const s=Sim.createSession('s'); s.invest('technology',600);
  const r=s.applyShock(1);
  near(r.losses.technology, 600*Sim.DISTRICTS.technology.drawdown, 1e-9);
});
t('holding nothing means losing nothing', ()=>{
  const s=Sim.createSession('s');
  eq(s.applyShock(1).totalLoss,0);
});
t('shock never reads the player decision log', ()=>{
  const src=require('fs').readFileSync(__dirname+'/../js/core/Sim.js','utf8');
  const fn=src.slice(src.indexOf('function applyShock'), src.indexOf('function shockCounterfactual'));
  ok(!/decision|choice|action|player/i.test(fn),'applyShock must not inspect decisions');
});

console.log('\n── Counterfactual is honest ──');
t('even split counterfactual beats all-in tech under the same shock', ()=>{
  const s=Sim.createSession('c');
  const allIn=s.shockCounterfactual({technology:600},1);
  const even=s.shockCounterfactual(s.evenSplit(600),1);
  ok(even.loss < allIn.loss);
  near(allIn.lossPct, Sim.DISTRICTS.technology.drawdown, 1e-9);
});
t('counterfactual does not mutate live state', ()=>{
  const s=Sim.createSession('c'); s.invest('housing',600);
  const before=s.snapshot();
  s.shockCounterfactual({technology:600},1);
  eq(s.snapshot(), before);
});

console.log('\n── Model is declared and auditable ──');
t('every district declares mean, sd and drawdown', ()=>{
  Object.keys(Sim.DISTRICTS).forEach(id=>{
    const d=Sim.DISTRICTS[id];
    ok(typeof d.mean==='number' && typeof d.sd==='number' && typeof d.drawdown==='number', id);
  });
});
t('higher-variance districts carry deeper drawdowns', ()=>{
  const t2=Sim.DISTRICTS.technology, h=Sim.DISTRICTS.housing;
  ok(t2.sd>h.sd && t2.drawdown>h.drawdown,'risk/return must be coherent');
});
t('ledger records a cause for every value change', ()=>{
  const s=Sim.createSession('l');
  s.invest('housing',600); s.advanceYear(); s.applyShock(1);
  eq(s.state.ledger.map(l=>l.kind), ['invest','year','shock']);
  s.state.ledger.forEach(l=>ok(l.detail && typeof l.totalBefore==='number'));
});

console.log('\n── Long-run behaviour is plausible, not rigged ──');
t('over many seeds technology is higher mean and higher spread', ()=>{
  const res={technology:[],housing:[]};
  for(let i=0;i<400;i++){
    ['technology','housing'].forEach(id=>{
      const s=Sim.createSession('mc'+i);
      s.invest(id,600); s.advanceYear();
      res[id].push(s.total());
    });
  }
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(v=>(v-m)**2)));};
  ok(mean(res.technology)>mean(res.housing),'tech mean higher');
  ok(sd(res.technology)>sd(res.housing),'tech spread wider');
});
t('a losing year is possible for the high-variance district', ()=>{
  let losses=0;
  for(let i=0;i<300;i++){
    const s=Sim.createSession('neg'+i);
    s.invest('technology',600); s.advanceYear();
    if(s.total()<600) losses++;
  }
  ok(losses>20,'expected meaningful downside frequency, saw '+losses);
});

console.log('\n' + (fail===0?'ALL PASS':'FAILURES') + '  —  ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail===0?0:1);
