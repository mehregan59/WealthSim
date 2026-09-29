class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.isCompact = this.W < 700;
    this.S = this.isCompact
      ? Math.max(0.54, Math.min(0.72, this.W / 620))
      : Math.max(0.85, Math.min(1.35, Math.min(this.H / 720, this.W / 1080)));
    this.PANEL = this.isCompact ? 0 : Math.round(Math.min(286, Math.max(244, this.W * 0.18)));
    this.cityName = (window.cityName && String(window.cityName).trim()) ||
      (window.cityName = ['Lindenfeld','Auenstadt','Sonnenberg','Rheinhafen','Wiesental','Neuhafen'][Math.floor(Math.random()*6)]);

    // Honoured across the scene: decorative motion is reduced, but every
    // consequence still shows as text, so no information is lost.
    this.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const groundY = this.isCompact ? Math.round(this.H * 0.29) : this.s(352);
    this.groundY = groundY; // used to clamp the city boundary so it never rises into the sky
    // One continuous drawn metropolis fills the whole canvas: river, bridges,
    // boulevards, rail line and city blocks. Every quarter is part of it.
    this.hasPanorama = false;
    this.hasMetro = true;



    this.ambient = new AmbientSystem(this);
    this.weather = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);
    this.tutorial = new Tutorial(this);

    this.cityStats = { happiness:60, development:40, resources:80 };
    this.currentLevel = 0;
    this.cubes = []; this.cubeTotal = 0; this.cubeDropped = 0;
    this.decisionPanel = null; this.worldBtn = null; this.worldBtnTimer = null;
    this.consequencePanel = null; this.persistentMsg = null; this.dropFeedback = null; this.dropFeedbackTimer = null;
    this.hasUniversity = false; this.siteMarkers = [];
    this.tickerActive = false;
    this.snapshots = {};          // for undo
    this._panelIntroShown = false;
    this._level3IdleTimer = null;

    this.metro = new Metropolis(this);
    this._buildDistricts();

    this.roads = new RoadNetwork(this, this.districts);
    this.hud = new HUD(this);
    this.statsPanel = new StatsPanel(this);
    if(this.isCompact) this.statsPanel.container.setVisible(false);
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,0);

    this.input.keyboard.on('keydown-P', () => this._toProfile());
    // A restarted scene can retain its local emitter. Replace this listener
    // rather than stacking another copy, otherwise one cube can be counted
    // several times and Level 3 appears to skip straight to its outcome.
    this.events.removeAllListeners('resourceDropped');
    this.events.on('resourceDropped', ({district,value,cube}) => this._onResourceDropped(district,value,cube));
    this._introSequence();
  }

  s(v){ return Math.round(v * this.S); }
  // Camera shake is decoration: skipped entirely when the player's system
  // asks for reduced motion. The text of every consequence is unaffected.
  _shake(d,i){ if(!this.reducedMotion && this.cameras && this.cameras.main) this.cameras.main.shake(d,i); }
  _cx(){ return this.PANEL + (this.W - this.PANEL)/2; }
  _availW(){ return this.W - this.PANEL - this.s(60); }

  _buildDistricts() {
    // Extra margin off both the panel and the right edge of the screen,
    // and Housing/Energy pulled ~20% closer to their inner neighbours
    // (Transport/Technology) instead of sitting right at the outer bounds.
    const L = this.PANEL + this.s(132);
    const R = this.W - this.s(128);
    const span = R - L;
    const px = f => Math.round(L + span * f);
    const baseY = this.isCompact ? Math.round(this.H*0.53) : Math.round(Math.max(this.s(482),Math.min(this.H*0.46,this.H-this.s(420))));
    const compactPoints = this.isCompact ? [
      {x:this.W*.27,y:baseY}, {x:this.W*.72,y:baseY-this.s(22)},
      {x:this.W*.28,y:baseY+this.s(225)}, {x:this.W*.72,y:baseY+this.s(203)}
    ] : null;
    // Each quarter is anchored to its place in the one continuous city: the
    // old town on the west bank, the terminal on the north avenue, the office
    // quarter to the south-east, the hills with wind and solar to the north-east.
    const metroPoints = (this.metro && !this.isCompact)
      ? this.metro.districtPoints.map(p => ({x:p.x, y:p.y}))
      : null;

    const pts = metroPoints || compactPoints;

    const at=(index,f,y)=>pts ? {cx:pts[index].x,cy:pts[index].y} : {cx:px(f),cy:y};
    const p0=at(0,.12,baseY+this.s(18)),p1=at(1,.38,baseY-this.s(34));
    const p2=at(2,.62,baseY-this.s(34)),p3=at(3,.88,baseY+this.s(18));

    // Warmer, clearly distinct district palette: housing coral/cream,
    // transport blue/teal, technology violet, energy amber. Icons and text
    // labels carry the same meaning for anyone who cannot rely on colour.
    this.districts = [
      new District(this, {id:'housing',name:'Housing',nameDE:'Wohnviertel',label:'Housing District',labelDE:'Wohnviertel',
        color:0xc96b4b,darkColor:0x6f9c62,accentColor:0xd87c5c,cx:p0.cx,cy:p0.cy,health:45,scale:this.S*1.16,
        tooltip:'Stable homes for citizens.\nLow risk, steady growth.\nLike bonds in a portfolio.',
        tooltipDE:'Stabile Häuser für Bürger.\nGeringes Risiko, stetiges Wachstum.'}),
      new District(this, {id:'transport',name:'Transport',nameDE:'Verkehrsviertel',label:'Transport District',labelDE:'Verkehrsviertel',
        color:0x4f8fa0,darkColor:0x6f9c62,accentColor:0x4f9aa4,cx:p1.cx,cy:p1.cy,health:45,scale:this.S*1.16,
        tooltip:'Roads and transit connect the city.\nModerate risk, reliable returns.',
        tooltipDE:'Straßen verbinden die Stadt.\nModerates Risiko, zuverlässige Erträge.'}),
      new District(this, {id:'technology',name:'Technology',nameDE:'Technologieviertel',label:'Technology District',labelDE:'Technologieviertel',
        color:0x557b89,darkColor:0x6f9c62,accentColor:0x296b72,cx:p2.cx,cy:p2.cy,health:45,scale:this.S*1.16,labelLift:46,
        tooltip:'High growth potential.\nHigh uncertainty.\nCan double — or fall sharply.',
        tooltipDE:'Hohes Wachstumspotenzial.\nHohe Unsicherheit.'}),
      new District(this, {id:'energy',name:'Energy',nameDE:'Energieviertel',label:'Energy District',labelDE:'Energieviertel',
        color:0xe0a82e,darkColor:0x6f9c62,accentColor:0xe0a82e,cx:p3.cx,cy:p3.cy,health:45,scale:this.S*1.16,
        tooltip:'Wind and solar power the city.\nEssential infrastructure.',
        tooltipDE:'Wind und Solar versorgen die Stadt.'})
    ];

  }

  // One boundary drawn around all four districts. The name lives in the
  // HUD next to the year instead of on the ground.
  //
  // Containment is verified explicitly (point-in-polygon against each
  // district's approximate footprint, growing the shape until it passes)
  // rather than trusted from ellipse geometry — see history in git log for
  // why. That growth loop can push the shape's top edge above the
  // sky/ground horizon, so every rendered point is clamped to never rise
  // above groundY: the line stays entirely on the land, never arcing into
  // the sky, even if that flattens part of the top edge onto the horizon.
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

    // Clamp every rendered point (outer and inner ring) so nothing crosses
    // above the horizon into the sky — flattens the top edge onto the
    // ground line instead of letting it arc upward.
    const clampGround = pts => pts.map(p => ({ x:p.x, y: Math.max(p.y, groundY) }));
    ring = clampGround(ring);
    const inner = clampGround(buildRing(rx, ry, 0.94));

    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(CityTheme.colors.cream, 0.08);
    g.beginPath();
    g.moveTo(ring[0].x, ring[0].y);
    for (let i=1;i<=N;i++){ const p=ring[i%N]; g.lineTo(p.x,p.y); }
    g.closePath(); g.fillPath();
    g.lineStyle(this.s(2.4), CityTheme.colors.teal, 0.28);
    g.strokePath();

    // A faint second, smaller ring just inside the border — reads like a
    // coastline/contour line rather than a single flat outline.
    g.lineStyle(1, CityTheme.colors.cream, 0.42);
    g.beginPath();
    g.moveTo(inner[0].x, inner[0].y);
    for (let i=1;i<=N;i++){ const p=inner[i%N]; g.lineTo(p.x,p.y); }
    g.closePath(); g.strokePath();
  }

  _introSequence() {
    const fi=this.add.graphics().setDepth(200);
    fi.fillStyle(CityTheme.colors.sky,1); fi.fillRect(0,0,this.W,this.H);
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const cx=this.W/2, cy=this.H/2, cardW=Math.min(this.s(520),this.W-this.s(56)), cardH=this.s(142);
    const card=this.add.graphics().setDepth(201).setAlpha(0);
    card.fillStyle(0xfffbf1,.98); card.fillRoundedRect(cx-cardW/2,cy-cardH/2,cardW,cardH,this.s(12));
    card.lineStyle(this.s(2),CityTheme.colors.teal,.72); card.strokeRoundedRect(cx-cardW/2,cy-cardH/2,cardW,cardH,this.s(12));
    const city=this.add.text(cx,cy-this.s(27),this.cityName,{
      fontFamily:CityTheme.heading,fontSize:this.s(30),color:'#173b40',fontStyle:'700'
    }).setOrigin(.5).setDepth(202).setAlpha(0);
    const level=this.add.text(cx,cy+this.s(25),de?'Die erste Gelegenheit':'The First Opportunity',{
      fontFamily:CityTheme.body,fontSize:this.s(18),color:'#296b72',fontStyle:'600'
    }).setOrigin(.5).setDepth(202).setAlpha(0);
    this.tweens.add({
      targets:[card,city,level],alpha:1,duration:360,delay:260,hold:900,yoyo:true,
      onComplete:()=>{ card.destroy(); city.destroy(); level.destroy(); fi.destroy(); this._introLevelTitleShown=true; this._startLevel(1); }
    });
  }

  // Save state so a level can be replayed from scratch
  _saveSnapshot(n) {
    this.snapshots[n] = {
      stats: Object.assign({}, this.cityStats),
      health: this.districts.map(d=>d.health),
      resources: this.districts.map(d=>d.resources),
      capacity: this.districts.map(d=>d.visualCapacity),
      hasUniversity: this.hasUniversity,
      year: this.hud.year,
      decisions: ScoringEngine.decisions.length
    };
  }

  _restoreSnapshot(n) {
    const s = this.snapshots[n];
    if (!s) return false;
    this.cityStats = Object.assign({}, s.stats);
    this.districts.forEach((d,i)=>{ d.health = s.health[i]; d.resources=(s.resources||[])[i]||0; d.visualCapacity=(s.capacity||[])[i]||0; d.draw(); d.labelContainer.y = d.labelBaseY - (d.health/100)*this.s(24); });
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
    const map={1:this._level1,2:this._level2,3:this._level3,4:this._level4,5:this._level5,6:this._level6,7:this._level7,8:this._level8,9:this._level9,10:this._level10};
    const fn=map[n]; if(!fn)return;
    this.hud.setLevel(n,this._levelName(n));
    if(this.ambient)this.ambient.setSimulationLevel(n);
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
    else {
      const titleAlreadyShown = n===1 && this._introLevelTitleShown;
      if(titleAlreadyShown)this._introLevelTitleShown=false;
      if(!titleAlreadyShown)this.hud.showLevelTitle(n,this._levelName(n));
      this.time.delayedCall(titleAlreadyShown?180:720, ()=> this.tutorial.show(n, proceed));
    }
  }

  _retryLevel() {
    const n = this.currentLevel;
    this._clearDecisionPanel(); this._clearConsequence(); this._clearWorldBtn();
    this._clearPersistentMessage(); this._clearSiteMarkers(); this._clearCubes();
    this._clearLevel3Idle();
    this._restoreSnapshot(n);
    this.time.delayedCall(250, ()=>this._startLevel(n, true));
  }

  _levelName(n){return {1:'The First Opportunity',2:'The Unexpected Setback',3:'Expansion',4:'Today or Tomorrow',5:'The Boom',6:'The Outside Offer',7:'Breaking News',8:'The Great Storm',9:'The Project Review',10:'The Planning Desk'}[n]||'Level '+n;}

  _nextLevel(){
    this._clearConsequence(); this._clearWorldBtn(); this._clearLevel3Idle();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,this.currentLevel);
    const next=this.currentLevel+1;
    if(next<=10) this._startLevel(next);
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
    this._showPersistentMessage('Tap one of the districts below to start growing your city.');
  }

  _choiceLabel(x,y,text,color) {
    const c=this.add.container(x,y).setDepth(14);
    const t=this.add.text(0,0,text,{fontFamily:CityTheme.body,fontSize:this.s(14),color:'#173b40',fontStyle:'700'}).setOrigin(0.5);
    const w=t.width+this.s(24), h=this.s(28);
    const bg=this.add.graphics();
    bg.fillStyle(0x10282a,0.25); bg.fillRoundedRect(-w/2+this.s(2),-h/2+this.s(3),w,h,h/2);
    bg.fillStyle(0xfffbf1,0.98); bg.fillRoundedRect(-w/2,-h/2,w,h,h/2);
    bg.lineStyle(this.s(1.6),color,0.95); bg.strokeRoundedRect(-w/2,-h/2,w,h,h/2);
    c.add([bg,t]); c.setAlpha(0); c.setScale(0.8);
    this.tweens.add({targets:c,alpha:1,scaleX:1,scaleY:1,duration:400,ease:'Back.easeOut'});
    this.tweens.add({targets:c,y:y+this.s(4),duration:1500,yoyo:true,repeat:-1,ease:'Sine.easeInOut',delay:400});
    return c;
  }

  _clearSiteMarkers(){
    if(this.siteMarkers){ this.siteMarkers.forEach(m=>{try{this.tweens.killTweensOf(m);m.destroy();}catch(e){}}); this.siteMarkers=[]; }
  }

  // A permanent mark on the map for something the player chose to build.
  // Unlike site markers these are never cleared between levels: the city
  // keeps a visible record of past decisions. Neutral styling on purpose —
  // a landmark must never signal that a choice was the "right" one.
  _addLandmark(district, icon, text, color) {
    if(!this.landmarks) this.landmarks=[];
    const y = district.subLabelY() + this.s(22) * this.landmarks.filter(l=>l._districtId===district.id).length;
    const c=this.add.container(district.cx, y).setDepth(14);
    const t=this.add.text(0,0,icon+'  '+text,{fontFamily:CityTheme.body,fontSize:this.s(11),color:'#173b40'}).setOrigin(0.5);
    const w=t.width+this.s(18), h=this.s(21);
    const bg=this.add.graphics();
    bg.fillStyle(0xfffbf1,0.96); bg.fillRoundedRect(-w/2,-h/2,w,h,h/2);
    bg.lineStyle(1,color||0x8aa4c0,0.85); bg.strokeRoundedRect(-w/2,-h/2,w,h,h/2);
    c.add([bg,t]); c._districtId=district.id;
    c.setAlpha(0); this.tweens.add({targets:c,alpha:1,duration:500});
    this.landmarks.push(c);
    return c;
  }


  _onLevel1Choice(d,v) {
    this._clearSiteMarkers(); this._clearPersistentMessage();
    this.districts.forEach(x=>x.setSelectable(false));
    ScoringEngine.recordDecision(1,v,{districtId:d.id});
    d.receiveResource(2); this._shake(240,0.004); this._updateStats(5,10,-5);
    this._addLandmark(d,'\uD83C\uDFD7','Built first here', d.accentColor);
    const m={safe:'Construction begins carefully.\nThe city grows slowly but steadily.',
             balanced:'A balanced approach takes shape.\nThe city moves forward with measured confidence.',
             aggressive:'Cranes rise. Citizens are excited.\nResults will take time to appear.'};
    this._showConsequence(m[v]||m.balanced, ()=>this._nextLevel());
  }

  // ══ LEVEL 2 ══
  // Two beats. Beat A: the technology district drops on a vague, alarming
  // headline with no real information behind it — pure noise — and then
  // recovers on its own. Beat B: the transport district drops with clear
  // bad fundamentals (its main employer is leaving for good) — real news —
  // and does NOT recover. Beat A measures loss aversion; comparing how the
  // player treated A versus B measures whether they can tell a temporary
  // dip from genuine bad news.
  _level2() {
    this._workersLeave(); this.districts[2].takeDamage(28); this._updateStats(-5,-8,0);
    this.time.delayedCall(1900,()=>{
      this._showPersistentMessage('The technology district has lost value.\nHeadlines are alarming, but nothing concrete has changed.\nWhat does the city do?');
      this._showDecisionPanel([
        {icon:'🛡',label:'Cancel project',desc:'Stop work now,\nkeep the resources',value:'cancel',color:0x3a5f8a},
        {icon:'🏗',label:'Push through',desc:'Finish as planned,\naccept the dip',value:'continue',color:0x4aaa5c},
        {icon:'💰',label:'Invest more',desc:'Double down\non the district',value:'invest_more',color:0xddaa00},
        {icon:'⏳',label:'Pause & reassess',desc:'Halt work now,\ndecide again later',value:'wait',color:0x6b7a8d}
      ],(c)=>{
        ScoringEngine.recordDecision(2,c,{phase:'dip'}); this._clearPersistentMessage();
        const e={cancel:{d:[5,-10,10],m:'Resources secured.\nThe project rests. The city will not benefit if it recovers.'},
                 continue:{d:[0,5,-5],m:'The plan continues.\nThe city accepts short-term uncertainty.'},
                 invest_more:{d:[-5,12,-15],m:'The city doubles down.\nHigh stakes.'},
                 wait:{d:[-5,-5,0],m:'Construction stalls.\nResources are safe but idle. The cost of doing nothing.'}}[c]
                 ||{d:[0,5,-5],m:'The plan continues.'};
        this._updateStats(e.d[0],e.d[1],e.d[2]);
        if(c==='invest_more'){this.districts[2].receiveResource(1);this._shake(190,0.003);}
        else if(c==='cancel') this.districts[2].takeDamage(8);
        this._showConsequence(e.m,()=>this._level2Recovery(c));
      });
    });
  }

  // Beat A resolution: the dip was noise. The district recovers on its own,
  // whatever the player did — but panicking cost resources for nothing.
  _level2Recovery(choice) {
    this.districts[2].receiveResource(3);
    const m={cancel:'Weeks later: the scare blows over.\nThe district recovers — without the city. The cancelled project stays cancelled.',
             continue:'Weeks later: the scare blows over.\nThe district recovers. Staying the course paid off.',
             invest_more:'Weeks later: the scare blows over.\nThe district recovers — and the extra investment pays off handsomely.',
             wait:'Weeks later: the scare blows over.\nThe district recovers. The pause cost time, but nothing else.'}[choice]
             ||'Weeks later: the scare blows over.\nThe district recovers.';
    if(choice==='cancel') this._updateStats(-5,0,0);
    else if(choice==='invest_more') this._updateStats(5,8,0);
    else if(choice==='continue') this._updateStats(3,5,0);
    this._showConsequence(m,()=>this._level2News());
  }

  // Beat B: a second drop, this time with clear bad fundamentals. The
  // transport district's main employer is leaving for good. Holding or
  // doubling down is costly here; cutting losses is the reasonable move.
  _level2News() {
    this.time.delayedCall(1200,()=>{
      this.districts[1].takeDamage(30); this._updateStats(-5,-8,0);
      this._shake(200,0.003);
      this.time.delayedCall(1600,()=>{
        this._showPersistentMessage('Now the transport district is falling.\nThis time there is real news: its largest employer\nis leaving the city for good. What does the city do?');
        this._showDecisionPanel([
          {icon:'🛡',label:'Cut losses',desc:'Sell the district assets\nbefore it gets worse',value:'cancel',color:0x3a5f8a},
          {icon:'🏗',label:'Hold on',desc:'Keep everything,\nhope it turns around',value:'continue',color:0x4aaa5c},
          {icon:'💰',label:'Invest more',desc:'Double down\non the district',value:'invest_more',color:0xddaa00},
          {icon:'⏳',label:'Pause & reassess',desc:'Halt work now,\ndecide again later',value:'wait',color:0x6b7a8d}
        ],(c)=>{
          ScoringEngine.recordDecision(2,c,{phase:'news'}); this._clearPersistentMessage();
          const e={cancel:{d:[5,-5,5],m:'The city exits in time.\nThe district keeps declining, but the resources were saved.'},
                   continue:{d:[-8,-12,0],m:'The city holds on.\nThe district keeps declining. Hope is not a strategy.'},
                   invest_more:{d:[-12,-15,-10],m:'The city doubles down on a shrinking district.\nThe extra resources sink with it.'},
                   wait:{d:[-3,-6,0],m:'The city waits.\nThe district keeps declining while decisions are postponed.'}}[c]
                   ||{d:[-8,-12,0],m:'The city holds on.\nThe district keeps declining.'};
          this._updateStats(e.d[0],e.d[1],e.d[2]);
          if(c==='invest_more'){this.districts[1].takeDamage(10);this._shake(190,0.003);}
          else if(c==='continue') this.districts[1].takeDamage(6);
          this._showConsequence(e.m,()=>this._nextLevel());
        });
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
    this._level3PlacedCubes = new Set();
    this._level3Resolved = false;
    this._spawnResourceCubes(6);
    // Accessibility: dragging is not the only way through this level.
    // Tapping a district sends the next waiting cube there, so the level
    // is completable with a single tap per cube on touch screens too.
    this.districts.forEach(d=>d.setSelectable(true,(dd)=>this._tapAllocate(dd)));
    this._showPersistentMessage('600 new credits\nDrop each coin on the centre of a district,\nor tap a district to send the next coin.\n0 of 6 placed.',{corner:true});
    this._armLevel3Idle();
  }

  _tapAllocate(district) {
    if(this.currentLevel!==3 || this._level3Resolved) return;
    const cube=(this.cubes||[]).find(c=>c && !c._used && !c.isDragging && c.container && c.container.active);
    if(cube) cube._dropOnDistrict(district);
  }


  _spawnResourceCubes(n) {
    this.cubeTotal=n; this.cubeDropped=0;
    // Coins stack vertically beside the side panel, below the district signs, large and easy to grab.
    const x=this.PANEL+this.s(46), top=Math.max(this.s(400),this.H*0.44), gap=Math.min(this.s(66),(this.H-top-this.s(40))/n);
    for(let i=0;i<n;i++) this.time.delayedCall(i*70,()=>this.cubes.push(new ResourceCube(this,x,top+i*gap,1)));
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

  _onResourceDropped(district, value, cube) {
    if(this.currentLevel!==3 || this._level3Resolved) return;
    if(!this._level3PlacedCubes) this._level3PlacedCubes = new Set();
    if(!cube || this._level3PlacedCubes.has(cube)) return;
    this._level3PlacedCubes.add(cube);
    this.cubeDropped=this._level3PlacedCubes.size;
    ScoringEngine.recordDecision(3,'allocate',{districtId:district.id});
    this._updateStats(2,4,-3);
    if(this.cubeDropped < this.cubeTotal){
      this._showPersistentMessage('600 new credits\nDrop each coin on the centre of a district,\nor tap a district to send the next coin.\n'+this.cubeDropped+' of '+this.cubeTotal+' placed.',{corner:true});
      this._armLevel3Idle();
    } else {
      this._level3Resolved = true;
      this._clearLevel3Idle();
      this.districts.forEach(d=>d.setSelectable(false));
      // Exposure preview: the player sees where their money sits BEFORE
      // the random shock lands, so the outcome is understood, not guessed.
      const c={}; (ScoringEngine.decisions||[]).filter(d=>d.level===3).forEach(d=>{c[d.districtId]=(c[d.districtId]||0)+1;});
      const spread=Object.entries(c).map(([k,n])=>n*100+' in '+k).join(', ');
      this._showPersistentMessage('All six placed.\nYour credits: '+spread+'.\nNext year one unknown district will be hit.',{corner:true});
      this.time.delayedCall(2600,()=>{ this._clearPersistentMessage(); this._level3Outcome(); });
    }
  }

  _level3Outcome() {
    const loser=this.districts[Phaser.Math.Between(0,3)];
    // Loss is proportional to the credits actually placed in the shocked
    // district: each cube = 100 credits, the district falls 40%.
    const placed=(ScoringEngine.decisions||[]).filter(d=>d.level===3&&d.districtId===loser.id).length;
    const exposed=placed*100, lost=Math.round(exposed*0.4);
    const share=placed/(this.cubeTotal||6);
    loser.takeDamage(8+Math.round(40*share)); // visual damage scales with exposure
    this._shake(120+Math.round(400*share),0.002+0.006*share);
    this._updateStats(-Math.round(10*share),-Math.round(15*share),0);
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const nm=de?(loser.nameDE||loser.name):loser.name;
    const msg=de
      ? 'Das '+nm+'-Viertel fällt um 40 %.\nDu hattest '+exposed+' Credits dort \u2192 Verlust: '+lost+' Credits.'
      : 'The '+nm+' district fell 40%.\nYou had '+exposed+' credits there \u2192 you lost '+lost+' credits.';
    this._showConsequence(msg,()=>this._nextLevel());
  }


  // ══ LEVEL 4 ══
  // Beat A: an urgent repair. Spending cash on a genuine need is NOT
  // impatience — this beat (phase:'repair') adjusts RESILIENCE (+/-8) only, never the
  // patience score. Beat B (phase:'build') is the real delayed-reward test.
  _level4() {
    const housing=this.districts[0];
    housing.takeDamage(18);
    this._shake(180,0.003);
    this._showPersistentMessage('A water main has burst under the housing district.\nFamilies have no running water. The city has cash set aside.');
    this._showDecisionPanel([
      {icon:'🔧',label:'Repair it now',desc:'Uses reserve cash today.\nFixes the problem.',value:'repair_now',color:0x296b72},
      {icon:'⏳',label:'Postpone repair',desc:'Keep the cash for now.\nDeal with it later.',value:'defer',color:0xe2a840}
    ],(c)=>{
      ScoringEngine.recordDecision(4,c,{phase:'repair'}); this._clearPersistentMessage();
      if(c==='repair_now'){
        housing.receiveResource(2); this._updateStats(6,0,-6);
        this._showConsequence('The pipe is fixed within days.\nUsing savings for a real emergency is what savings are for.',()=>this._level4Build());
      } else {
        housing.takeDamage(12); this._updateStats(-10,0,0);
        this._showConsequence('The leak spreads. The repair now costs more than it would have.\nPostponing a real need is not the same as being patient.',()=>this._level4Build());
      }
    });
  }

  _level4Build() {
    this._showPersistentMessage('With the emergency behind it, the city can build one of two facilities.\nThis decision will echo through the rest of the game.');
    this._showDecisionPanel([
      {icon:'🎪',label:'Festival Square',desc:'Happy citizens now.\nLittle long-term value.',value:'festival',color:0xe2a840},
      {icon:'🎓',label:'Research University',desc:'No reward for several levels.\nPowerful later.',value:'university',color:0x296b72}
    ],(c)=>{
      ScoringEngine.recordDecision(4,c,{phase:'build'}); this._clearPersistentMessage();
      if(c==='university'){
        this.hasUniversity=true; this._updateStats(0,0,-8);
        this._addLandmark(this.districts[2],'\uD83C\uDFD7','University — under construction',0x296b72);
        this._showConsequence('Construction begins quietly.\nNo result yet. The city waits.\nSomething is being built that may matter greatly later.',()=>this._nextLevel());
      } else {
        this._updateStats(18,0,0); this.districts[0].receiveResource(1);
        this._addLandmark(this.districts[0],'\uD83C\uDFAA','Festival Square',0xe2a840);
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
          {icon:'➕',label:'Invest more',desc:'Increase exposure\nkeep some balance',value:'increase',color:0x296b72},
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
    this._shake(260,0.004);
    const banner=this.add.text(this._cx(),this.H*0.32,bannerText,{
      fontFamily:CityTheme.heading,fontSize:this.s(30),color:'#173b40',
      align:'center',stroke:'#3a2600',strokeThickness:this.s(3)
    }).setOrigin(0.5).setDepth(80).setAlpha(0).setScale(0.7);
    this.tweens.add({targets:banner,alpha:1,scaleX:1,scaleY:1,duration:500,ease:'Back.easeOut',hold:1600,yoyo:true,onComplete:()=>banner.destroy()});
  }

  // ══ LEVEL 6 — a delegation drives in from the neighbouring city ══
  _level6() {
    this._showPersistentMessage(this.metro?'A ship from the neighbouring city is sailing up the river with an investment offer...':'A delegation is arriving from the neighbouring city...');
    this.roads.sendVisitor(()=>{
      this._level6Decide(false);
    });
  }

  _level6Decide(hasRead) {
    this._showPersistentMessage(hasRead
      ? 'You have the full picture. What does the city do?'
      : 'They offer to share their water infrastructure.\nWhat does the city do?');
    const opts=[
      {icon:'🤝',label:'Accept offer',desc:'200 resources now.\nSome dependency risk.',value:'accept',color:0x296b72},
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
      const m={accept:(this.metro?'The offer ship sails up the river and docks.':'The delegation drives into the city.')+'\nShared infrastructure is established — and celebrated.',
               independent:(this.metro?'The ship sails back downstream.':'The delegation turns around and leaves.')+'\nThe city builds its own — more expensive, fully controlled.',
               decline:(this.metro?'The ship sails back downstream.':'The delegation turns around and leaves.')+'\nResources are preserved for other priorities.'};
      const dl={accept:[-8,5,-8],independent:[-5,8,-15],decline:[0,0,5]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='accept'){
        this._addLandmark(this.districts[1],'\uD83E\uDD1D','Shared infrastructure',0x62c4dd);
        this.roads.visitorAccept(this.districts[0], ()=>{ this.districts[0].receiveResource(1); this._celebrateCity('🎉 Partnership Celebrated!'); });
      } else {
        if(c==='independent') this._addLandmark(this.districts[1],'\uD83C\uDFD7','Own infrastructure',0x8aa4c0);
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
      this._updateStats(-15,-20,-10); this._shake(900,0.012);
      // The university reveal (when it exists) now gets its own slow,
      // separate fade — it used to overlap with the decision panel
      // appearing right on top of it. It now fully fades out before
      // anything else shows.
      const UNI_START=700, UNI_FADE=450, UNI_HOLD=2400;
      const UNI_END = UNI_START + UNI_FADE + UNI_HOLD + UNI_FADE;
      if(this.hasUniversity){
        this.time.delayedCall(UNI_START,()=>{
          this._tempMessage('The Research University opens its doors.\nGraduates create companies. Income rises. Your patience pays off.',UNI_HOLD,UNI_FADE);
          this.districts[0].receiveResource(2); this.districts[1].receiveResource(1);
          this._addLandmark(this.districts[2],'\uD83C\uDF93','University open',0x296b72);
          this._updateStats(10,15,0);
        });
      }
      this.time.delayedCall(this.hasUniversity?(UNI_END+250):1650,()=>{
        this._showPersistentMessage('An economic storm hits every city.\nYou cannot prevent it. What do you protect?');
        this._showDecisionPanel([
          {icon:'🏃',label:'Sell all',desc:'Protect remaining\nresources.',value:'sell_all',color:0xe74c3c},
          {icon:'🏛',label:'Protect essentials',desc:'Shield critical services.\nHold the plan.',value:'hold',color:0x4aaa5c},
          {icon:'⚖',label:'Rebalance',desc:'Restructure\nthoughtfully.',value:'rebalance',color:0x296b72},
          {icon:'📈',label:'Buy the dip',desc:'Invest selectively\nwhile low.',value:'opportunistic',color:0xe2a840}
        ],(c)=>{
          ScoringEngine.recordDecision(8,c); this._clearPersistentMessage();
          this.weather.stopStorm(250);
          this.time.delayedCall(700,()=>{
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
            this._showConsequence(m[c]||m.hold,()=>this._nextLevel());
          });
        });
      });
    });
  }

  // ══ LEVEL 9 — The Project Review (disposition effect) ══
  // Beat A: the city needs cash — sell a project that is up, or one that is
  // down? Both have the SAME outlook, so only the past price differs.
  // Beat B: two identical workshops, same future, bought at different prices.
  _level9() {
    this._showPersistentMessage('The city needs cash for next year\u2019s budget. It must sell one project.\nAnalysts rate both with exactly the same outlook from here.');
    this._showDecisionPanel([
      {icon:'\u2600',label:'Sell Solar Park',desc:'Bought for 400.\nNow worth 560 (+40%).',value:'sell_winner',color:0x4aaa5c},
      {icon:'🚏',label:'Sell Tram Line',desc:'Bought for 400.\nNow worth 280 (\u221230%).',value:'sell_loser',color:0xe2a840}
    ],(c)=>{
      ScoringEngine.recordDecision(9,c,{phase:'pair'}); this._clearPersistentMessage();
      this._updateStats(0,0,6);
      const m = c==='sell_winner'
        ? 'The Solar Park is sold and the gain feels good.\nThe Tram Line stays \u2014 its outlook is the same, but its loss is still on the books.'
        : 'The Tram Line is sold and the loss becomes real.\nThe Solar Park keeps working for the city.';
      this._showConsequence(m,()=>this._level9Twins());
    });
  }

  _level9Twins() {
    this._showPersistentMessage('Two identical workshops, same street, same future.\nThe city bought one early and cheap, the other later and expensive. One must go.');
    this._showDecisionPanel([
      {icon:'\uD83D\uDD28',label:'Sell Workshop A',desc:'Bought for 200.\nWorth 300 today.',value:'sell_gain',color:0x4aaa5c},
      {icon:'\uD83D\uDD28',label:'Sell Workshop B',desc:'Bought for 400.\nWorth 300 today.',value:'sell_loss',color:0xe2a840},
      {icon:'\u2696',label:'Either one',desc:'Same value, same future.\nThe price paid is history.',value:'either',color:0x5c8ab0}
    ],(c)=>{
      ScoringEngine.recordDecision(9,c,{phase:'twin'}); this._clearPersistentMessage();
      this._updateStats(0,2,4);
      this._showConsequence('Both workshops were worth 300 and had the same future.\nWhat the city once paid does not change what either will earn from here.',()=>this._nextLevel());
    });
  }

  // ══ LEVEL 10 — The Planning Desk (forecast calibration) ══
  _level10() {
    this._forecasts=[]; this._fcIndex=0;
    this._level10Ask();
  }

  _forecastOptions(){
    return [
      {icon:'\u2714',label:'Yes \u2014 very sure',desc:'90% confident',value:'y90',color:0x4aaa5c},
      {icon:'\u2713',label:'Yes \u2014 probably',desc:'65% confident',value:'y65',color:0x296b72},
      {icon:'\u2753',label:'No idea',desc:'50 / 50',value:'n50',color:0x6b7a8d},
      {icon:'\u2717',label:'No \u2014 probably',desc:'65% confident',value:'x65',color:0xe2a840},
      {icon:'\u2718',label:'No \u2014 very sure',desc:'90% confident',value:'x90',color:0xe74c3c}
    ];
  }
  _parseForecast(v){ return { pick: v==='n50'?null:v[0]==='y', conf: parseInt(v.slice(1),10) }; }

  _level10Ask() {
    const F=Assessment.FORECASTS, i=this._fcIndex;
    if (i>=F.length) return this._level10Reveal();
    this._showPersistentMessage('Forecast '+(i+1)+' of '+F.length+':\n'+F[i].q);
    this._showDecisionPanel(this._forecastOptions(),(v)=>{
      const f=this._parseForecast(v);
      ScoringEngine.recordDecision(10,v,{phase:'forecast',id:F[i].id,pick:f.pick,conf:f.conf,outcome:F[i].outcome});
      this._forecasts.push(Object.assign({outcome:F[i].outcome},f));
      this._clearPersistentMessage();
      this._fcIndex++;
      this.time.delayedCall(250,()=>this._level10Ask());
    });
  }

  _level10Reveal() {
    const r=Assessment.forecastResult(this._forecasts);
    this.hud.advanceYear(1);
    const lines=Assessment.FORECASTS.map((q,i)=>{
      const f=this._forecasts[i]; const ok=f.pick===null?'\u2013':(f.pick===q.outcome?'\u2714':'\u2718');
      return ok+'  '+q.q+'  \u2192 '+(q.outcome?'Yes':'No');
    }).join('\n');
    const summary='\n\nAverage confidence: '+Math.round(r.avgConf*100)+'%   \u00b7   Correct: '+Math.round(r.hitRate*100)+'%'
      +(r.gap>0.1?'\nYou were more confident than you were right.':r.gap<-0.1?'\nYou were right more often than you expected.':'\nYour confidence matched your accuracy closely.')
      +'\nFour forecasts describe this session, not your personality.';
    this._reportModal('How did the forecasts turn out?',lines+summary,()=>this._level10Practice());
  }

  _level10Practice() {
    const P=Assessment.PRACTICE;
    this._showPersistentMessage('One practice forecast, now that you have seen your results:\n'+P.q);
    this._showDecisionPanel(this._forecastOptions(),(v)=>{
      const f=this._parseForecast(v);
      ScoringEngine.recordDecision(10,v,{phase:'practice',id:P.id,pick:f.pick,conf:f.conf,outcome:P.outcome});
      this._clearPersistentMessage();
      const ok=f.pick===null?'You called it 50/50.':(f.pick===P.outcome?'You were right.':'You were wrong.');
      this._updateStats(2,4,0);
      this._showConsequence('The transport district did recover. '+ok+'\nGood forecasters are not always right \u2014 their confidence matches how often they are.',()=>this._finish());
    });
  }

  _finish() {
    this._clearConsequence(); this._clearWorldBtn();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,10);
    const ov=this.add.graphics().setDepth(190);
    const o={a:0};
    this.tweens.add({targets:o,a:1,duration:1800,
      onUpdate:()=>{ov.clear();ov.fillStyle(CityTheme.colors.cream,o.a);ov.fillRect(0,0,this.W,this.H);},
      onComplete:()=>this._toProfile()});
  }

  _newsTicker(lines){
    this.tickerActive = true;
    const top=this.s(44), h=this.s(36);
    const bg=this.add.graphics().setDepth(45);
    bg.fillStyle(0xfffbf1,0.97); bg.fillRect(0,top,this.W,h);
    bg.lineStyle(1,0xff4422,0.85); bg.lineBetween(0,top+h,this.W,top+h);
    const br=this.add.text(this.s(16),top+h/2,'BREAKING',{
       fontFamily:CityTheme.body,fontSize:this.s(12),color:'#c85848',fontStyle:'700',letterSpacing:2
    }).setOrigin(0,0.5).setDepth(46);
    const sep=this.add.graphics().setDepth(46);
     sep.fillStyle(0x7ca5a1,0.5); sep.fillRect(this.s(96),top+this.s(8),1,h-this.s(16));
    const tk=this.add.text(this.W+20,top+h/2,lines.join('   ★   '),{
      fontFamily:CityTheme.body,fontSize:this.s(14),color:'#173b40',fontStyle:'600'
    }).setOrigin(0,0.5).setDepth(46);
    const dur=Math.max(19200, tk.width*24);
    this.tweens.add({targets:tk,x:-(tk.width+120),duration:dur,ease:'Linear',
      onComplete:()=>{tk.destroy();bg.destroy();br.destroy();sep.destroy();this.tickerActive=false;}});
  }

  _reportModal(title,text,cb){
    const W=this.W,H=this.H;
    const ov=this.add.graphics().setDepth(90); ov.fillStyle(0x000000,0.7); ov.fillRect(0,0,W,H);
    const bw=Math.min(this.s(620),W-this.s(80));
    const b=this.add.text(W/2,0,text,{
      fontFamily:CityTheme.body,fontSize:this.s(15),color:'#365d60',
      wordWrap:{width:bw-this.s(70)},align:'center',lineSpacing:this.s(6)}).setOrigin(0.5,0).setDepth(92);
    const bh=Math.max(this.s(250), b.height+this.s(150)), bx=(W-bw)/2, by=(H-bh)/2;
    b.setY(by+this.s(66));
    const box=this.add.graphics().setDepth(91);
    box.fillStyle(0xfffbf1,0.99); box.fillRoundedRect(bx,by,bw,bh,this.s(14));
    box.lineStyle(1,0xe2a840,0.55); box.strokeRoundedRect(bx,by,bw,bh,this.s(14));
    const t=this.add.text(W/2,by+this.s(34),title,{
      fontFamily:CityTheme.heading,fontSize:this.s(19),color:'#296b72'}).setOrigin(0.5).setDepth(92);
    const btn=this.add.text(W/2,by+bh-this.s(36),'Continue \u2192',{
      fontFamily:CityTheme.heading,fontSize:this.s(17),color:'#296b72',backgroundColor:'#e0a82e',padding:{x:this.s(18),y:this.s(8)}})
      .setOrigin(0.5).setDepth(92).setInteractive({useHandCursor:true});
    btn.on('pointerover',()=>btn.setColor('#173b40')); btn.on('pointerout',()=>btn.setColor('#296b72'));
    btn.on('pointerdown',()=>{ov.destroy();box.destroy();t.destroy();b.destroy();btn.destroy();if(cb)cb();});
  }

  _msgY(){ return this.tickerActive ? this.s(134) : this.s(92); }

  _showPersistentMessage(text,opts){
    this._clearPersistentMessage();
    opts=opts||{};
    const y=this._msgY();
    const corner=!!opts.corner&&!this.isCompact;
    const msgWidth=corner?Math.min(this.s(390),this.W*.3):Math.min(this.s(760),this._availW());
    const msgX=corner?this.s(24):this._cx();
    this.persistentMsg=this.add.text(msgX,y-this.s(6),text,{
      fontFamily:CityTheme.heading,fontSize:this.s(corner?15:18),color:'#173b40',
      align:corner?'left':'center',wordWrap:{width:msgWidth},
      backgroundColor:'#fffbf1',padding:{x:this.s(22),y:this.s(13)},lineSpacing:this.s(5),stroke:'#fffbf1',strokeThickness:1
    }).setOrigin(corner?0:0.5,0).setDepth(48).setAlpha(0);
    // Anchor the top edge under the header so multi-line text is never cut off.
    const top=y;
    this.persistentMsg.y=top-this.s(6);
    this.tweens.add({targets:this.persistentMsg,alpha:1,y:top,duration:600});
  }
  _clearPersistentMessage(){ if(this.persistentMsg){this.tweens.killTweensOf(this.persistentMsg);this.persistentMsg.destroy();this.persistentMsg=null;} }

  _showDropRetry(){
    if(this.dropFeedbackTimer){this.dropFeedbackTimer.remove(false);this.dropFeedbackTimer=null;}
    if(this.dropFeedback){this.tweens.killTweensOf(this.dropFeedback);this.dropFeedback.destroy();}
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this.dropFeedback=this.add.text(this._cx(),this.H-this.s(92),de
      ? 'Noch einmal versuchen — lege die Münze in die Mitte eines Viertels.'
      : 'Try again — drop the coin on the centre of a district.',{
      fontFamily:CityTheme.heading,fontSize:this.s(16),color:'#173b40',align:'center',
      backgroundColor:'#fffbf1',padding:{x:this.s(18),y:this.s(11)}
    }).setOrigin(0.5).setDepth(80).setAlpha(0);
    this.tweens.add({targets:this.dropFeedback,alpha:1,duration:160});
    this.dropFeedbackTimer=this.time.delayedCall(2600,()=>{
      if(!this.dropFeedback)return;
      const m=this.dropFeedback; this.dropFeedback=null; this.dropFeedbackTimer=null;
      this.tweens.add({targets:m,alpha:0,duration:260,onComplete:()=>m.destroy()});
    });
  }

  // fadeDur lets specific callers (e.g. the Level 8 university reveal) use a
  // slower, gentler fade than the default so it doesn't visually collide
  // with whatever appears right after it.
  _tempMessage(text,dur,fadeDur){
    fadeDur = fadeDur || 800;
    const m=this.add.text(this._cx(),this.H-this.s(120),text,{
      fontFamily:CityTheme.heading,fontSize:this.s(17),color:'#173b40',
      align:'center',backgroundColor:'#fffbf1',padding:{x:this.s(20),y:this.s(12)},lineSpacing:this.s(5)
    }).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.tweens.add({targets:m,alpha:1,y:this.H-this.s(128),duration:fadeDur,hold:dur?dur*.8:4000,yoyo:true,onComplete:()=>m.destroy()});
  }

  // Consequences remain visible long enough to read, then advance without
  // requiring a second acknowledgement click.
  _showConsequence(text,onContinue,opts){
    // Short, readable pause scaled to the text; a tap skips ahead.
    const readMs=Math.max(1760,Math.min(3200,1040+String(text||'').length*16));
    opts = Object.assign({auto:true,autoDelay:readMs},opts||{});
    // Clearing any existing world button/timer here (not just on level
    // transitions) is what stops Continue buttons from stacking if this
    // method is ever called again before a previous button's callback fired.
    this._clearWorldBtn();
    this._clearConsequence(); this._clearDecisionPanel();
    const cx=this._cx();
    const pw=Math.min(this.s(720),this._availW()), ph=this.s(104), px=cx-pw/2, py=this.H-this.s(186);

    // The city stays visible behind the result: only a light veil plus a
    // stronger shade behind the message band, so the player can actually
    // see the consequence they caused instead of a black screen.
    const dim=this.add.graphics();
    dim.fillStyle(0x173b40, 0.12);
    dim.fillRect(0, 0, this.W, this.H);
    dim.fillStyle(0x173b40, 0.22);
    dim.fillRect(0, py-this.s(26), this.W, this.H-(py-this.s(26)));


    const bg=this.add.graphics();
    bg.fillStyle(0xfffbf1,0.95); bg.fillRoundedRect(px,py,pw,ph,this.s(12));
    bg.lineStyle(1,0x296b72,0.55); bg.strokeRoundedRect(px,py,pw,ph,this.s(12));
    bg.lineStyle(this.s(4),0x296b72,0.8); bg.lineBetween(px,py+this.s(10),px,py+ph-this.s(10));
    const t=this.add.text(cx,py+ph/2,text,{
      fontFamily:CityTheme.heading,fontSize:this.s(17),color:'#173b40',
      align:'center',wordWrap:{width:pw-this.s(56)},lineSpacing:this.s(6)}).setOrigin(0.5);

    const elements=[dim,bg,t];

    if(!opts.auto){
      const rw=this.s(120), rh=this.s(30);
      const rx=px+pw-rw-this.s(12), ry=py+ph+this.s(10);
      const rg=this.add.graphics();
      const rTxt=this.add.text(rx+rw/2, ry+rh/2, (typeof currentLang!=='undefined'&&currentLang==='de')?'↺ Wiederholen':'↺ Retry level',{
        fontFamily:CityTheme.body,fontSize:this.s(12),color:'#55777a'}).setOrigin(0.5);
      const drawR=(hv)=>{ rg.clear();
        rg.fillStyle(0x0b1725,hv?1:0.85); rg.fillRoundedRect(rx,ry,rw,rh,this.s(7));
        rg.lineStyle(1,hv?0x8aa4c0:0x2c4767,1); rg.strokeRoundedRect(rx,ry,rw,rh,this.s(7));
        rTxt.setColor(hv?'#c8d8ea':'#55777a'); };
      drawR(false);
      const rHit=this.add.rectangle(rx+rw/2,ry+rh/2,rw,rh,0xffffff,0).setInteractive({useHandCursor:true});
      rHit.on('pointerover',()=>drawR(true)); rHit.on('pointerout',()=>drawR(false));
      rHit.on('pointerdown',()=>this._retryLevel());
      elements.push(rg,rTxt,rHit);
    }

    this.consequencePanel=this.add.container(0,0).setDepth(62);
    this.consequencePanel.add(elements);
    this.consequencePanel.setAlpha(0);
    this.tweens.add({targets:this.consequencePanel,alpha:1,duration:520});

    if(opts.auto){
      let done=false;
      const go=()=>{ if(done) return; done=true; this.input.off('pointerdown',skip);
        if(this.worldBtnTimer){ this.worldBtnTimer.remove(false); this.worldBtnTimer=null; }
        if(onContinue) onContinue(); };
      const panel=this.consequencePanel;
      const skip=()=>{ if(this.consequencePanel===panel) go(); else this.input.off('pointerdown',skip); };
      this.time.delayedCall(560,()=>{ if(!done) this.input.on('pointerdown',skip); });
      this.worldBtnTimer = this.time.delayedCall(opts.autoDelay||2600, go);
      return;
    }

    // The button itself is created after a short delay so it doesn't appear
    // instantly on top of the consequence text. That delay is tracked so it
    // can be cancelled if the level changes before it fires.
    this.worldBtnTimer = this.time.delayedCall(1100,()=>{
      this.worldBtnTimer=null;
      const lbl=(typeof currentLang!=='undefined'&&currentLang==='de')?'Weiter →':'Continue →';
      this.worldBtn=new WorldButton(this,cx,this.H-this.s(262),lbl,()=>{this.worldBtn=null;this._clearConsequence();if(onContinue)onContinue();});
    });
  }
  _clearConsequence(){ if(this.consequencePanel){this.tweens.killTweensOf(this.consequencePanel);this.consequencePanel.destroy();this.consequencePanel=null;} }

  _showDecisionPanel(options,cb){
    if (typeof ScoringEngine!=='undefined') ScoringEngine.startTimer(); // deliberation time starts when choices appear
    this._clearDecisionPanel(); this._clearConsequence();
    const cx=this._cx();
    const cols=options.length;
    const avail=this._availW();
    const btnW=Math.min(this.s(180),(avail-this.s(48)-(cols-1)*this.s(12))/cols);
    const btnH=this.s(100);
    const panelW=cols*btnW+(cols-1)*this.s(12)+this.s(48);
    const panelH=btnH+this.s(28), panelX=cx-panelW/2, panelY=this.H-panelH-this.s(18);
    this.decisionPanel=this.add.container(0,0).setDepth(60);
    const bg=this.add.graphics();
    bg.fillStyle(0xfffbf1,0.96); bg.fillRoundedRect(panelX,panelY,panelW,panelH,this.s(12));
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
        fontFamily:CityTheme.body,fontSize:this.s(14),color:'#173b40',
        fontStyle:'700',align:'center',wordWrap:{width:btnW-this.s(14)}}).setOrigin(0.5);
      const de=this.add.text(bx+btnW/2,by+this.s(78),o.desc,{
        fontFamily:CityTheme.body,fontSize:this.s(12),color:'#55777a',
        align:'center',wordWrap:{width:btnW-this.s(14)},lineSpacing:this.s(3)}).setOrigin(0.5);
      this.decisionPanel.add([ic,lb,de]);
      const hit=this.add.rectangle(bx+btnW/2,by+btnH/2,btnW-this.s(4),btnH-this.s(2),0xffffff,0)
        .setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>draw(true)); hit.on('pointerout',()=>draw(false));
      hit.on('pointerdown',()=>{this._shake(70,0.002);this._clearDecisionPanel();if(cb)cb(o.value);});
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
    const nightStrength=this.ambient.getNightStrength();
    const night=nightStrength>.55;
    this.nightStrength=nightStrength;
    if(this.metro){ this.metro.setNight(nightStrength); this.metro.update(time,delta); }
    this.ambient.update(time,delta);
    this.weather.update(delta);
    if(!this.roads.quiet || this.roads.visitor) this.roads.update(delta,night);

    this.districts.forEach(d=>d.update(time,delta));
  }
}
