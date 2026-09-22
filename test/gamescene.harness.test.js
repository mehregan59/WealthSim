// Runs the REAL GameScene through all eight levels with a stand-in Phaser.
// Drawing is a no-op; timers and tweens fire immediately; choices are clicked.
const vm=require('vm'), fs=require('fs'), path=require('path');
let pass=0, fail=0;
function t(n,f){ try{f();console.log('  PASS  '+n);pass++;}catch(e){console.log('  FAIL  '+n+'\n        '+(e.stack||e.message).split('\n').slice(0,3).join('\n        '));fail++;} }
function ok(c,m){ if(!c) throw new Error(m||'falsy'); }
function near(a,b,tol,m){ if(Math.abs(a-b)>(tol||1e-6)) throw new Error((m||'')+' expected ~'+b+' got '+a); }

// ── Universal no-op object: callable, chainable, number-coercible ──
function noop(){ const f=function(){ return P; }; const P=new Proxy(f,{
  get(t,p){ if(p===Symbol.toPrimitive) return ()=>0; if(p==='then') return undefined;
            if(['width','height','x','y','displayWidth','displayHeight'].includes(p)) return 10; return P; },
  apply(){ return P; }, set(){ return true; } }); return P; }
const N=noop();

let queue=[];
function pump(){ let guard=0; while(queue.length && guard++<5000){ const f=queue.shift(); f(); } }

// ── Globals the game expects ──
global.window=global;
global.currentLang='en';
global.Phaser={ Scene:class{ constructor(){} }, Math:{ Between:(a,b)=>Math.floor((a+b)/2) } };
const core=p=>require(path.join(__dirname,'..','js','core',p));
global.WS={ Evidence:core('Evidence.js').Evidence, Sim:core('Sim.js').Sim, Chapters:core('Chapters.js').Chapters,
            Summary:core('Summary.js').Summary, Adapter:core('Adapter.js').Adapter, Economy:core('Economy.js').Economy };
global.ScoringEngine={ decisions:[], startingAnswers:[], reset(){this.decisions=[];},
  recordDecision(level,value,extra){ this.decisions.push(Object.assign({level,value},extra||{})); } };
global.Reports={ level:()=>({title:'T',body:'B'}) };

// Stub classes: keep config fields, everything else is a no-op
function stub(extra){ return class { constructor(scene,cfg){ Object.assign(this,cfg||{}); Object.assign(this,extra?extra(this):{});
  return new Proxy(this,{get:(o,p)=> (p in o)?o[p]:N}); } }; }
global.AmbientSystem=stub(()=>({ isNightTime:()=>false }));
global.WeatherSystem=stub(()=>({ startStorm(cb){ queue.push(cb); }, startRecovery(cb){ queue.push(cb); }, stopStorm(){} }));
global.TooltipManager=stub();
global.Tutorial=stub(()=>({ show(n,cb){ queue.push(cb); }, hide(){} }));
global.HUD=stub(()=>({ year:2024, yearText:{ setText(){} }, setLevel(){}, advanceYear(){} }));
global.ResourceCube=stub();
global.WorldButton=stub(()=>({ destroy(){} }));
global.District=stub(function(self){ return {
  health:self.health||45, labelBaseY:0, labelContainer:N, gfx:N, animGfx:N,
  subLabelY:()=>0, receiveResource(){}, takeDamage(){}, draw(){}, setStorm(){}, celebrate(){},
  setSelectable(on,cb){ this._cb = on ? cb : null; } }; });
global.RoadNetwork=stub(()=>({ sendVisitor(cb){ queue.push(cb); }, visitorAccept(d,cb){ queue.push(cb); }, visitorDecline(){}, update(){} }));
let fundsShown=null;
global.StatsPanel=stub(()=>({ updateStats(){}, recordSnapshot(){}, introHighlight(cb){ queue.push(cb); },
  setFundsCredits(n){ fundsShown=n; } }));

vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..','js','scenes','GameScene.js'),'utf8')+'\n;globalThis.GameScene=GameScene;');

function makeScene(seed){
  global.WS_SEED=seed; ScoringEngine.decisions=[]; queue=[]; fundsShown=null;
  const sc=new GameScene();
  Object.assign(sc,{ add:N, make:N, input:N, cameras:{main:N},
    scale:{width:1280,height:720},
    events:{ on(){}, off(){}, emit(){} },
    scene:{ start(k){ sc._started=k; } },
    time:{ delayedCall(ms,fn){ queue.push(fn); return {remove(){}}; }, addEvent(){ return {remove(){}}; } },
    tweens:{ add(cfg){ if(cfg&&cfg.onUpdate){ try{cfg.onUpdate({getValue:()=>1});}catch(e){} }
                        if(cfg&&cfg.onComplete) queue.push(cfg.onComplete); return N; },
             killTweensOf(){}, killAll(){} } });
  sc.consequences=[]; sc.pending=null;
  sc._showDecisionPanel=(opts,cb)=>{ sc.pending={opts,cb}; };
  sc._reportModal=(title,body,cb)=>{ queue.push(cb); };
  const orig=sc._showConsequence.bind(sc);
  sc._showConsequence=(text,cont,o)=>{ orig(text,cont,o); sc.consequences.push({text,cont}); };
  return sc;
}
function choose(sc,value){
  pump(); ok(sc.pending,'expected a decision panel');
  ok(sc.pending.opts.some(o=>o.value===value),'option '+value+' not offered: '+sc.pending.opts.map(o=>o.value));
  const p=sc.pending; sc.pending=null; p.cb(value); pump();
}
function next(sc){ pump(); const c=sc.consequences[sc.consequences.length-1]; ok(c,'expected a consequence'); c.cont(); pump(); }

function drive(seed,p){
  const sc=makeScene(seed);
  sc.create(); pump();                                   // intro + L1 tutorial + panel intro
  const d=sc.districts.find(x=>x.id===p.L1); ok(d && d._cb,'L1 district not selectable'); d._cb(d); pump(); next(sc);
  if(p.L2r) choose(sc,'research'); choose(sc,p.L2); next(sc);
  p.L3.forEach(id=>sc._onResourceDropped(sc.districts.find(x=>x.id===id))); pump(); next(sc);
  choose(sc,p.L4); next(sc);
  if(p.L5r) choose(sc,'research'); choose(sc,p.L5); next(sc);
  if(p.L6r) choose(sc,'research'); choose(sc,p.L6); next(sc);
  if(p.L7r) choose(sc,'research'); choose(sc,p.L7); next(sc);
  choose(sc,p.L8); next(sc);
  return sc;
}
const Ec=WS.Economy, Sim=WS.Sim;
function pure(seed,p){
  const s=Sim.createSession(seed,{startingCash:Ec.RULES.startCash});
  Ec.level1(s,p.L1); Ec.level2Start(s); Ec.level2(s,p.L2);
  Ec.level3Deposit(s); p.L3.forEach(d=>Ec.level3Cube(s,d)); Ec.level3End(s);
  Ec.level4(s,p.L4); Ec.level5Start(s); Ec.level5(s,p.L5); Ec.level6(s,p.L6); Ec.level7(s,p.L7);
  Ec.level8Storm(s); if(p.L4==='university') Ec.level8University(s); Ec.level8(s,p.L8);
  return s;
}

const PATHS={
  concentrated:{ L1:'technology', L2:'invest_more', L3:Array(6).fill('technology'), L4:'festival', L5:'all_in', L6:'decline', L7:'invest_more', L8:'hold' },
  cautious:    { L1:'housing', L2:'cancel', L3:['housing','housing','housing','energy','energy','transport'], L4:'festival', L5:'reduce', L6:'accept', L7:'sell', L8:'sell_all' },
  evidence:    { L1:'transport', L2:'continue', L2r:1, L3:['housing','housing','transport','transport','technology','energy'], L4:'university', L5:'hold', L5r:1, L6:'independent', L6r:1, L7:'hold', L7r:1, L8:'rebalance' }
};

console.log('\n── The real GameScene plays all eight levels ──');
Object.keys(PATHS).forEach(name=>{
  const seed='harness-'+name;
  let sc;
  t(name+': completes every level and reaches the result screen', ()=>{
    sc=drive(seed,PATHS[name]);
    ok(sc._started==='ProfileScene','ended at '+sc._started);
  });
  t(name+': final money equals the pure economy for the same seed and choices', ()=>{
    near(sc.sim.total(), pure(seed,PATHS[name]).total(), 1e-6);
  });
  t(name+': side panel shows the real final credits', ()=>{ near(fundsShown, sc.sim.total(), 1e-6); });
  t(name+': every market year reports real money in its message', ()=>{
    const withFunds=sc.consequences.filter(c=>/Funds: [\d,]+ credits/.test(c.text)).length;
    ok(withFunds>=7,'only '+withFunds+' consequences carried a funds line');
  });
  t(name+': one committed decision per level is recorded', ()=>{
    [1,2,4,5,6,7,8].forEach(l=>ok(ScoringEngine.decisions.some(d=>d.level===l && d.value!=='research'),'level '+l));
    ok(ScoringEngine.decisions.filter(d=>d.level===3).length===6,'six cube placements');
  });
  t(name+': the result screen summarises it with nothing unsupported', ()=>{
    const s=WS.Summary.build(WS.Adapter.toEvents(ScoringEngine.decisions),{},{lang:'en'});
    ok(s.unsupported.length===0, JSON.stringify(s.unsupported));
  });
});

console.log('\n── Retry reproduces the same market ──');
t('retrying Level 3 with the same placements gives identical money', ()=>{
  const sc=makeScene('retry-seed'); sc.create(); pump();
  const d=sc.districts[0]; d._cb(d); pump(); next(sc);
  choose(sc,'continue'); next(sc);
  ['technology','technology','housing','energy','transport','housing'].forEach(id=>sc._onResourceDropped(sc.districts.find(x=>x.id===id)));
  pump(); const first=sc.sim.total();
  sc._retryLevel(); pump();
  ['technology','technology','housing','energy','transport','housing'].forEach(id=>sc._onResourceDropped(sc.districts.find(x=>x.id===id)));
  pump(); near(sc.sim.total(), first, 1e-6);
});
t('retry does not duplicate recorded decisions', ()=>{
  const sc=makeScene('retry2'); sc.create(); pump();
  const d=sc.districts[1]; d._cb(d); pump(); next(sc);
  choose(sc,'cancel'); pump();
  const n=ScoringEngine.decisions.length; sc._retryLevel(); pump(); choose(sc,'continue');
  ok(ScoringEngine.decisions.length===n,'decisions '+n+' -> '+ScoringEngine.decisions.length);
});

console.log('\n── Wording ──');
t('no leading labels remain on any offered option', ()=>{
  const src=fs.readFileSync(path.join(__dirname,'..','js','scenes','GameScene.js'),'utf8');
  ['thoughtfully','boring','A confident bet','Little long-term value','Powerful later','Resources protected','more resilient structure']
    .forEach(w=>ok(src.indexOf(w)===-1,'still present: '+w));
});

console.log('\n' + (fail===0?'ALL PASS':'FAILURES') + '  —  ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail===0?0:1);
