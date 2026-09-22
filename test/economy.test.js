const Sim = require('../js/core/Sim.js').Sim;
const Ec  = require('../js/core/Economy.js').Economy;
let pass=0, fail=0;
function t(n,f){ try{f();console.log('  PASS  '+n);pass++;}catch(e){console.log('  FAIL  '+n+'\n        '+e.message);fail++;} }
function eq(a,b,m){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' expected '+JSON.stringify(b)+' got '+JSON.stringify(a)); }
function near(a,b,tol,m){ if(Math.abs(a-b)>(tol||1e-6)) throw new Error((m||'')+' expected ~'+b+' got '+a); }
function ok(c,m){ if(!c) throw new Error(m||'falsy'); }
const R=Ec.RULES;

// Plays a whole session. `p` is a player: one choice per level.
function play(seed, p){
  const s=Sim.createSession(seed,{startingCash:R.startCash});
  const out={};
  out.L1=Ec.level1(s,p.L1);
  out.L2s=Ec.level2Start(s); out.L2=Ec.level2(s,p.L2);
  Ec.level3Deposit(s); p.L3.forEach(d=>Ec.level3Cube(s,d)); out.L3=Ec.level3End(s);
  out.L4=Ec.level4(s,p.L4);
  out.L5s=Ec.level5Start(s); out.L5=Ec.level5(s,p.L5);
  out.L6=Ec.level6(s,p.L6);
  out.L7=Ec.level7(s,p.L7);
  out.L8s=Ec.level8Storm(s);
  if(p.L4==='university') out.L8u=Ec.level8University(s);
  out.L8=Ec.level8(s,p.L8);
  return {s,out};
}
function checkBooks(s){
  const L=s.state.ledger;
  for(let i=1;i<L.length;i++) near(L[i].totalBefore, L[i-1].totalAfter, 1e-6, 'ledger gap at step '+i+' ('+L[i].kind+')');
  let expect=R.startCash;
  L.forEach(e=>{
    if(e.kind==='deposit') expect+=e.detail.amount;
    if(e.kind==='spend')   expect-=e.detail.amount;
    if(e.kind==='year'||e.kind==='event'||e.kind==='shock') expect+=e.totalAfter-e.totalBefore;
    if(['invest','divest','rebalance'].indexOf(e.kind)!==-1) near(e.totalAfter,e.totalBefore,1e-6,e.kind+' must not change wealth');
  });
  near(s.total(), expect, 1e-6, 'books must reconcile');
  ok(s.state.cash>=-1e-9,'no negative cash');
  s.districtIds.forEach(id=>ok(s.state.holdings[id]>=-1e-9,'no negative holding '+id));
}

const PATHS = {
  concentrated: { L1:'technology', L2:'invest_more', L3:Array(6).fill('technology'), L4:'festival',
                  L5:'all_in', L6:'decline', L7:'invest_more', L8:'hold' },
  cautious:     { L1:'housing', L2:'cancel', L3:['housing','housing','housing','energy','energy','transport'],
                  L4:'festival', L5:'reduce', L6:'accept', L7:'sell', L8:'sell_all' },
  evidence:     { L1:'transport', L2:'continue', L3:['housing','housing','transport','transport','technology','energy'],
                  L4:'university', L5:'hold', L6:'independent', L7:'hold', L8:'rebalance' }
};

console.log('\n── Rules are declared and applied exactly ──');
t('a session starts with the declared cash', ()=>{
  eq(Sim.createSession('x',{startingCash:R.startCash}).total(), R.startCash);
});
t('Level 1 invests the declared amount in the chosen district', ()=>{
  const s=Sim.createSession('x',{startingCash:600}); Ec.level1(s,'energy');
  eq(s.state.holdings.energy,R.L1.invest); eq(s.state.cash,600-R.L1.invest);
});
t('the Level 2 setback only hurts players holding technology', ()=>{
  const a=Sim.createSession('x',{startingCash:600}); Ec.level1(a,'technology');
  const b=Sim.createSession('x',{startingCash:600}); Ec.level1(b,'housing');
  near(Ec.level2Start(a).eventChange, R.L1.invest*R.L2.event.pct);
  eq(Ec.level2Start(b).eventChange, 0);
});
t('six cubes place exactly the Level 3 deposit', ()=>{
  const s=Sim.createSession('x',{startingCash:600}); Ec.level3Deposit(s);
  ['housing','housing','transport','transport','technology','energy'].forEach(d=>Ec.level3Cube(s,d));
  near(s.invested(), R.L3.deposit); near(s.state.cash, 600);
});
t('civic spending reduces wealth by exactly its cost', ()=>{
  const s=Sim.createSession('x',{startingCash:600});
  const b=s.total(); Ec.pay(s,R.L4.universityCost,'uni'); near(s.total(), b-R.L4.universityCost);
});
t('paying more than cash draws proportionally from holdings', ()=>{
  const s=Sim.createSession('x',{startingCash:600}); s.invest('housing',300); s.invest('energy',250);
  Ec.pay(s,200,'infra'); near(s.total(),400);
  near(s.state.holdings.housing/s.state.holdings.energy, 300/250, 1e-9, 'proportions kept');
});

console.log('\n── Choices actually change later exposure ──');
t('"All in" leaves nothing outside technology', ()=>{
  const {s}=play('ai',PATHS.concentrated);
  // before the storm check holdings shape via replay up to L5
  const x=Sim.createSession('ai2',{startingCash:600}); Ec.level1(x,'housing'); Ec.level3Deposit(x);
  ['housing','energy','transport'].forEach(d=>Ec.level3Cube(x,d)); Ec.level5Start(x); Ec.level5(x,'all_in');
  ['housing','transport','energy'].forEach(id=>eq(x.state.holdings[id],0,id));
  eq(x.state.cash,0); ok(x.state.holdings.technology>0);
});
t('"Reduce" halves the technology holding', ()=>{
  const x=Sim.createSession('rd',{startingCash:600}); Ec.level1(x,'technology'); Ec.level5Start(x);
  const before=x.state.holdings.technology; Ec.level5(x,'reduce');
  // after the year, compare using the recorded divest
  const div=x.state.ledger.filter(l=>l.kind==='divest').pop();
  near(div.detail.amount, before/2);
});
t('selling everything before the recovery year means no market exposure', ()=>{
  const x=Sim.createSession('sa',{startingCash:600}); Ec.level1(x,'energy');
  const r=Ec.level8(x,'sell_all'); near(r.change,0,1e-9,'cash does not move with the market');
});

console.log('\n── The storm follows exposure, not the choice ──');
t('storm loss equals each holding times its declared drawdown', ()=>{
  const x=Sim.createSession('st',{startingCash:600}); x.invest('technology',300); x.invest('housing',300);
  const r=Ec.level8Storm(x);
  near(r.loss, 300*Sim.DISTRICTS.technology.drawdown + 300*Sim.DISTRICTS.housing.drawdown);
});
t('the counterfactual uses the same invested amount, evenly split', ()=>{
  const x=Sim.createSession('cf',{startingCash:600}); x.invest('technology',600);
  const r=Ec.level8Storm(x);
  near(r.invested,600); ok(r.evenSplitLoss < r.loss, 'even split loses less than all-tech here');
});
t('concentrated path loses more in the storm than the evidence path', ()=>{
  const a=play('same',PATHS.concentrated).out.L8s, b=play('same',PATHS.evidence).out.L8s;
  ok(a.loss/a.invested > b.loss/b.invested, 'loss share must reflect exposure');
});

console.log('\n── Three full play-throughs reconcile ──');
Object.keys(PATHS).forEach(name=>{
  t(name+': ledger continuous and books reconcile', ()=>{ checkBooks(play('path-'+name,PATHS[name]).s); });
});
t('the same seed and choices always give the same final wealth', ()=>{
  Object.keys(PATHS).forEach(n=>near(play('rep',PATHS[n]).s.total(), play('rep',PATHS[n]).s.total(),1e-9,n));
});
t('outcomes vary across seeds — the model is not rigged to one result', ()=>{
  const finals=new Set(['a','b','c','d','e'].map(sd=>play(sd,PATHS.evidence).s.total().toFixed(2)));
  ok(finals.size>1);
});
t('no path is guaranteed to finish above its start (no promised recovery)', ()=>{
  let belowStart=0;
  for(let i=0;i<200;i++){ const {s}=play('mc'+i,PATHS.concentrated); if(s.total()<R.startCash+R.L3.deposit) belowStart++; }
  ok(belowStart>0, 'some seeds must end below the money put in');
});
t('the university payout arrives only for players who built it', ()=>{
  const d=s=>s.state.ledger.filter(l=>l.kind==='deposit'&&l.detail.cause==='university graduates').length;
  eq(d(play('u',PATHS.evidence).s),1); eq(d(play('u',PATHS.cautious).s),0);
});

console.log('\n── Funds index ──');
t('the funds index is bounded 0–100 and follows wealth', ()=>{
  eq(Ec.fundsIndex(0),0); eq(Ec.fundsIndex(600),40); eq(Ec.fundsIndex(99999),100);
  ok(Ec.fundsIndex(900)>Ec.fundsIndex(600));
});

// Print the three paths so the numbers are visible, not just asserted
console.log('\n── Example results (seed "demo") ──');
Object.keys(PATHS).forEach(n=>{
  const {s,out}=play('demo',PATHS[n]);
  console.log('  '+n.padEnd(13)+'final '+s.total().toFixed(0).padStart(5)+
    '  | storm loss '+out.L8s.loss.toFixed(0).padStart(4)+' of '+out.L8s.invested.toFixed(0).padStart(4)+' invested'+
    '  (even split would lose '+out.L8s.evenSplitLoss.toFixed(0)+')');
});

console.log('\n' + (fail===0?'ALL PASS':'FAILURES') + '  —  ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail===0?0:1);
