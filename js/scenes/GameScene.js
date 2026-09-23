class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.S = Math.max(0.85, Math.min(1.9, this.H / 720));
    this.PANEL = Math.round(Math.min(260, Math.max(190, this.W * 0.155)));
    this.cityName = (window.cityName && String(window.cityName).trim()) ||
      ((typeof currentLang!=='undefined'&&currentLang==='de') ? 'Meine Stadt' : 'My City');

    const groundY = this.s(352);
    this.groundY = groundY;
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x18351c,1); ground.fillRect(0,groundY,this.W,this.H-groundY);
    ground.fillStyle(0x122a15,1); ground.fillRect(0,groundY+this.s(10),this.W,this.s(14));

    this.ambient = new AmbientSystem(this);
    this.weather = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);
    this.tutorial = new Tutorial(this);

    this.cityStats = { happiness:60, development:40, resources:80 };
    // Money comes from a seeded simulation, never from scripted numbers.
    // Happiness and development stay civic indicators outside it.
    this.seed = (window.WS_SEED && String(window.WS_SEED)) ||
                ('s' + Date.now().toString(36) + Math.random().toString(36).slice(2,6));
    this.sim = (window.WS && WS.Sim && WS.Economy)
      ? WS.Sim.createSession(this.seed, { startingCash: WS.Economy.RULES.startCash }) : null;
    if (this.sim) this.cityStats.resources = WS.Economy.fundsIndex(this.sim.total());
    if (typeof ScoringEngine !== 'undefined') ScoringEngine.session = { seed:this.seed, sim:this.sim };
    if (!this.sim) console.error('[WealthSim] simulation not loaded — funds fall back to scripted values');
    this.currentLevel = 0;
    this.cubes = []; this.cubeTotal = 0; this.cubeDropped = 0;
    this.decisionPanel = null; this.worldBtn = null; this.worldBtnTimer = null;
    this.consequencePanel = null; this.persistentMsg = null;
    this.hasUniversity = false; this.siteMarkers = [];
    this.tickerActive = false;
    this.snapshots = {};
    this._panelIntroShown = false;
    this._level3IdleTimer = null;

    this._buildDistricts();
    this._drawCityBoundary();
    this.roads = new RoadNetwork(this, this.districts);
    this.hud = new HUD(this);
    this.statsPanel = new StatsPanel(this);
    if (this.sim && this.statsPanel.setFundsCredits) this.statsPanel.setFundsCredits(this.sim.total());
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,0);

    this.input.keyboard.on('keydown-P', () => this._toProfile());
    this.events.off('resourceDropped');
    this.events.on('resourceDropped', ({district,value}) => this._onResourceDropped(district,value));
    this._introSequence();
  }

  s(v){ return Math.round(v * this.S); }
  _cx(){ return this.PANEL + (this.W - this.PANEL)/2; }
  _availW(){ return this.W - this.PANEL - this.s(60); }

  _buildDistricts() {
    const L = this.PANEL + this.s(96);
    const R = this.W - this.s(96);
    const span = R - L;
    const px = f => Math.round(L + span * f);
    const baseY = this.s(470);
    this.districts = [
      new District(this, {id:'housing',name:'Housing',nameDE:'Wohnviertel',label:'Housing District',labelDE:'Wohnviertel',
        color:0x2f8a42,darkColor:0x143d1c,accentColor:0x4aaa5c,cx:px(0.07),cy:baseY,health:45,scale:this.S,
        tooltip:'Stable homes for citizens.\nLow risk, steady growth.\nLike bonds in a portfolio.',
        tooltipDE:'Stabile Häuser für Bürger.\nGeringes Risiko, stetiges Wachstum.'}),
      new District(this, {id:'transport',name:'Transport',nameDE:'Verkehrsviertel',label:'Transport District',labelDE:'Verkehrsviertel',
        color:0x33608f,darkColor:0x142a44,accentColor:0x5c8ab0,cx:px(0.36),cy:baseY-this.s(38),health:45,scale:this.S,
        tooltip:'Roads and transit connect the city.\nModerate risk, reliable returns.',
        tooltipDE:'Straßen verbinden die Stadt.\nModerates Risiko, zuverlässige Erträge.'}),
      new District(this, {id:'technology',name:'Technology',nameDE:'Technologieviertel',label:'Technology District',labelDE:'Technologieviertel',
        color:0x6b3fae,darkColor:0x2a1450,accentColor:0x9966cc,cx:px(0.64),cy:baseY-this.s(38),health:45,scale:this.S,
        tooltip:'High growth potential.\nHigh uncertainty.\nCan double — or fall sharply.',
        tooltipDE:'Hohes Wachstumspotenzial.\nHohe Unsicherheit.'}),
      new District(this, {id:'energy',name:'Energy',nameDE:'Energieviertel',label:'Energy District',labelDE:'Energieviertel',
        color:0xa8850f,darkColor:0x5c4408,accentColor:0xddaa00,cx:px(0.93),cy:baseY+this.s(8),health:45,scale:this.S,
        tooltip:'Wind and solar power the city.\nEssential infrastructure.',
        tooltipDE:'Wind und Solar versorgen die Stadt.'})
    ];
  }

  _drawCityBoundary() {
    const cx = this.districts.reduce((s,d)=>s+d.cx,0) / this.districts.length;
    const cy = this.districts.reduce((s,d)=>s+d.cy,0) / this.districts.length - this.s(50);
    const groundY = this.groundY;

    const N = 32;
    const wobFor = (a) => Math.max(1, 1 + 0.10*Math.sin(a*3+1.3) + 0.07*Math.sin(a*5+0.6) + 0.045*Math.sin(a*7+2.4));
    const buildRing = (rx, ry, scale) => {
      const pts = [];
      for (let i=0;i<N;i++){
        const a = (i/N)*Math.PI*2;
        const wob = wobFor(a);
        pts.push({ x: cx+Math.cos(a)*rx*wob*scale, y: cy+Math.sin(a)*ry*wob*scale });
      }
      return pts;
    };
    const pointInPoly = (pt, poly) => {
      let inside = false;
      for (let i=0, j=poly.length-1; i<poly.length; j=i++){
        const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
        const hit = ((yi>pt.y)!==(yj>pt.y)) && (pt.x < (xj-xi)*(pt.y-yi)/(yj-yi)+xi);
        if (hit) inside = !inside;
      }
      return inside;
    };

    const footprint = this.s(95);
    const testPts = [];
    this.districts.forEach(d=>{
      testPts.push({x:d.cx, y:d.cy});
      testPts.push({x:d.cx-footprint, y:d.cy});
      testPts.push({x:d.cx+footprint, y:d.cy});
      testPts.push({x:d.cx, y:Math.max(groundY+this.s(4), d.cy-footprint*1.7)});
      testPts.push({x:d.cx, y:d.cy+footprint*0.6});
    });

    let rx = this.s(240), ry = this.s(160);
    let ring = buildRing(rx, ry, 1);
    let guard = 0;
    while (guard < 40 && !testPts.every(p=>pointInPoly(p,ring))) {
      rx *= 1.06; ry *= 1.06;
      ring = buildRing(rx, ry, 1);
      guard++;
    }

    const clampGround = pts => pts.map(p => ({ x:p.x, y: Math.max(p.y, groundY) }));
    ring = clampGround(ring);
    const inner = clampGround(buildRing(rx, ry, 0.94));

    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(0xe2a840, 0.035);
    g.beginPath();
    g.moveTo(ring[0].x, ring[0].y);
    for (let i=1;i<=N;i++){ const p=ring[i%N]; g.lineTo(p.x,p.y); }
    g.closePath(); g.fillPath();
    g.lineStyle(this.s(2.4), 0xe2a840, 0.42);
    g.strokePath();

    g.lineStyle(1, 0xe2a840, 0.18);
    g.beginPath();
    g.moveTo(inner[0].x, inner[0].y);
    for (let i=1;i<=N;i++){ const p=inner[i%N]; g.lineTo(p.x,p.y); }
    g.closePath(); g.strokePath();
  }

  _introSequence() {
    const fi=this.add.graphics().setDepth(200);
    fi.fillStyle(0x000000,1); fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:2000,delay:300,onComplete:()=>{fi.destroy();this._startLevel(1);}});
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const txt=this.add.text(this.W/2,this.H/2, de ? `${this.cityName} wartet.` : `${this.cityName} awaits.`,{
      fontFamily:'Playfair Display, Georgia, serif', fontSize:this.s(32), color:'#e2a840'
    }).setOrigin(0.5).setDepth(201).setAlpha(0);
    this.tweens.add({targets:txt,alpha:1,duration:900,delay:700,hold:1600,yoyo:true,onComplete:()=>txt.destroy()});
  }

  _saveSnapshot(n) {
    this.snapshots[n] = {
      stats: Object.assign({}, this.cityStats),
      health: this.districts.map(d=>d.health),
      hasUniversity: this.hasUniversity,
      year: this.hud.year,
      decisions: ScoringEngine.decisions.length,
      sim: this.sim ? this.sim.snapshot() : null
    };
  }

  _restoreSnapshot(n) {
    const s = this.snapshots[n];
    if (!s) return false;
    this.cityStats = Object.assign({}, s.stats);
    this.districts.forEach((d,i)=>{ d.health = s.health[i]; d.draw(); d.labelContainer.y = d.labelBaseY - (d.health/100)*this.s(24); });
    this.hasUniversity = s.hasUniversity;
    this.hud.year = s.year;
    this.hud.yearText.setText('Year ' + s.year);
    ScoringEngine.decisions.length = s.decisions;
    if (this.sim && s.sim) this.sim.restore(s.sim);
    this._updateStats(0,0,0);
    return true;
  }

  _startLevel(n, skipTutorial) {
    this.currentLevel=n;
    this._clearDecisionPanel(); this._clearCubes(); this._clearConsequence();
    this._clearWorldBtn(); this._clearPersistentMessage(); this._clearSiteMarkers();
    this._clearLevel3Idle();
    this.tutorial.hide();
    this.districts.forEach(d=>d.setSelectable(false));
    this.cubeDropped=0; this.cubeTotal=0;
    if (!this.snapshots[n]) this._saveSnapshot(n);
    const map={1:this._level1,2:this._level2,3:this._level3,4:this._level4,5:this._level5,6:this._level6,7:this._level7,8:this._level8};
    const fn=map[n]; if(!fn)return;
    this.hud.setLevel(n,this._levelName(n));
    const run = () => this.time.delayedCall(400, fn.bind(this));
    const proceed = () => {
      if (n===1 && !this._panelIntroShown) {
        this._panelIntroShown = true;
        this.statsPanel.introHighlight(run);
      } else { run(); }
    };
    if (skipTutorial) proceed();
    else this.time.delayedCall(700, ()=> this.tutorial.show(n, proceed));
  }

  _retryLevel() {
    const n = this.currentLevel;
    this._clearDecisionPanel(); this._clearConsequence(); this._clearWorldBtn();
    this._clearPersistentMessage(); this._clearSiteMarkers(); this._clearCubes();
    this._clearLevel3Idle();
    this._restoreSnapshot(n);
    this.time.delayedCall(250, ()=>this._startLevel(n, true));
  }

  _levelName(n){return {1:'The First Opportunity',2:'The Unexpected Setback',3:'Expansion',4:'Today or Tomorrow',5:'The Boom',6:'The Outside Offer',7:'Breaking News',8:'The Great Storm'}[n]||'Level '+n;}

  _nextLevel(){
    this._clearConsequence(); this._clearWorldBtn(); this._clearLevel3Idle();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,this.currentLevel);
    const next=this.currentLevel+1;
    if(next<=8) this._startLevel(next);
  }

  _toProfile(){ this.tweens.killAll(); this.scene.start('ProfileScene',{stats:this.cityStats}); }

  // Research button, shared by every level that offers one
  _researchOption(){
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    return {icon:'🔍', label:de?'Nachforschen':'Research first',
            desc:de?'Kostenlos — erst\nprüfen, dann wählen.':'Free — check first,\nthen still decide.',
            value:'research', color:0x5c8ab0};
  }

  // ══ LEVEL 1 ══
  _level1() {
    const ch=[
      {d:this.districts[0], l:'🌱 Safe & Steady',   v:'safe',       c:0x4aaa5c},
      {d:this.districts[1], l:'🚏 Reliable Growth', v:'balanced',   c:0x5c8ab0},
      {d:this.districts[2], l:'🚀 High Potential',  v:'aggressive', c:0x9966cc},
      {d:this.districts[3], l:'⚡ Balanced',        v:'balanced',   c:0xddaa00}
    ];
    this.siteMarkers=[];
    ch.forEach((o,i)=>{
      this.time.delayedCall(i*260,()=>{
        this.siteMarkers.push(this._choiceLabel(o.d.cx, o.d.subLabelY(), o.l, o.c));
        o.d.setSelectable(true, ()=>this._onLevel1Choice(o.d,o.v));
      });
    });
    this._showPersistentMessage('Tap directly on a district below to select it and start building there.');
  }

  _choiceLabel(x,y,text,color) {
    const c=this.add.container(x,y).setDepth(14);
    const t=this.add.text(0,0,text,{fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(13),color:'#ffffff',fontStyle:'600'}).setOrigin(0.5);
    const w=t.width+this.s(22), h=this.s(25);
    const bg=this.add.graphics();
    bg.fillStyle(color,0.32); bg.fillRoundedRect(-w/2,-h/2,w,h,h/2);
    bg.lineStyle(this.s(1.6),color,0.95); bg.strokeRoundedRect(-w/2,-h/2,w,h,h/2);
    c.add([bg,t]); c.setAlpha(0); c.setScale(0.8);
    this.tweens.add({targets:c,alpha:1,scaleX:1,scaleY:1,duration:400,ease:'Back.easeOut'});
    this.tweens.add({targets:c,y:y+this.s(4),duration:1500,yoyo:true,repeat:-1,ease:'Sine.easeInOut',delay:400});
    return c;
  }

  _clearSiteMarkers(){
    if(this.siteMarkers){ this.siteMarkers.forEach(m=>{try{this.tweens.killTweensOf(m);m.destroy();}catch(e){}}); this.siteMarkers=[]; }
  }

  _onLevel1Choice(d,v) {
    this._clearSiteMarkers(); this._clearPersistentMessage();
    this.districts.forEach(x=>x.setSelectable(false));
    ScoringEngine.recordDecision(1,v,{districtId:d.id});
    const ec=this._econ('level1', d.id);
    d.receiveResource(2); this.cameras.main.shake(240,0.004); this._updateStats(5,10,0);
    this._showConsequence('Construction begins in '+d.name+'.' + this._investLine(ec, d.name), ()=>this._nextLevel());
  }

  // ══ LEVEL 2 — now offers research, then still asks for a decision ══
  _level2() {
    this._workersLeave(); this.districts[2].takeDamage(28);
    this._l2event = this._econ('level2Start');   // identical for every player
    this._updateStats(-5,-8,0);
    this.time.delayedCall(1900,()=>this._level2Decide(false));
  }

  _level2Decide(hasRead) {
    this._showPersistentMessage(hasRead
      ? 'You have inspected the district. Now decide how the city reacts.'
      : 'The technology district has lost value.\nCheck DISTRICT PERFORMANCE on the left, then decide.');
    const opts=[
      {icon:'🛡',label:'Sell the holding',desc:'Move all Technology\nfunds to cash',value:'cancel',color:0x3a5f8a},
      {icon:'🏗',label:'Keep as is',desc:'Leave Technology\nfunds invested',value:'continue',color:0x4aaa5c},
      {icon:'💰',label:'Add 100',desc:'Put 100 more\ninto Technology',value:'invest_more',color:0xddaa00},
      {icon:'⏳',label:'Pause work',desc:'Leave funds invested,\nstop construction',value:'wait',color:0x6b7a8d}
    ];
    if(!hasRead) opts.push(this._researchOption());
    this._showDecisionPanel(opts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(2,'research');
        const r=Reports.level('setback');
        this._reportModal(r.title, r.body,
          ()=>{ this._updateStats(2,0,0); this.time.delayedCall(300,()=>this._level2Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(2,c,{afterResearch:hasRead});
      const ec=this._econ('level2', c);
      const e={cancel:{d:[5,-10,0],m:'Technology holdings were sold and moved to cash.'},
               continue:{d:[0,5,0],m:'Technology holdings stayed invested.'},
               invest_more:{d:[-5,12,0],m:'100 more went into Technology.'},
               wait:{d:[-5,-5,0],m:'Construction paused. Funds stayed invested.'}}[c]
               ||{d:[0,5,0],m:'Technology holdings stayed invested.'};
      this._updateStats(e.d[0],e.d[1],e.d[2]);
      if(c==='invest_more'){this.districts[2].receiveResource(1);this.cameras.main.shake(190,0.003);}
      else if(c==='cancel') this.districts[2].takeDamage(8);
      this._showConsequence(e.m + this._yearLine(ec), ()=>this._nextLevel());
    });
  }

  _workersLeave() {
    const t=this.districts[2];
    for(let i=0;i<9;i++){
      this.time.delayedCall(i*170,()=>{
        const w=this.add.graphics().setDepth(19);
        w.fillStyle(0xffcc88,1); w.fillCircle(0,0,this.s(2.6)); w.fillRect(-this.s(1.2),0,this.s(2.4),this.s(5));
        w.setPosition(t.cx+Phaser.Math.Between(-28,28), t.cy);
        this.tweens.add({targets:w,x:t.cx+Phaser.Math.Between(90,210),y:t.cy+Phaser.Math.Between(-20,30),alpha:0,duration:1700,onComplete:()=>w.destroy()});
      });
    }
  }

  // ══ LEVEL 3 ══
  _level3() {
    this._econ('level3Deposit');
    this._spawnResourceCubes(6);
    this._showPersistentMessage('The city receives 600 new credits.\nPlace all six cubes — 0 of 6 placed.');
    this._armLevel3Idle();
  }

  _spawnResourceCubes(n) {
    this.cubeTotal=n; this.cubeDropped=0;
    const sx=this.PANEL+this.s(50), gap=this.s(84);
    for(let i=0;i<n;i++) this.time.delayedCall(i*250,()=>this.cubes.push(new ResourceCube(this,sx+i*gap,this.H-this.s(70),1)));
  }

  _armLevel3Idle() {
    this._clearLevel3Idle();
    if (this.currentLevel!==3 || this.cubeDropped>=this.cubeTotal) return;
    this._level3IdleTimer = this.time.delayedCall(9000, ()=>{
      if (this.currentLevel!==3 || this.cubeDropped>=this.cubeTotal) return;
      const remaining = this.cubeTotal - this.cubeDropped;
      const de=(typeof currentLang!=='undefined'&&currentLang==='de');
      this._showPersistentMessage(de
        ? `Noch am Überlegen? ${remaining} Würfel warten noch \u2014 die Stadt kann erst weiter, wenn alle platziert sind.`
        : `Still deciding? ${remaining} cube${remaining===1?'':'s'} still waiting \u2014 the city can't move on until every one is placed.`);
    });
  }
  _clearLevel3Idle(){ if(this._level3IdleTimer){ this._level3IdleTimer.remove(false); this._level3IdleTimer=null; } }

  _onResourceDropped(district) {
    this.cubeDropped=(this.cubeDropped||0)+1;
    if(this.currentLevel===3){
      ScoringEngine.recordDecision(3,'allocate',{districtId:district.id});
      this._econ('level3Cube', district.id);
    }
    this._updateStats(2,4,0);
    if(this.currentLevel!==3) return;
    if(this.cubeDropped < this.cubeTotal){
      this._showPersistentMessage('The city receives 600 new credits.\nPlace all six cubes — '+this.cubeDropped+' of '+this.cubeTotal+' placed.');
      this._armLevel3Idle();
    } else {
      this._clearLevel3Idle();
      this._clearPersistentMessage();
      this.time.delayedCall(950,()=>this._level3Outcome());
    }
  }

  // Reports what the year actually did to each district, and to this
  // player's money — which depends only on where their funds sit.
  _level3Outcome() {
    const ec=this._econ('level3End');
    this._updateStats(0,2,0);
    let text='The year closes.';
    if (ec && ec.returns) {
      const parts=this.districts.map(d=>d.name+' '+this._pct(ec.returns[d.id]));
      text='The year closes. District values changed:\n'+parts.join('  ·  ');
    }
    this._showConsequence(text + this._yearLine(ec), ()=>this._nextLevel());
  }

  // ══ LEVEL 4 ══
  _level4() {
    this._showPersistentMessage('The city can build one of two facilities.\nThis decision will echo through the rest of the game.');
    this._showDecisionPanel([
      {icon:'🎪',label:'Festival Square',desc:'Costs 100 now.\nCitizens enjoy it now.',value:'festival',color:0xe2a840},
      {icon:'🎓',label:'Research University',desc:'Costs 150 now.\nPays 300 in the last level.',value:'university',color:0x4ecdc4}
    ],(c)=>{
      ScoringEngine.recordDecision(4,c); this._clearPersistentMessage();
      const ec=this._econ('level4', c);
      if(c==='university'){
        this.hasUniversity=true; this._updateStats(0,0,0);
        this._showConsequence('The university is under construction. It pays out in the last level.'+this._yearLine(ec),()=>this._nextLevel());
      } else {
        this._updateStats(18,0,0); this.districts[0].receiveResource(1);
        this._showConsequence('The square is built. Citizens enjoy it now.'+this._yearLine(ec),()=>this._nextLevel());
      }
    });
  }

  // ══ LEVEL 5 — now offers research, then still asks for a decision ══
  _level5() {
    const tech=this.districts[2];
    this._l5event = this._econ('level5Start');   // identical for every player
    tech.receiveResource(4); this.time.delayedCall(500,()=>tech.receiveResource(3));
    for(let i=0;i<16;i++) this.time.delayedCall(i*170,()=>this._firework(tech.cx+Phaser.Math.Between(-95,95),tech.cy+Phaser.Math.Between(-95,10)));
    this._newsTicker(['📰 Technology District up 40% in a single round!','📰 Commentators: growth will continue — neighbouring cities moving in...']);
    this.time.delayedCall(1500,()=>{
      this.districts.forEach((d,i)=>{if(i!==2)this.tweens.add({targets:[d.gfx,d.animGfx],alpha:0.4,duration:900});});
      this.time.delayedCall(2100,()=>this._level5Decide(false));
    });
  }

  _level5Decide(hasRead) {
    this._showPersistentMessage(hasRead
      ? 'You have read the analysis. Now decide.'
      : 'Technology rose 40% this round. What does the city do?');
    const opts=[
      {icon:'🚀',label:'Move everything',desc:'All funds into\nTechnology',value:'all_in',color:0x9966cc},
      {icon:'➕',label:'Add 150',desc:'Move 150 more\ninto Technology',value:'increase',color:0x4ecdc4},
      {icon:'⚖',label:'Keep as is',desc:'Leave the allocation\nunchanged',value:'hold',color:0x4aaa5c},
      {icon:'📉',label:'Sell half',desc:'Move half of\nTechnology to cash',value:'reduce',color:0xe2a840}
    ];
    if(!hasRead) opts.push(this._researchOption());
    this._showDecisionPanel(opts,(c)=>{
      this._clearPersistentMessage();
      const tech=this.districts[2];
      if(c==='research'){
        ScoringEngine.recordDecision(5,'research');
        const r=Reports.level('boom');
        this._reportModal(r.title, r.body,
          ()=>{ this._updateStats(2,0,0); this.time.delayedCall(300,()=>this._level5Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(5,c,{afterResearch:hasRead});
      const ec=this._econ('level5', c);
      this.districts.forEach(d=>this.tweens.add({targets:[d.gfx,d.animGfx],alpha:1,duration:600}));
      const m={all_in:'All funds were moved into Technology.',
               increase:'150 more was moved into Technology.',
               hold:'The allocation was left unchanged.',
               reduce:'Half of the Technology holding was moved to cash.'};
      if(c==='all_in'){tech.receiveResource(3);this._updateStats(5,15,0);}
      else if(c==='increase'){tech.receiveResource(1);this._updateStats(3,8,0);}
      else if(c==='hold') this._updateStats(2,4,0);
      else this._updateStats(0,-3,0);
      this._showConsequence((m[c]||m.hold) + this._yearLine(ec),()=>this._nextLevel());
    });
  }

  _firework(x,y){
    const cols=[0xff6644,0xffcc00,0x44ffcc,0xff44aa,0xaaccff,0xee88ff];
    const col=cols[Phaser.Math.Between(0,cols.length-1)];
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2;
      const s=this.add.graphics().setDepth(36);
      s.fillStyle(col,1); s.fillCircle(0,0,this.s(3)); s.setPosition(x,y);
      this.tweens.add({targets:s,x:x+Math.cos(a)*this.s(55),y:y+Math.sin(a)*this.s(55),alpha:0,duration:550+Math.random()*420,onComplete:()=>s.destroy()});
    }
  }

  _celebrateCity(bannerText){
    this.districts.forEach((d,i)=>{
      for(let i2=0;i2<10;i2++) this.time.delayedCall(i*90+i2*90,()=>this._firework(d.cx+Phaser.Math.Between(-70,70),d.cy+Phaser.Math.Between(-70,0)));
    });
    this.cameras.main.shake(260,0.004);
    const banner=this.add.text(this._cx(),this.H*0.32,bannerText,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(30),color:'#ffe9ab',
      align:'center',stroke:'#3a2600',strokeThickness:this.s(3)
    }).setOrigin(0.5).setDepth(80).setAlpha(0).setScale(0.7);
    this.tweens.add({targets:banner,alpha:1,scaleX:1,scaleY:1,duration:500,ease:'Back.easeOut',hold:1600,yoyo:true,onComplete:()=>banner.destroy()});
  }

  // ══ LEVEL 6 ══
  _level6() {
    this._showPersistentMessage('A delegation is arriving from the neighbouring city...');
    this.roads.sendVisitor(()=>{ this._level6Decide(false); });
  }

  _level6Decide(hasRead) {
    this._showPersistentMessage(hasRead
      ? 'You have the full picture. What does the city do?'
      : 'They offer to share their water infrastructure.\nWhat does the city do?');
    const opts=[
      {icon:'🤝',label:'Accept offer',desc:'Costs 200.\nShared with neighbour.',value:'accept',color:0x4ecdc4},
      {icon:'🏗',label:'Build own',desc:'Costs 400.\nCity controls it.',value:'independent',color:0x4aaa5c},
      {icon:'❌',label:'Decline both',desc:'Costs nothing.\nNo new water supply.',value:'decline',color:0x6b7a8d}
    ];
    if (!hasRead) opts.push(this._researchOption());
    this._showDecisionPanel(opts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(6,'research');
        const r=Reports.level('delegation');
        this._reportModal(r.title, r.body,
          ()=>{ this._updateStats(3,0,0); this.time.delayedCall(300,()=>this._level6Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(6,c,{afterResearch:hasRead});
      const ec=this._econ('level6', c);
      const m={accept:'The delegation drives into the city. Water is now shared with the neighbour.',
               independent:'The delegation leaves. The city builds and runs its own water supply.',
               decline:'The delegation leaves. No new water supply is built.'};
      const dl={accept:[-8,5,0],independent:[-5,8,0],decline:[0,0,0]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='accept'){
        this.roads.visitorAccept(this.districts[0], ()=>{ this.districts[0].receiveResource(1); this._celebrateCity('🎉 Partnership Celebrated!'); });
      } else {
        this.roads.visitorDecline(); if(c==='independent') this.districts[0].receiveResource(1);
      }
      this._showConsequence((m[c]||m.decline) + this._yearLine(ec),()=>this._nextLevel());
    });
  }

  // ══ LEVEL 7 ══
  _level7() {
    this._newsTicker(['📰 Several major cities abandoning technology districts!','📰 Friends and advisors recommending immediate action...']);
    this.time.delayedCall(2400,()=>this._level7Decide(false));
  }

  _level7Decide(hasRead) {
    this._showPersistentMessage(hasRead
      ? 'You have the full picture. Now decide what the city does.'
      : 'News arrives from across the region.\nTake your time. The decision sits open.');
    const opts=[
      {icon:'📤',label:'Sell Technology',desc:'Move all of it\nto cash',value:'sell',color:0xe74c3c},
      {icon:'⬇',label:'Sell half',desc:'Move half of it\nto cash',value:'reduce',color:0xe2a840},
      {icon:'🔒',label:'Keep as is',desc:'Leave the allocation\nunchanged',value:'hold',color:0x4aaa5c},
      {icon:'📈',label:'Add 100',desc:'Move 100 more\ninto Technology',value:'invest_more',color:0x9966cc}
    ];
    if (!hasRead) opts.push(this._researchOption());
    this._showDecisionPanel(opts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(7,'research');
        const r=Reports.level('headlines');
        this._reportModal(r.title, r.body,
          ()=>{ this._updateStats(3,0,0); this.time.delayedCall(300,()=>this._level7Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(7,c,{afterResearch:hasRead});
      const ec=this._econ('level7', c);
      const m={sell:'All Technology holdings were moved to cash.',
               reduce:'Half of the Technology holding was moved to cash.',
               hold:'The allocation was left unchanged.',
               invest_more:'100 more was moved into Technology.'};
      const dl={sell:[-5,-12,0],reduce:[-2,-5,0],hold:[2,0,0],invest_more:[-3,10,0]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='sell') this.districts[2].takeDamage(15);
      if(c==='invest_more') this.districts[2].receiveResource(2);
      this._showConsequence((m[c]||m.hold) + this._yearLine(ec),()=>this._nextLevel());
    });
  }

  // ══ LEVEL 8 ══
  _level8() {
    this.weather.startStorm(()=>{
      this.districts.forEach(d=>{d.setStorm(true);d.takeDamage(26);});
      this._storm = this._econ('level8Storm');   // loss follows holdings only
      this._updateStats(-15,-20,0); this.cameras.main.shake(900,0.012);
      const UNI_START=2000, UNI_FADE=1500, UNI_HOLD=6000;
      const UNI_END = UNI_START + UNI_FADE + UNI_HOLD + UNI_FADE;
      if(this.hasUniversity){
        this.time.delayedCall(UNI_START,()=>{
          this._tempMessage('The Research University opens.\nIt pays the city '+this._fmt(WS.Economy&&WS.Economy.RULES?WS.Economy.RULES.L4.universityPayout:300)+' credits.',UNI_HOLD,UNI_FADE);
          this.districts[0].receiveResource(2); this.districts[1].receiveResource(1);
          this._econ('level8University');
          this._updateStats(10,15,0);
        });
      }
      this.time.delayedCall(this.hasUniversity?(UNI_END+600):3900,()=>{
        this._showPersistentMessage('An economic storm hits every city.' + this._stormLine() + '\nWhat does the city do now?');
        this._showDecisionPanel([
          {icon:'🏃',label:'Sell everything',desc:'Move all holdings\nto cash',value:'sell_all',color:0xe74c3c},
          {icon:'🏛',label:'Keep as is',desc:'Leave the allocation\nunchanged',value:'hold',color:0x4aaa5c},
          {icon:'⚖',label:'Split evenly',desc:'Spread everything\nequally over 4',value:'rebalance',color:0x4ecdc4},
          {icon:'📈',label:'Invest the cash',desc:'Spread remaining\ncash over 4',value:'opportunistic',color:0xe2a840}
        ],(c)=>{
          ScoringEngine.recordDecision(8,c); this._clearPersistentMessage();
          const ec=this._econ('level8', c);
          this.weather.stopStorm(1000);
          this.time.delayedCall(1700,()=>{
            this.districts.forEach(d=>d.setStorm(false));
            this.weather.startRecovery(()=>{ this.districts.forEach(d=>d.receiveResource(1)); this._updateStats(8,12,0); });
            const m={sell_all:'All holdings were moved to cash for the following year.',
                     hold:'The allocation was left unchanged for the following year.',
                     rebalance:'Everything was spread equally across the four districts.',
                     opportunistic:'Remaining cash was spread across the four districts.'};
            const dl={sell_all:[-5,-15,0],hold:[5,0,0],rebalance:[5,8,0],opportunistic:[3,12,0]}[c]||[0,0,0];
            this._updateStats(dl[0],dl[1],dl[2]);
            this._showConsequence((m[c]||m.hold) + '\nThe year after the storm was an ordinary one — it could go either way.' + this._yearLine(ec),()=>this._finish());
          });
        });
      });
    });
  }

  _finish() {
    this._clearConsequence(); this._clearWorldBtn();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,8);
    const ov=this.add.graphics().setDepth(190);
    const o={a:0};
    this.tweens.add({targets:o,a:1,duration:1800,
      onUpdate:()=>{ov.clear();ov.fillStyle(0x061019,o.a);ov.fillRect(0,0,this.W,this.H);},
      onComplete:()=>this._toProfile()});
  }

  _newsTicker(lines){
    this.tickerActive = true;
    const top=this.s(44), h=this.s(36);
    const bg=this.add.graphics().setDepth(45);
    bg.fillStyle(0x9e1600,0.96); bg.fillRect(0,top,this.W,h);
    bg.lineStyle(1,0xff4422,0.85); bg.lineBetween(0,top+h,this.W,top+h);
    const br=this.add.text(this.s(16),top+h/2,'BREAKING',{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(12),color:'#ffeecc',fontStyle:'700',letterSpacing:2
    }).setOrigin(0,0.5).setDepth(46);
    const sep=this.add.graphics().setDepth(46);
    sep.fillStyle(0xffffff,0.35); sep.fillRect(this.s(96),top+this.s(8),1,h-this.s(16));
    const tk=this.add.text(this.W+20,top+h/2,lines.join('   ★   '),{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#ffffff',fontStyle:'600'
    }).setOrigin(0,0.5).setDepth(46);
    const dur=Math.max(24000, tk.width*30);
    this.tweens.add({targets:tk,x:-(tk.width+120),duration:dur,ease:'Linear',
      onComplete:()=>{tk.destroy();bg.destroy();br.destroy();sep.destroy();this.tickerActive=false;}});
  }

  _reportModal(title,text,cb){
    const W=this.W,H=this.H;
    const ov=this.add.graphics().setDepth(90); ov.fillStyle(0x000000,0.78); ov.fillRect(0,0,W,H);
    const bw=Math.min(this.s(600),W-this.s(80));
    const body=this.add.text(0,0,text,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(15),color:'#c4d8ea',
      wordWrap:{width:bw-this.s(70)},align:'left',lineSpacing:this.s(7)}).setDepth(92);
    const bh=Math.max(this.s(240), body.height + this.s(140));
    const bx=(W-bw)/2, by=(H-bh)/2;
    const box=this.add.graphics().setDepth(91);
    box.fillStyle(0x08121f,0.99); box.fillRoundedRect(bx,by,bw,bh,this.s(14));
    box.lineStyle(1,0xe2a840,0.55); box.strokeRoundedRect(bx,by,bw,bh,this.s(14));
    box.fillStyle(0x5c8ab0,0.9); box.fillRect(bx,by,bw,this.s(3));
    const t=this.add.text(W/2,by+this.s(32),title,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(20),color:'#e2a840'}).setOrigin(0.5).setDepth(92);
    body.setPosition(bx+this.s(35), by+this.s(64));
    const btn=this.add.text(W/2,by+bh-this.s(34),'Continue →',{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),color:'#f0c060'})
      .setOrigin(0.5).setDepth(92).setInteractive({useHandCursor:true});
    btn.on('pointerover',()=>btn.setColor('#ffe090')); btn.on('pointerout',()=>btn.setColor('#f0c060'));
    btn.on('pointerdown',()=>{ov.destroy();box.destroy();t.destroy();body.destroy();btn.destroy();if(cb)cb();});
  }

  _msgY(){ return this.tickerActive ? this.s(116) : this.s(72); }

  _showPersistentMessage(text){
    this._clearPersistentMessage();
    const y=this._msgY();
    this.persistentMsg=this.add.text(this._cx(),y-this.s(6),text,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(18),color:'#eaf2ff',
      align:'center',wordWrap:{width:Math.min(this.s(760),this._availW())},
      backgroundColor:'#040a14',padding:{x:this.s(22),y:this.s(13)},lineSpacing:this.s(5)
    }).setOrigin(0.5).setDepth(48).setAlpha(0);
    this.tweens.add({targets:this.persistentMsg,alpha:1,y:y,duration:600});
  }
  _clearPersistentMessage(){ if(this.persistentMsg){this.tweens.killTweensOf(this.persistentMsg);this.persistentMsg.destroy();this.persistentMsg=null;} }

  _tempMessage(text,dur,fadeDur){
    fadeDur = fadeDur || 1000;
    const m=this.add.text(this._cx(),this.H-this.s(120),text,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),color:'#e2a840',
      align:'center',backgroundColor:'#040a14',padding:{x:this.s(20),y:this.s(12)},lineSpacing:this.s(5)
    }).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.tweens.add({targets:m,alpha:1,y:this.H-this.s(128),duration:fadeDur,hold:dur||5000,yoyo:true,onComplete:()=>m.destroy()});
  }

  _showConsequence(text,onContinue,opts){
    opts = opts || {};
    this._clearWorldBtn();
    this._clearConsequence(); this._clearDecisionPanel();
    const cx=this._cx();
    const pw=Math.min(this.s(720),this._availW()), px=cx-pw/2;
    // Measure the text first so the panel always fits it
    const probe=this.add.text(0,0,text,{fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),
      wordWrap:{width:pw-this.s(56)},lineSpacing:this.s(6)});
    const ph=Math.max(this.s(104), probe.height+this.s(40)); probe.destroy();
    const py=this.H-this.s(82)-ph;
    this._consequenceTop=py;

    const dim=this.add.graphics();
    dim.fillStyle(0x02060c, 0.9);
    dim.fillRect(0, 0, this.W, this.H);

    const bg=this.add.graphics();
    bg.fillStyle(0x040a14,0.95); bg.fillRoundedRect(px,py,pw,ph,this.s(12));
    bg.lineStyle(1,0x4ecdc4,0.55); bg.strokeRoundedRect(px,py,pw,ph,this.s(12));
    bg.lineStyle(this.s(4),0x4ecdc4,0.8); bg.lineBetween(px,py+this.s(10),px,py+ph-this.s(10));
    const t=this.add.text(cx,py+ph/2,text,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),color:'#dbe8f4',
      align:'center',wordWrap:{width:pw-this.s(56)},lineSpacing:this.s(6)}).setOrigin(0.5);

    const elements=[dim,bg,t];

    if(!opts.auto){
      const rw=this.s(120), rh=this.s(30);
      const rx=px+pw-rw-this.s(12), ry=py+ph+this.s(10);
      const rg=this.add.graphics();
      const rTxt=this.add.text(rx+rw/2, ry+rh/2, (typeof currentLang!=='undefined'&&currentLang==='de')?'↺ Wiederholen':'↺ Retry level',{
        fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(12),color:'#7d97b3'}).setOrigin(0.5);
      const drawR=(hv)=>{ rg.clear();
        rg.fillStyle(0x0b1725,hv?1:0.85); rg.fillRoundedRect(rx,ry,rw,rh,this.s(7));
        rg.lineStyle(1,hv?0x8aa4c0:0x2c4767,1); rg.strokeRoundedRect(rx,ry,rw,rh,this.s(7));
        rTxt.setColor(hv?'#c8d8ea':'#7d97b3'); };
      drawR(false);
      const rHit=this.add.rectangle(rx+rw/2,ry+rh/2,rw,rh,0xffffff,0).setInteractive({useHandCursor:true});
      rHit.on('pointerover',()=>drawR(true)); rHit.on('pointerout',()=>drawR(false));
      rHit.on('pointerdown',()=>this._retryLevel());
      elements.push(rg,rTxt,rHit);
    }

    this.consequencePanel=this.add.container(0,0).setDepth(62);
    this.consequencePanel.add(elements);
    this.consequencePanel.setAlpha(0);
    this.tweens.add({targets:this.consequencePanel,alpha:1,duration:650});

    if(opts.auto){
      this.worldBtnTimer = this.time.delayedCall(opts.autoDelay||2600, ()=>{
        this.worldBtnTimer=null;
        if(onContinue) onContinue();
      });
      return;
    }

    this.worldBtnTimer = this.time.delayedCall(1100,()=>{
      this.worldBtnTimer=null;
      const lbl=(typeof currentLang!=='undefined'&&currentLang==='de')?'Weiter →':'Continue →';
      this.worldBtn=new WorldButton(this,cx,(this._consequenceTop||this.H-this.s(186))-this.s(76),lbl,()=>{this.worldBtn=null;if(onContinue)onContinue();});
    });
  }
  _clearConsequence(){ if(this.consequencePanel){this.tweens.killTweensOf(this.consequencePanel);this.consequencePanel.destroy();this.consequencePanel=null;} }

  _showDecisionPanel(options,cb){
    this._clearDecisionPanel();
    const cx=this._cx();
    const cols=options.length;
    const avail=this._availW();
    const btnW=Math.min(this.s(180),(avail-this.s(48)-(cols-1)*this.s(12))/cols);
    const btnH=this.s(100);
    const panelW=cols*btnW+(cols-1)*this.s(12)+this.s(48);
    const panelH=btnH+this.s(28), panelX=cx-panelW/2, panelY=this.H-panelH-this.s(18);
    this.decisionPanel=this.add.container(0,0).setDepth(60);
    const bg=this.add.graphics();
    bg.fillStyle(0x040a14,0.96); bg.fillRoundedRect(panelX,panelY,panelW,panelH,this.s(12));
    bg.lineStyle(1,0x24405f,1); bg.strokeRoundedRect(panelX,panelY,panelW,panelH,this.s(12));
    this.decisionPanel.add(bg);
    options.forEach((o,i)=>{
      const bx=panelX+this.s(24)+i*(btnW+this.s(12)), by=panelY+this.s(14);
      const g=this.add.graphics();
      const draw=(hv)=>{g.clear();
        g.fillStyle(o.color,hv?0.42:0.15); g.fillRoundedRect(bx,by,btnW,btnH,this.s(9));
        g.lineStyle(hv?this.s(2.4):1,o.color,hv?0.98:0.5); g.strokeRoundedRect(bx,by,btnW,btnH,this.s(9));};
      draw(false); this.decisionPanel.add(g);
      const ic=this.add.text(bx+btnW/2,by+this.s(20),o.icon,{fontSize:this.s(23)}).setOrigin(0.5);
      const lb=this.add.text(bx+btnW/2,by+this.s(50),o.label,{
        fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#f4f8ff',
        fontStyle:'700',align:'center',wordWrap:{width:btnW-this.s(14)}}).setOrigin(0.5);
      const de=this.add.text(bx+btnW/2,by+this.s(78),o.desc,{
        fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(12),color:'#9ab5cf',
        align:'center',wordWrap:{width:btnW-this.s(14)},lineSpacing:this.s(3)}).setOrigin(0.5);
      this.decisionPanel.add([ic,lb,de]);
      const hit=this.add.rectangle(bx+btnW/2,by+btnH/2,btnW-this.s(4),btnH-this.s(2),0xffffff,0)
        .setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>draw(true)); hit.on('pointerout',()=>draw(false));
      hit.on('pointerdown',()=>{this.cameras.main.shake(70,0.002);this._clearDecisionPanel();if(cb)cb(o.value);});
      this.decisionPanel.add(hit);
    });
    this.decisionPanel.y=this.s(80);
    this.tweens.add({targets:this.decisionPanel,y:0,duration:450,ease:'Back.easeOut'});
  }
  _clearDecisionPanel(){ if(this.decisionPanel){this.tweens.killTweensOf(this.decisionPanel);this.decisionPanel.destroy();this.decisionPanel=null;} }
  _clearWorldBtn(){
    if(this.worldBtnTimer){ this.worldBtnTimer.remove(false); this.worldBtnTimer=null; }
    if(this.worldBtn){ this.worldBtn.destroy(); this.worldBtn=null; }
  }
  _clearCubes(){ this.cubes.forEach(c=>{try{c.destroy();}catch(e){}}); this.cubes=[]; }

  // Happiness and development are civic indicators nudged by the story.
  // Funds are never nudged: they are read from the simulation, so the bar
  // always matches real money. The third argument is ignored when the
  // simulation is running.
  _updateStats(h,d,r){
    this.cityStats.happiness=Math.max(5,Math.min(100,this.cityStats.happiness+h));
    this.cityStats.development=Math.max(5,Math.min(100,this.cityStats.development+d));
    if (this.sim) {
      const tot=this.sim.total();
      this.cityStats.resources=WS.Economy.fundsIndex(tot);
      if (this.statsPanel.setFundsCredits) this.statsPanel.setFundsCredits(tot);
    } else {
      this.cityStats.resources=Math.max(5,Math.min(100,this.cityStats.resources+r));
    }
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    if (this.sim) { this.hud.year=this.sim.state.year; if(this.hud.yearText) this.hud.yearText.setText('Year '+this.hud.year); }
    else this.hud.advanceYear(2);
  }

  // ── Simulation plumbing ────────────────────────────────────────
  _econ(fn, arg){
    if(!this.sim || !window.WS || !WS.Economy || !WS.Economy[fn]) return null;
    const r = WS.Economy[fn](this.sim, arg);
    this._updateStats(0,0,0);
    return r;
  }
  _de(){ return (typeof currentLang!=='undefined' && currentLang==='de'); }
  _fmt(n){ return Math.round(n).toLocaleString(this._de()?'de-DE':'en-GB'); }
  _pct(r){ if(typeof r!=='number') return '—'; const v=Math.round(r*100); return (v>0?'+':v<0?'\u2212':'\u00b1')+Math.abs(v)+'%'; }
  _signed(n){ const v=Math.round(n); return (v>0?'+':v<0?'\u2212':'\u00b1')+this._fmt(Math.abs(v)); }
  // Real money after a market year: total and change this round
  _yearLine(ec){
    if(!ec) return '';
    return this._de()
      ? '\nMittel: '+this._fmt(ec.after)+' Credits ('+this._signed(ec.change)+' in dieser Runde).'
      : '\nFunds: '+this._fmt(ec.after)+' credits ('+this._signed(ec.change)+' this round).';
  }
  _investLine(ec, name){
    if(!ec) return '';
    return this._de()
      ? '\n'+this._fmt(WS.Economy.RULES.L1.invest)+' Credits sind jetzt in '+name+' investiert.'
      : '\n'+this._fmt(WS.Economy.RULES.L1.invest)+' credits are now invested in '+name+'.';
  }
  // Storm loss, with the same storm applied to an even split of the same
  // money. Stated as numbers — an even split is not always the smaller loss.
  _stormLine(){
    const st=this._storm; if(!st || !st.invested) return '';
    return this._de()
      ? '\nDeine Anlagen verloren '+this._fmt(st.loss)+' von '+this._fmt(st.invested)+' Credits. Gleichmäßig verteilt hätte derselbe Sturm '+this._fmt(st.evenSplitLoss)+' gekostet.'
      : '\nYour holdings lost '+this._fmt(st.loss)+' of '+this._fmt(st.invested)+' credits. The same storm on an even split would have cost '+this._fmt(st.evenSplitLoss)+'.';
  }

  update(time,delta){
    const night=this.ambient.isNightTime();
    this.ambient.update(time,delta);
    this.weather.update(delta);
    this.roads.update(delta,night);
    this.districts.forEach(d=>d.update(time,delta));
  }
}
