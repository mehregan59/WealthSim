// Native UI behavior and city geometry in Node. Not a rendered browser test.
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const {EventEmitter}=require('node:events');
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attrs={};this.value='';this.classList={toggle:()=>{}};}
 append(n){this.children.push(n);n.parent=this;}
 replaceChildren(){this.children=[];}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,f){(this.listeners[k]||=[]).push(f);}
 click(){if(!this.disabled)(this.listeners.click||[]).forEach(f=>f());}
 focus(){this.focused=true;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
 get textContent(){return (this.text||'')+this.children.map(c=>c.textContent).join(' ');}
 set textContent(v){this.text=String(v);}
 querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);}
 querySelector(tag){return this.querySelectorAll(tag)[0];}
 get lastChild(){return this.children.at(-1);}
}
let count=0;function test(n,fn){fn();count++;console.log('PASS '+n);}
const document={body:new Element('body'),createElement:tag=>new Element(tag)};
const window={matchMedia:()=>({matches:false})};
const ctx=vm.createContext({document,window,console,Phaser:{Scene:class {}},setLang:()=>{},ScoringEngine:{reset(){}},Tutorial:{}});
vm.runInContext(fs.readFileSync('js/ui/CityExperience.js','utf8')+';this.UI=CityExperience;',ctx);
function makeScene(de=false){return {de:()=>de,currentLevel:1,cityStats:{happiness:60,development:40,resources:80},events:new EventEmitter(),time:{},tweens:{},input:{},hud:{cityText:{setText(){}}},scene:{start(n){this.started=n;},restart(){}},reducedMotion:false};}
for(const de of [false,true]){
 test((de?'DE':'EN')+' welcome reaches first choice without questionnaires',()=>{const s=makeScene(de);const ui=new ctx.UI(s);let started=0;ui.welcome(()=>started++);ui.panel.querySelector('input').value='Test City';ui.panel.querySelector('button').click();assert.equal(started,1);assert.equal(window.cityName,'Test City');assert.equal(window.WS_PLAY_MODE,'quick');s.events.emit('shutdown');});
 test((de?'DE':'EN')+' background-question route remains separate',()=>{const s=makeScene(de);const ui=new ctx.UI(s);ui.welcome(()=>{});ui.panel.querySelectorAll('button')[1].click();assert.equal(window.WS_PLAY_MODE,'research');assert.equal(s.scene.started,'PlayerSetup');s.events.emit('shutdown');});
}
test('native choice submits once and preserves numeric zero',()=>{const s=makeScene();const ui=new ctx.UI(s);const values=[];ui.choices([{label:'Zero',value:0}],v=>values.push(v));const b=ui.panel.querySelector('button');b.click();b.click();assert.deepEqual(values,[0]);s.events.emit('shutdown');});
test('pause freezes clocks and blocks decision panel; resume restores them',()=>{const s=makeScene();const ui=new ctx.UI(s);ui.setPaused(true);assert.equal(s.time.paused,true);assert.equal(s.tweens.timeScale,0);assert.equal(s.input.enabled,false);assert.equal(ui.panel.inert,true);ui.setPaused(false);assert.equal(s.time.paused,false);assert.equal(s.input.enabled,true);s.events.emit('shutdown');});
test('allocation accepts exactly six units and enables continuation',()=>{const s=makeScene();const ui=new ctx.UI(s);s.cubeDropped=0;let ended=0;const picks=[];s.districts=['housing','transport','technology','energy'].map(id=>({id,getName:()=>id,setSelectable(){}}));s._onResourceDropped=d=>{picks.push(d.id);s.cubeDropped++;};s._clearPersistentMessage=()=>{};s._finishLevel3=()=>ended++;ui.allocation();const buttons=ui.panel.querySelectorAll('button');assert.equal(buttons[4].disabled,true);for(let i=0;i<8;i++)buttons[i%4].click();assert.equal(picks.length,6);assert.equal(buttons[4].disabled,false);buttons[4].click();assert.equal(ended,1);s.events.emit('shutdown');});
test('closing the scene removes its native overlay',()=>{const s=makeScene();new ctx.UI(s);assert.equal(document.body.children.length,1);s.events.emit('shutdown');assert.equal(document.body.children.length,0);});
// Check the actual district layout at narrow/tablet/desktop sizes, no guessed positions.
ctx.District=class {constructor(scene,c){Object.assign(this,c);}};
vm.runInContext(fs.readFileSync('js/scenes/GameScene.js','utf8')+';this.GameScene=GameScene;',ctx);
for(const width of [390,768,1366])test('all four district coordinates fit '+width+'px',()=>{const s=new ctx.GameScene();s.W=width;s.H=850;s.S=1;s.PANEL=width<700?0:Math.min(240,width*.18);s.groundY=300;s.de=()=>false;s._buildDistricts();assert.equal(s.districts.length,4);for(const d of s.districts){assert.ok(Number.isFinite(d.cx)&&Number.isFinite(d.cy));assert.ok(d.cx>s.PANEL&&d.cx<width);assert.ok(d.cy>150&&d.cy<500);assert.ok(d.scale>0);assert.ok(d.name&&d.nameDE);}});
test('new final report preserves evidence and its replay control resets the session',()=>{
  let resets=0, destination;
  ctx.ScoringEngine.reset=()=>resets++;
  const s={de:false,events:new EventEmitter(),summary:{did:[{text:'Chose the university.'}],patterns:[],readings:[],comparison:[],nextSteps:[],disclaimer:'Session evidence only.',concentration:{available:false}},stats:{happiness:60,development:40},_pensionNote:()=>'',scene:{start:n=>destination=n}};
  ctx.UI.summary(s);const root=document.body.children[0];
  assert.ok(root.textContent.includes('Chose the university.'));
  assert.ok(root.textContent.includes('Session evidence only.'));
  root.querySelector('button').click();assert.equal(resets,1);assert.equal(destination,'GameScene');assert.equal(window.WS_PLAY_MODE,null);
  s.events.emit('shutdown');assert.equal(document.body.children.length,0);
});
// Exercise actual procedural drawing, detecting the prior undefined coordinates.
vm.runInContext(fs.readFileSync('js/city/District.js','utf8')+';this.RealDistrict=District;',ctx);
for(const id of ['housing','transport','technology','energy'])test(id+' draws with finite geometry',()=>{
  function shape(){let g;g=new Proxy({width:100,height:20,y:0}, {get:(obj,key)=>key in obj?obj[key]:(...args)=>{if(/^(fill|stroke|moveTo|lineTo)/.test(key))for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),key+' has non-finite coordinates');return g;}});return g;}
  const scene={S:1,add:{graphics:shape,container:shape,text:shape,rectangle:shape},tweens:{add(){},killTweensOf(){}},time:{delayedCall(){}},reducedMotion:true};
  const d=new ctx.RealDistrict(scene,{id,name:id,nameDE:id,cx:200,cy:300,color:0xabcdef,darkColor:0xaabbcc,accentColor:0x112233});
  assert.equal(d.citizens.length,5);d.update(0,0);d.receiveResource(1);assert.equal(d.health,54);
});
test('traffic and rain receive frame delta rather than total elapsed time',()=>{
  const s=new ctx.GameScene();let rain,traffic;s.experience={update(){},paused:false};s.weather={update:d=>rain=d};s.roads={update:d=>traffic=d};s.districts=[];
  s.update(120000,16);assert.equal(rain,16);assert.equal(traffic,16);
  s.reducedMotion=true;s.update(120016,16);assert.equal(rain,0);assert.equal(traffic,0);
});
test('native decision controls complete all ten chapters with the real evidence pipeline',()=>{
  const WS=Object.assign({},...['Sim','Economy','Chapters','Evidence','Adapter','Summary'].map(n=>require('../js/core/'+n+'.js')));
  ctx.WS=WS;window.WS=WS;ctx.currentLang='en';ctx.District=ctx.RealDistrict;
  const errors=[];ctx.console={log(){},error:(...args)=>errors.push(args.join(' '))};
  ctx.Phaser.Math={Between:(a,b)=>Math.round((a+b)/2)};
  const html=fs.readFileSync('index.html','utf8');
  vm.runInContext(html.match(/<script>\s*(const ScoringEngine[\s\S]*?)<\/script>/)[1]+';this.realEngine=ScoringEngine;',ctx);
  vm.runInContext(fs.readFileSync('js/city/WeatherSystem.js','utf8')+';this.Weather=WeatherSystem;',ctx);
  const queue=[];function shape(){let g;g=new Proxy({width:100,height:20,x:0,y:0},{get:(o,k)=>k in o?o[k]:(...args)=>g});return g;}
  const s=new ctx.GameScene();Object.assign(s,{W:1366,H:850,S:1,PANEL:220,groundY:300,reducedMotion:true,seed:'ui-route',currentLevel:0,cityName:'Test City',cityStats:{happiness:60,development:40,resources:80},sim:WS.Sim.createSession('ui-route'),snapshots:{},cubes:[],siteMarkers:[],_forecastEvents:[],_ch1Choices:[],_ch1PairIdx:0,events:new EventEmitter(),scale:{width:1366,height:850},add:{graphics:shape,text:shape,container:shape,rectangle:shape},input:{},hud:{setLevel(){}},statsPanel:{updateStats(){},setFundsCredits(){},recordSnapshot(){}},time:{delayedCall(ms,fn){queue.push(fn);return {remove(){}};},addEvent(){return {remove(){}};}},tweens:{killTweensOf(){},add(o){if(o.onComplete)queue.push(o.onComplete);return {remove(){}};}},cameras:{main:{shake(){},fade(a,b,c,d,e,cb){cb(null,1);}}},scene:{start(name,data){s.destination=name;s.result=data;}}});
  s.de=()=>false;s._buildDistricts();s.weather=new ctx.Weather(s);s.experience=new ctx.UI(s);s._startLevel(1);
  const levels=new Set();let steps=0;
  while(!s.destination && steps++<120){
    for(let n=0;queue.length && n<100;n++)queue.shift()();
    levels.add(s.currentLevel);
    const available=s.experience.panel.querySelectorAll('button').filter(b=>!b.disabled);
    assert.ok(available.length,'chapter '+s.currentLevel+' has no usable action');
    available[0].click();
  }
  assert.equal(s.destination,'ProfileScene');assert.equal(levels.size,10);assert.deepEqual(errors,[]);
  assert.equal(s.result.profile.forecast.n,4);assert.equal(s.result.profile.unsupported.length,0);
  assert.equal(WS.Chapters.riskPairs(WS.Adapter.toEvents(ctx.realEngine.decisions)).n,3);
  assert.equal(ctx.realEngine.decisions.filter(d=>d.level===3).length,6);
  s.events.emit('shutdown');
});
console.log(count+' presentation checks passed');
