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
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x18351c,1); ground.fillRect(0,groundY,this.W,this.H-groundY);
    ground.fillStyle(0x122a15,1); ground.fillRect(0,groundY+this.s(10),this.W,this.s(14));

    this.ambient = new AmbientSystem(this);
    this.weather = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);
    this.tutorial = new Tutorial(this);

    this.cityStats = { happiness:60, development:40, resources:80 };
    this.currentLevel = 0;
    this.cubes = []; this.cubeTotal = 0; this.cubeDropped = 0;
    this.decisionPanel = null; this.worldBtn = null; this.worldBtnTimer = null;
    this.consequencePanel = null; this.persistentMsg = null;
    this.hasUniversity = false; this.siteMarkers = [];
    this.tickerActive = false;
    this.snapshots = {};          // for undo
    this._panelIntroShown = false;
    this._level3IdleTimer = null;

    this._buildDistricts();
    this._drawCityBoundary();
    this.roads = new RoadNetwork(this, this.districts);
    this.hud = new HUD(this);
    this.statsPanel = new StatsPanel(this);
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,0);

    this.input.keyboard.on('keydown-P', () => this._toProfile());
    this.events.on('resourceDropped', ({district,value}) => this._onResourceDropped(district,value));
    this._introSequence();
  }

  s(v){ return Math.round(v * this.S); }
  _cx(){ return this.PANEL + (this.W - this.PANEL)/2; }
  _availW(){ return this.W - this.PANEL - this.s(60); }

  _buildDistricts() {
    // Extra margin off both the panel and the right edge of the screen,
    // and Housing/Energy pulled ~20% closer to their inner neighbours
    // (Transport/Technology) instead of sitting right at the outer bounds.
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

  // One boundary drawn around all four districts. The name now lives in
  // the HUD next to the year instead of on the ground.
  //
  // This is the second rewrite of the containment logic. The first tried
  // to guarantee coverage by reasoning about the ellipse/wobble math
  // in advance — but an ellipse inscribed in a bounding box only touches
  // that box at the midpoints of its four sides; a point that's at the
  // horizontal extreme (like Housing or Energy) but off the vertical
  // center (which all four districts are, since they sit at slightly
  // different heights) can fall outside that ellipse even before any
  // wobble is added. Reasoning about that in advance and getting it
  // exactly right is easy to get wrong — this version instead builds the
  // shape, explicitly tests whether it contains every district (center
  // plus an approximate visual footprint, not just the pixel-center
  // point), and grows the shape until it verifiably does, rather than
  // trusting the geometry to work out.
  _drawCityBoundary() {
    const cx = this.districts.reduce((s,d)=>s+d.cx,0) / this.districts.length;
    // Centered slightly above the raw vertical average, since buildings
    // and name labels extend much further above each district than
    // anything extends below it.
    const cy = this.districts.reduce((s,d)=>s+d.cy,0) / this.districts.length - this.s(50);

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

    // Test the whole approximate visual footprint of each district — its
    // center, left/right edges, and well above/below it (labels sit high
    // above center; buildings extend a bit below) — not just the center
    // point, so the boundary clears the actual artwork, not just a dot.
    const footprint = this.s(95);
    const testPts = [];
    this.districts.forEach(d=>{
      testPts.push({x:d.cx, y:d.cy});
      testPts.push({x:d.cx-footprint, y:d.cy});
      testPts.push({x:d.cx+footprint, y:d.cy});
      testPts.push({x:d.cx, y:d.cy-footprint*1.7});
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

    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(0xe2a840, 0.035);
    g.beginPath();
    g.moveTo(ring[0].x, ring[0].y);
    for (let i=1;i<=N;i++){ const p=ring[i%N]; g.lineTo(p.x,p.y); }
    g.closePath(); g.fillPath();
    g.lineStyle(this.s(2.4), 0xe2a840, 0.42);
    g.strokePath();

    // A faint second, smaller ring just inside the border — reads like a
    // coastline/contour line rather than a single flat outline.
    const inner = buildRing(rx, ry, 0.94);
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

  // Save state so a level can be replayed from scratch
  _saveSnapshot(n) {
    this.snapshots[n] = {
      stats: Object.assign({}, this.cityStats),
      health: this.districts.map(d=>d.health),
      hasUniversity: this.hasUniversity,
      year: this.hud.year,
      decisions: ScoringEngine.decisions.length
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
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
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
      // The very first time Level 1 starts, point the player at the side
      // panel and explain what it tracks before anything is asked of them.
      if (n===1 && !this._panelIntroShown) {
        this._panelIntroShown = true;
        this.statsPanel.introHighlight(run);
      } else {
        run();
      }
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
        // Positioned from the district's own label so they can never collide
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
    d.receiveResource(2); this.cameras.main.shake(240,0.004); this._updateStats(5,10,-5);
    const m={safe:'Construction begins carefully.\nThe city grows slowly but steadily.',
             balanced:'A balanced approach takes shape.\nThe city moves forward with measured confidence.',
             aggressive:'Cranes rise. Citizens are excited.\nResults will take time to appear.'};
    this._showConsequence(m[v]||m.balanced, ()=>this._nextLevel());
  }

  // ══ LEVEL 2 ══
  _level2() {
    this._workersLeave(); this.districts[2].takeDamage(28); this._updateStats(-5,-8,0);
    this.time.delayedCall(1900,()=>{
      this._showPersistentMessage('The technology district has lost value.\nWhat does the city do?');
      this._showDecisionPanel([
        {icon:'🛡',label:'Cancel project',desc:'Stop work now,\nkeep the resources',value:'cancel',color:0x3a5f8a},
        {icon:'🏗',label:'Push through',desc:'Finish as planned,\naccept the dip',value:'continue',color:0x4aaa5c},
        {icon:'💰',label:'Invest more',desc:'Double down\non the district',value:'invest_more',color:0xddaa00},
        {icon:'⏳',label:'Pause & reassess',desc:'Halt work now,\ndecide again later',value:'wait',color:0x6b7a8d}
      ],(c)=>{
        ScoringEngine.recordDecision(2,c); this._clearPersistentMessage();
        const e={cancel:{d:[5,-10,10],m:'Resources secured.\nThe project rests. The city will not benefit if it recovers.'},
                 continue:{d:[0,5,-5],m:'The plan continues.\nThe city accepts short-term uncertainty.'},
                 invest_more:{d:[-5,12,-15],m:'The city doubles down.\nHigh stakes.'},
                 wait:{d:[-5,-5,0],m:'Construction stalls.\nResources are safe but idle. The cost of doing nothing.'}}[c]
                 ||{d:[0,5,-5],m:'The plan continues.'};
        this._updateStats(e.d[0],e.d[1],e.d[2]);
        if(c==='invest_more'){this.districts[2].receiveResource(1);this.cameras.main.shake(190,0.003);}
        else if(c==='cancel') this.districts[2].takeDamage(8);
        this._showConsequence(e.m,()=>this._nextLevel());
      });
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
    this._spawnResourceCubes(6);
    this._showPersistentMessage('The city receives 600 new credits.\nPlace all six cubes — 0 of 6 placed.');
    this._armLevel3Idle();
  }

  _spawnResourceCubes(n) {
    this.cubeTotal=n; this.cubeDropped=0;
    const sx=this.PANEL+this.s(50), gap=this.s(84);
    for(let i=0;i<n;i++) this.time.delayedCall(i*250,()=>this.cubes.push(new ResourceCube(this,sx+i*gap,this.H-this.s(70),1)));
  }

  // Nudges the player if they pause partway through placing cubes. This is
  // the "warning" — it is purely informational text, never a countdown and
  // never anything that forces a decision. The Continue button still only
  // appears after every cube is placed, regardless of how long that takes.
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
    if(this.currentLevel===3) ScoringEngine.recordDecision(3,'allocate',{districtId:district.id});
    this._updateStats(2,4,-3);
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

  _level3Outcome() {
    const loser=this.districts[Phaser.Math.Between(0,3)];
    loser.takeDamage(28); this.cameras.main.shake(330,0.004); this._updateStats(-5,-5,0);
    this._showConsequence('The '+loser.name+' district underperformed.\nHow much it hurt depended entirely\non how you spread your resources.',()=>this._nextLevel());
  }

  // ══ LEVEL 4 ══
  _level4() {
    this._showPersistentMessage('The city can build one of two facilities.\nThis decision will echo through the rest of the game.');
    this._showDecisionPanel([
      {icon:'🎪',label:'Festival Square',desc:'Happy citizens now.\nLittle long-term value.',value:'festival',color:0xe2a840},
      {icon:'🎓',label:'Research University',desc:'No reward for several levels.\nPowerful later.',value:'university',color:0x4ecdc4}
    ],(c)=>{
      ScoringEngine.recordDecision(4,c); this._clearPersistentMessage();
      if(c==='university'){
        this.hasUniversity=true; this._updateStats(0,0,-8);
        this._showConsequence('Construction begins quietly.\nNo result yet. The city waits.\nSomething is being built that may matter greatly later.',()=>this._nextLevel());
      } else {
        this._updateStats(18,0,0); this.districts[0].receiveResource(1);
        this._showConsequence('The square is built. Citizens celebrate today.\nThe city is happy — but only for now.',()=>this._nextLevel());
      }
    });
  }

  // ══ LEVEL 5 ══
  _level5() {
    const tech=this.districts[2];
    tech.receiveResource(4); this.time.delayedCall(500,()=>tech.receiveResource(3));
    for(let i=0;i<16;i++) this.time.delayedCall(i*170,()=>this._firework(tech.cx+Phaser.Math.Between(-95,95),tech.cy+Phaser.Math.Between(-95,10)));
    this._newsTicker(['📰 Technology District doubles in value!','📰 Experts: growth will continue — neighbouring cities moving in...']);
    this.time.delayedCall(1500,()=>{
      this.districts.forEach((d,i)=>{if(i!==2)this.tweens.add({targets:[d.gfx,d.animGfx],alpha:0.4,duration:900});});
      this.time.delayedCall(2100,()=>{
        this._showPersistentMessage('Technology is booming. Other districts suddenly look boring.\nWhat does the city do?');
        this._showDecisionPanel([
          {icon:'🚀',label:'All in',desc:'Move everything\nto technology',value:'all_in',color:0x9966cc},
          {icon:'➕',label:'Invest more',desc:'Increase exposure\nkeep some balance',value:'increase',color:0x4ecdc4},
          {icon:'⚖',label:'Stay diversified',desc:'Resist momentum\nhold the balance',value:'hold',color:0x4aaa5c},
          {icon:'📉',label:'Take profits',desc:'Reduce tech\nsecure gains',value:'reduce',color:0xe2a840}
        ],(c)=>{
          ScoringEngine.recordDecision(5,c); this._clearPersistentMessage();
          this.districts.forEach(d=>this.tweens.add({targets:[d.gfx,d.animGfx],alpha:1,duration:600}));
          const m={all_in:'Everything committed to technology.\nThe city feels unstoppable. For now.',
                   increase:'More technology in the mix.\nMomentum builds.',
                   hold:'The city watches from a balanced position.\nSome feel it is missing out.',
                   reduce:'Profits secured.\nThe city steps back from the excitement.'};
          if(c==='all_in'){tech.receiveResource(3);this._updateStats(5,15,-12);}
          else if(c==='increase'){tech.receiveResource(1);this._updateStats(3,8,-5);}
          else if(c==='hold') this._updateStats(2,4,0);
          else this._updateStats(0,-3,8);
          this._showConsequence(m[c]||m.hold,()=>this._nextLevel());
        });
      });
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

  // City-wide celebration burst — every district gets fireworks plus one big banner.
  // Used when a big shared "yes" moment happens (e.g. accepting the Level 6 delegation).
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

  // ══ LEVEL 6 — a delegation drives in from the neighbouring city ══
  _level6() {
    this._showPersistentMessage('A delegation is arriving from the neighbouring city...');
    this.roads.sendVisitor(()=>{
      this._level6Decide(false);
    });
  }

  _level6Decide(hasRead) {
    this._showPersistentMessage(hasRead
      ? 'You have the full picture. What does the city do?'
      : 'They offer to share their water infrastructure.\nWhat does the city do?');
    const opts=[
      {icon:'🤝',label:'Accept offer',desc:'200 resources now.\nSome dependency risk.',value:'accept',color:0x4ecdc4},
      {icon:'🏗',label:'Build own',desc:'400 resources.\nFull control.',value:'independent',color:0x4aaa5c},
      {icon:'❌',label:'Decline both',desc:'Keep resources\nfor other priorities.',value:'decline',color:0x6b7a8d}
    ];
    if (!hasRead) opts.push({icon:'🔍',label:'Research first',desc:'Gather more info\nbefore deciding.',value:'research',color:0xe2a840});
    this._showDecisionPanel(opts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(6,'research');
        this._reportModal('Delegation Report',
          'Their infrastructure is well maintained but ties your city to their maintenance schedule. Building independently costs more but removes any dependency. Declining keeps every option open for later.',
          ()=>{ this._updateStats(3,0,0); this.time.delayedCall(300,()=>this._level6Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(6,c,{afterResearch:hasRead});
      const m={accept:'The delegation drives into the city.\nShared infrastructure is established — and celebrated.',
               independent:'The delegation turns around and leaves.\nThe city builds its own — more expensive, fully controlled.',
               decline:'The delegation turns around and leaves.\nResources are preserved for other priorities.'};
      const dl={accept:[-8,5,-8],independent:[-5,8,-15],decline:[0,0,5]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='accept'){
        this.roads.visitorAccept(this.districts[0], ()=>{ this.districts[0].receiveResource(1); this._celebrateCity('🎉 Partnership Celebrated!'); });
      } else {
        this.roads.visitorDecline(); if(c==='independent') this.districts[0].receiveResource(1);
      }
      this._showConsequence(m[c]||m.decline,()=>this._nextLevel());
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
      {icon:'📤',label:'Sell tech',desc:'Act immediately.',value:'sell',color:0xe74c3c},
      {icon:'⬇',label:'Reduce',desc:'Cautious middle path.',value:'reduce',color:0xe2a840},
      {icon:'🔒',label:'Hold steady',desc:'Ignore headlines.',value:'hold',color:0x4aaa5c},
      {icon:'📈',label:'Invest more',desc:'Buy into the dip.',value:'invest_more',color:0x9966cc}
    ];
    if (!hasRead) opts.push({icon:'📋',label:'Read report',desc:'Free — gather facts\nthen still decide.',value:'research',color:0x5c8ab0});
    this._showDecisionPanel(opts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(7,'research');
        this._reportModal('Full Situation Report',
          'Experts are divided. The warning relates to short-term uncertainty. Long-term demand projections remain unclear. The available evidence comes from cities with significantly different circumstances.',
          ()=>{ this._updateStats(3,0,0); this.time.delayedCall(300,()=>this._level7Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(7,c,{afterResearch:hasRead});
      const m={sell:'The technology district is sold.\nResources protected from further decline.',
               reduce:'Exposure reduced.\nThe city retains some technology interest.',
               hold:'The city holds its position.\nTime will tell whether the headlines were right.',
               invest_more:'The city buys into the dip.\nA confident bet against the headlines.'};
      const dl={sell:[-5,-12,12],reduce:[-2,-5,5],hold:[2,0,0],invest_more:[-3,10,-15]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='sell') this.districts[2].takeDamage(15);
      if(c==='invest_more') this.districts[2].receiveResource(2);
      this._showConsequence(m[c]||m.hold,()=>this._nextLevel());
    });
  }

  // ══ LEVEL 8 ══
  _level8() {
    this.weather.startStorm(()=>{
      this.districts.forEach(d=>{d.setStorm(true);d.takeDamage(26);});
      this._updateStats(-15,-20,-10); this.cameras.main.shake(900,0.012);
      // The university reveal (when it exists) now gets its own slow,
      // separate fade — it used to overlap with the decision panel
      // appearing right on top of it. It now fully fades out before
      // anything else shows.
      const UNI_START=2000, UNI_FADE=1500, UNI_HOLD=6000;
      const UNI_END = UNI_START + UNI_FADE + UNI_HOLD + UNI_FADE;
      if(this.hasUniversity){
        this.time.delayedCall(UNI_START,()=>{
          this._tempMessage('The Research University opens its doors.\nGraduates create companies. Income rises. Your patience pays off.',UNI_HOLD,UNI_FADE);
          this.districts[0].receiveResource(2); this.districts[1].receiveResource(1);
          this._updateStats(10,15,0);
        });
      }
      this.time.delayedCall(this.hasUniversity?(UNI_END+600):3900,()=>{
        this._showPersistentMessage('An economic storm hits every city.\nYou cannot prevent it. What do you protect?');
        this._showDecisionPanel([
          {icon:'🏃',label:'Sell all',desc:'Protect remaining\nresources.',value:'sell_all',color:0xe74c3c},
          {icon:'🏛',label:'Protect essentials',desc:'Shield critical services.\nHold the plan.',value:'hold',color:0x4aaa5c},
          {icon:'⚖',label:'Rebalance',desc:'Restructure\nthoughtfully.',value:'rebalance',color:0x4ecdc4},
          {icon:'📈',label:'Buy the dip',desc:'Invest selectively\nwhile low.',value:'opportunistic',color:0xe2a840}
        ],(c)=>{
          ScoringEngine.recordDecision(8,c); this._clearPersistentMessage();
          this.weather.stopStorm(1000);
          this.time.delayedCall(1700,()=>{
            this.districts.forEach(d=>d.setStorm(false));
            this.weather.startRecovery(()=>{ this.districts.forEach(d=>d.receiveResource(1)); this._updateStats(8,12,5); });
            const m={sell_all:'Resources secured.\nThe city stops building and waits for calmer times.',
                     hold:'The plan holds.\nThe city weathers the storm with its structure intact.',
                     rebalance:'A more resilient structure emerges.\nThe city reorganises thoughtfully.',
                     opportunistic:'The city invests carefully during the downturn.\nIf recovery comes, these decisions will matter.'};
            const dl={sell_all:[-5,-15,15],hold:[5,0,-5],rebalance:[5,8,-5],opportunistic:[3,12,-10]}[c]||[0,0,0];
            this._updateStats(dl[0],dl[1],dl[2]);
            // Final level: same clickable Continue flow as every other level —
            // the player decides when to move on to their result, rather than
            // it advancing automatically.
            this._showConsequence(m[c]||m.hold,()=>this._finish());
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
    const ov=this.add.graphics().setDepth(90); ov.fillStyle(0x000000,0.7); ov.fillRect(0,0,W,H);
    const bw=Math.min(this.s(560),W-this.s(80)), bh=this.s(250), bx=(W-bw)/2, by=(H-bh)/2;
    const box=this.add.graphics().setDepth(91);
    box.fillStyle(0x08121f,0.99); box.fillRoundedRect(bx,by,bw,bh,this.s(14));
    box.lineStyle(1,0xe2a840,0.55); box.strokeRoundedRect(bx,by,bw,bh,this.s(14));
    const t=this.add.text(W/2,by+this.s(34),title,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(19),color:'#e2a840'}).setOrigin(0.5).setDepth(92);
    const b=this.add.text(W/2,by+this.s(90),text,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(15),color:'#b8cde0',
      wordWrap:{width:bw-this.s(70)},align:'center',lineSpacing:this.s(6)}).setOrigin(0.5).setDepth(92);
    const btn=this.add.text(W/2,by+bh-this.s(36),'Continue →',{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),color:'#f0c060'})
      .setOrigin(0.5).setDepth(92).setInteractive({useHandCursor:true});
    btn.on('pointerover',()=>btn.setColor('#ffe090')); btn.on('pointerout',()=>btn.setColor('#f0c060'));
    btn.on('pointerdown',()=>{ov.destroy();box.destroy();t.destroy();b.destroy();btn.destroy();if(cb)cb();});
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

  // fadeDur lets specific callers (e.g. the Level 8 university reveal) use a
  // slower, gentler fade than the default so it doesn't visually collide
  // with whatever appears right after it.
  _tempMessage(text,dur,fadeDur){
    fadeDur = fadeDur || 1000;
    const m=this.add.text(this._cx(),this.H-this.s(120),text,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),color:'#e2a840',
      align:'center',backgroundColor:'#040a14',padding:{x:this.s(20),y:this.s(12)},lineSpacing:this.s(5)
    }).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.tweens.add({targets:m,alpha:1,y:this.H-this.s(128),duration:fadeDur,hold:dur||5000,yoyo:true,onComplete:()=>m.destroy()});
  }

  // opts.auto: skip the clickable World Button entirely and auto-advance
  // after opts.autoDelay ms. Currently unused (Level 8 was reverted back to
  // the standard clickable flow), but left in place in case a future level
  // wants a no-click ending.
  _showConsequence(text,onContinue,opts){
    opts = opts || {};
    // Clearing any existing world button/timer here (not just on level
    // transitions) is what stops Continue buttons from stacking if this
    // method is ever called again before a previous button's callback fired.
    this._clearWorldBtn();
    this._clearConsequence(); this._clearDecisionPanel();
    const cx=this._cx();
    const pw=Math.min(this.s(720),this._availW()), ph=this.s(104), px=cx-pw/2, py=this.H-this.s(186);

    // The whole screen goes almost completely dark behind the consequence
    // box and Continue button — a clean, unambiguous "this step is over"
    // beat rather than a partial dim with the scene still visibly going.
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

    // The button itself is created after a short delay so it doesn't appear
    // instantly on top of the consequence text. That delay is tracked so it
    // can be cancelled if the level changes before it fires.
    this.worldBtnTimer = this.time.delayedCall(1100,()=>{
      this.worldBtnTimer=null;
      const lbl=(typeof currentLang!=='undefined'&&currentLang==='de')?'Weiter →':'Continue →';
      this.worldBtn=new WorldButton(this,cx,this.H-this.s(262),lbl,()=>{this.worldBtn=null;if(onContinue)onContinue();});
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

  _updateStats(h,d,r){
    this.cityStats.happiness=Math.max(5,Math.min(100,this.cityStats.happiness+h));
    this.cityStats.development=Math.max(5,Math.min(100,this.cityStats.development+d));
    this.cityStats.resources=Math.max(5,Math.min(100,this.cityStats.resources+r));
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.hud.advanceYear(2);
  }

  update(time,delta){
    const night=this.ambient.isNightTime();
    this.ambient.update(time,delta);
    this.weather.update(delta);
    this.roads.update(delta,night);
    this.districts.forEach(d=>d.update(time,delta));
  }
}
