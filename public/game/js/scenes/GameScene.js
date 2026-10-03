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

  // Helper to safely get a translation string
  _tr(keyPath, fallback) {
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
    const keys = keyPath.split('.');
    let obj = (typeof TRANSLATIONS !== 'undefined') ? TRANSLATIONS[lang] : undefined;
    for (const k of keys) {
      if (obj === undefined || obj === null) return fallback !== undefined ? fallback : keyPath;
      obj = obj[k];
    }
    return (obj !== undefined && obj !== null) ? obj : (fallback !== undefined ? fallback : keyPath);
  }

  // Get level data from TRANSLATIONS
  _levelData(n) {
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
    return (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].levels)
      ? (TRANSLATIONS[lang].levels[n-1] || null) : null;
  }

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
    const levelTitle = this._levelData(1) ? this._levelData(1).title : (de?'Die erste Gelegenheit':'The First Opportunity');
    const level=this.add.text(cx,cy+this.s(25),levelTitle,{
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
    this.hud.yearText.setText((typeof currentLang!=='undefined'&&currentLang==='de'?'Jahr ':'Year ') + s.year);
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
    const run = () => this.time.delayedCall(460, fn.bind(this));
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
      this.time.delayedCall(titleAlreadyShown?228:911, ()=> this.tutorial.show(n, proceed));
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

  _levelName(n){
    const ld = this._levelData(n);
    if (ld && ld.title) return ld.title;
    return {1:'The First Opportunity',2:'The Unexpected Setback',3:'Expansion',4:'Today or Tomorrow',5:'The Boom',6:'The Outside Offer',7:'Breaking News',8:'The Great Storm',9:'The Project Review',10:'The Planning Desk'}[n]||'Level '+n;
  }

  _nextLevel(){
    this._clearConsequence(); this._clearWorldBtn(); this._clearLevel3Idle();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,this.currentLevel);
    const next=this.currentLevel+1;
    if(next<=10) this._startLevel(next);
  }

  _toProfile(){ this.tweens.killAll(); this.scene.start('ProfileScene',{stats:this.cityStats}); }

  // ══ LEVEL 1 ══
  _level1() {
    const ld = this._levelData(1);
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const opts = ld && ld.options ? ld.options : null;

    const ch=[
      {d:this.districts[0], l: opts ? (opts[0] ? opts[0].label : '🌱 Safe & Steady') : '🌱 Safe & Steady',   v:'safe',       c:0x4aaa5c},
      {d:this.districts[1], l: opts ? (opts[1] ? opts[1].label : '🚏 Reliable Growth') : '🚏 Reliable Growth', v:'balanced',   c:0x5c8ab0},
      {d:this.districts[2], l: opts ? (opts[2] ? opts[2].label : '🚀 High Potential') : '🚀 High Potential',  v:'aggressive', c:0x9966cc},
      {d:this.districts[3], l: opts ? (opts[3] ? opts[3].label : '⚡ Balanced') : '⚡ Balanced',        v:'balanced',   c:0xddaa00}
    ];
    this.siteMarkers=[];
    ch.forEach((o,i)=>{
      this.time.delayedCall(i*260,()=>{
        // Positioned from the district's own label so they can never collide
        this.siteMarkers.push(this._choiceLabel(o.d.cx, o.d.subLabelY(), o.l, o.c));
        o.d.setSelectable(true, ()=>this._onLevel1Choice(o.d,o.v));
      });
    });
    const storyText = ld && ld.story ? ld.story : (de
      ? 'Tippe auf ein Viertel, um mit dem Wachstum deiner Stadt zu beginnen.'
      : 'Tap one of the districts below to start growing your city.');
    this._showPersistentMessage(storyText);
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this._addLandmark(d,'🏗', de ? 'Zuerst hier gebaut' : 'Built first here', d.accentColor);
    const ld = this._levelData(1);
    let msg;
    if (ld && ld.options) {
      const opt = ld.options.find(o => o.value === v);
      msg = opt ? opt.consequence : null;
    }
    if (!msg) {
      const m={safe:'Construction begins carefully.\nThe city grows slowly but steadily.',
               balanced:'A balanced approach takes shape.\nThe city moves forward with measured confidence.',
               aggressive:'Cranes rise. Citizens are excited.\nResults will take time to appear.'};
      msg = m[v]||m.balanced;
    }
    this._showConsequence(msg, ()=>this._nextLevel());
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this._workersLeave(); this.districts[2].takeDamage(28); this._updateStats(-5,-8,0);
    const ld = this._levelData(2);
    const storyMsg = ld && ld.story ? ld.story
      : (de ? 'Das Technologieviertel hat an Wert verloren.\nSchlagzeilen sind alarmierend, aber nichts Konkretes hat sich geändert.\nWas tut die Stadt?' : 'The technology district has lost value.\nHeadlines are alarming, but nothing concrete has changed.\nWhat does the city do?');
    this.time.delayedCall(1900,()=>{
      this._showPersistentMessage(storyMsg);
      const opts = ld && ld.options ? ld.options : null;
      this._showDecisionPanel([
        {icon:'🛡',label: opts && opts[0] ? opts[0].label : (de?'Projekt abbrechen':'Cancel project'), desc: opts && opts[0] ? opts[0].description : (de?'Arbeit stoppen,\nRessourcen behalten':'Stop work now,\nkeep the resources'),value:'cancel',color:0x3a5f8a},
        {icon:'🏗',label: opts && opts[1] ? opts[1].label : (de?'Wie geplant fortfahren':'Push through'), desc: opts && opts[1] ? opts[1].description : (de?'Wie geplant fertigstellen,\nRückgang akzeptieren':'Finish as planned,\naccept the dip'),value:'continue',color:0x4aaa5c},
        {icon:'💰',label: opts && opts[2] ? opts[2].label : (de?'Mehr investieren':'Invest more'), desc: opts && opts[2] ? opts[2].description : (de?'Auf das Viertel\nverdoppeln':'Double down\non the district'),value:'invest_more',color:0xddaa00},
        {icon:'⏳',label: opts && opts[3] ? opts[3].label : (de?'Pause & neu beurteilen':'Pause & reassess'), desc: opts && opts[3] ? opts[3].description : (de?'Arbeit anhalten,\nspäter neu entscheiden':'Halt work now,\ndecide again later'),value:'wait',color:0x6b7a8d}
      ],(c)=>{
        ScoringEngine.recordDecision(2,c,{phase:'dip'}); this._clearPersistentMessage();
        let e;
        if (opts) {
          const opt = opts.find(o => o.value === c);
          if (opt && opt.consequence) {
            const deltas = {cancel:{d:[5,-10,10]},continue:{d:[0,5,-5]},invest_more:{d:[-5,12,-15]},wait:{d:[-5,-5,0]}};
            e = { d: (deltas[c]||{d:[0,5,-5]}).d, m: opt.consequence };
          }
        }
        if (!e) {
          e={cancel:{d:[5,-10,10],m:'Resources secured.\nThe project rests. The city will not benefit if it recovers.'},
             continue:{d:[0,5,-5],m:'The plan continues.\nThe city accepts short-term uncertainty.'},
             invest_more:{d:[-5,12,-15],m:'The city doubles down.\nHigh stakes.'},
             wait:{d:[-5,-5,0],m:'Construction stalls.\nResources are safe but idle. The cost of doing nothing.'}}[c]
             ||{d:[0,5,-5],m:'The plan continues.'};
        }
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this.districts[2].receiveResource(3);
    const m={cancel: de
      ? 'Wochen später: Der Schrecken vergeht.\nDas Viertel erholt sich — ohne die Stadt. Das abgebrochene Projekt bleibt abgebrochen.'
      : 'Weeks later: the scare blows over.\nThe district recovers — without the city. The cancelled project stays cancelled.',
             continue: de
      ? 'Wochen später: Der Schrecken vergeht.\nDas Viertel erholt sich. Kurs halten hat sich gelohnt.'
      : 'Weeks later: the scare blows over.\nThe district recovers. Staying the course paid off.',
             invest_more: de
      ? 'Wochen später: Der Schrecken vergeht.\nDas Viertel erholt sich — und die Zusatzinvestition zahlt sich aus.'
      : 'Weeks later: the scare blows over.\nThe district recovers — and the extra investment pays off handsomely.',
             wait: de
      ? 'Wochen später: Der Schrecken vergeht.\nDas Viertel erholt sich. Die Pause kostete Zeit, sonst nichts.'
      : 'Weeks later: the scare blows over.\nThe district recovers. The pause cost time, but nothing else.'}[choice]
             ||(de ? 'Wochen später: Der Schrecken vergeht.\nDas Viertel erholt sich.' : 'Weeks later: the scare blows over.\nThe district recovers.');
    if(choice==='cancel') this._updateStats(-5,0,0);
    else if(choice==='invest_more') this._updateStats(5,8,0);
    else if(choice==='continue') this._updateStats(3,5,0);
    this._showConsequence(m,()=>this._level2News());
  }

  // Beat B: a second drop, this time with clear bad fundamentals. The
  // transport district's main employer is leaving for good. Holding or
  // doubling down is costly here; cutting losses is the reasonable move.
  _level2News() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this.time.delayedCall(1200,()=>{
      this.districts[1].takeDamage(30); this._updateStats(-5,-8,0);
      this._shake(200,0.003);
      this.time.delayedCall(1600,()=>{
        this._showPersistentMessage(de
          ? 'Jetzt fällt das Verkehrsviertel.\nDiesmal gibt es echte Neuigkeiten: Sein größter Arbeitgeber\nverlässt die Stadt für immer. Was tut die Stadt?'
          : 'Now the transport district is falling.\nThis time there is real news: its largest employer\nis leaving the city for good. What does the city do?');
        const ld = this._levelData(2);
        const opts = ld && ld.options ? ld.options : null;
        this._showDecisionPanel([
          {icon:'🛡',label: opts && opts[0] ? opts[0].label : (de?'Verluste begrenzen':'Cut losses'), desc: de?'Distriktvermögen verkaufen\nbevor es schlimmer wird':'Sell the district assets\nbefore it gets worse',value:'cancel',color:0x3a5f8a},
          {icon:'🏗',label: opts && opts[1] ? opts[1].label : (de?'Durchhalten':'Hold on'), desc: de?'Alles behalten,\nauf Erholung hoffen':'Keep everything,\nhope it turns around',value:'continue',color:0x4aaa5c},
          {icon:'💰',label: opts && opts[2] ? opts[2].label : (de?'Mehr investieren':'Invest more'), desc: de?'Auf das Viertel\nverdoppeln':'Double down\non the district',value:'invest_more',color:0xddaa00},
          {icon:'⏳',label: opts && opts[3] ? opts[3].label : (de?'Pause & neu beurteilen':'Pause & reassess'), desc: de?'Arbeit anhalten,\nspäter neu entscheiden':'Halt work now,\ndecide again later',value:'wait',color:0x6b7a8d}
        ],(c)=>{
          ScoringEngine.recordDecision(2,c,{phase:'news'}); this._clearPersistentMessage();
          const e={cancel:{d:[5,-5,5],m: de ? 'Die Stadt steigt rechtzeitig aus.\nDas Viertel fällt weiter, aber die Ressourcen wurden gerettet.' : 'The city exits in time.\nThe district keeps declining, but the resources were saved.'},
                   continue:{d:[-8,-12,0],m: de ? 'Die Stadt hält durch.\nDas Viertel fällt weiter. Hoffnung ist keine Strategie.' : 'The city holds on.\nThe district keeps declining. Hope is not a strategy.'},
                   invest_more:{d:[-12,-15,-10],m: de ? 'Die Stadt verdoppelt auf ein schrumpfendes Viertel.\nDie extra Ressourcen sinken mit ihm.' : 'The city doubles down on a shrinking district.\nThe extra resources sink with it.'},
                   wait:{d:[-3,-6,0],m: de ? 'Die Stadt wartet.\nDas Viertel fällt weiter, während Entscheidungen aufgeschoben werden.' : 'The city waits.\nThe district keeps declining while decisions are postponed.'}}[c]
                   ||{d:[-8,-12,0],m: de ? 'Die Stadt hält durch.\nDas Viertel fällt weiter.' : 'The city holds on.\nThe district keeps declining.'};
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(3);
    this._level3PlacedCubes = new Set();
    this._level3Resolved = false;
    this._spawnResourceCubes(6);
    // Accessibility: dragging is not the only way through this level.
    // Tapping a district sends the next waiting cube there, so the level
    // is completable with a single tap per cube on touch screens too.
    this.districts.forEach(d=>d.setSelectable(true,(dd)=>this._tapAllocate(dd)));
    const storyText = ld && ld.story ? ld.story
      : (de ? '600 neue Kredite\nLege jede Münze auf die Mitte eines Viertels,\noder tippe auf ein Viertel, um die nächste Münze zu senden.\n0 von 6 platziert.'
             : '600 new credits\nDrop each coin on the centre of a district,\nor tap a district to send the next coin.\n0 of 6 placed.');
    this._showPersistentMessage(storyText,{corner:true});
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
        ? `Noch am Überlegen? ${remaining} Würfel warten noch — die Stadt kann erst weiter, wenn alle platziert sind.`
        : `Still deciding? ${remaining} cube${remaining===1?'':'s'} still waiting — the city can't move on until every one is placed.`);
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    if(this.cubeDropped < this.cubeTotal){
      this._showPersistentMessage(de
        ? `600 neue Kredite\nLege jede Münze auf die Mitte eines Viertels,\noder tippe auf ein Viertel.\n${this.cubeDropped} von ${this.cubeTotal} platziert.`
        : `600 new credits\nDrop each coin on the centre of a district,\nor tap a district to send the next coin.\n${this.cubeDropped} of ${this.cubeTotal} placed.`,{corner:true});
      this._armLevel3Idle();
    } else {
      this._level3Resolved = true;
      this._clearLevel3Idle();
      this.districts.forEach(d=>d.setSelectable(false));
      // Exposure preview: the player sees where their money sits BEFORE
      // the random shock lands, so the outcome is understood, not guessed.
      const c={}; (ScoringEngine.decisions||[]).filter(d=>d.level===3).forEach(d=>{c[d.districtId]=(c[d.districtId]||0)+1;});
      const spread=Object.entries(c).map(([k,n])=>n*100+' in '+k).join(', ');
      this._showPersistentMessage(de
        ? `Alle sechs platziert.\nDeine Kredite: ${spread}.\nNächstes Jahr wird ein unbekanntes Viertel getroffen.`
        : `All six placed.\nYour credits: ${spread}.\nNext year one unknown district will be hit.`,{corner:true});
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
    const ld = this._levelData(3);
    let msg;
    if (ld && ld.consequence) {
      msg = de
        ? `Das ${nm}-Viertel fällt um 40%.\nDu hattest ${exposed} Kredite dort → Verlust: ${lost} Kredite.\n${ld.consequence}`
        : `The ${nm} district fell 40%.\nYou had ${exposed} credits there → you lost ${lost} credits.\n${ld.consequence}`;
    } else {
      msg = de
        ? `Das ${nm}-Viertel fällt um 40%.\nDu hattest ${exposed} Credits dort → Verlust: ${lost} Credits.`
        : `The ${nm} district fell 40%.\nYou had ${exposed} credits there → you lost ${lost} credits.`;
    }
    this._showConsequence(msg,()=>this._nextLevel());
  }


  // ══ LEVEL 4 ══
  // Beat A: an urgent repair. Spending cash on a genuine need is NOT
  // impatience — this beat (phase:'repair') adjusts RESILIENCE (+/-8) only, never the
  // patience score. Beat B (phase:'build') is the real delayed-reward test.
  _level4() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const housing=this.districts[0];
    housing.takeDamage(18);
    this._shake(180,0.003);
    this._showPersistentMessage(de
      ? 'Eine Wasserleitung ist unter dem Wohnviertel gebrochen.\nFamilien haben kein fließendes Wasser. Die Stadt hat Reserven.'
      : 'A water main has burst under the housing district.\nFamilies have no running water. The city has cash set aside.');
    this._showDecisionPanel([
      {icon:'🔧',label: de?'Jetzt reparieren':'Repair it now',desc: de?'Nutzt Reserven heute.\nBehebt das Problem.':'Uses reserve cash today.\nFixes the problem.',value:'repair_now',color:0x296b72},
      {icon:'⏳',label: de?'Reparatur verschieben':'Postpone repair',desc: de?'Bargeld jetzt behalten.\nSpäter damit umgehen.':'Keep the cash for now.\nDeal with it later.',value:'defer',color:0xe2a840}
    ],(c)=>{
      ScoringEngine.recordDecision(4,c,{phase:'repair'}); this._clearPersistentMessage();
      if(c==='repair_now'){
        housing.receiveResource(2); this._updateStats(6,0,-6);
        this._showConsequence(de
          ? 'Das Rohr ist innerhalb von Tagen repariert.\nErspartes für einen echten Notfall zu verwenden, ist der Sinn von Ersparnissen.'
          : 'The pipe is fixed within days.\nUsing savings for a real emergency is what savings are for.',()=>this._level4Build());
      } else {
        housing.takeDamage(12); this._updateStats(-10,0,0);
        this._showConsequence(de
          ? 'Das Leck breitet sich aus. Die Reparatur kostet jetzt mehr als zuvor.\nEinen echten Bedarf aufzuschieben ist nicht dasselbe wie Geduld.'
          : 'The leak spreads. The repair now costs more than it would have.\nPostponing a real need is not the same as being patient.',()=>this._level4Build());
      }
    });
  }

  _level4Build() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(4);
    const opts = ld && ld.options ? ld.options : null;
    const storyMsg = ld && ld.story ? ld.story
      : (de ? 'Mit dem Notfall hinter sich kann die Stadt eine von zwei Einrichtungen bauen.\nDiese Entscheidung wird den Rest des Spiels beeinflussen.'
             : 'With the emergency behind it, the city can build one of two facilities.\nThis decision will echo through the rest of the game.');
    this._showPersistentMessage(storyMsg);
    this._showDecisionPanel([
      {icon:'🎪',label: opts && opts[0] ? opts[0].label : (de?'🎪 Festplatz':'Festival Square'), desc: opts && opts[0] ? opts[0].description : (de?'Glückliche Bürger jetzt.\nWenig langfristiger Wert.':'Happy citizens now.\nLittle long-term value.'),value:'festival',color:0xe2a840},
      {icon:'🎓',label: opts && opts[1] ? opts[1].label : (de?'🎓 Forschungsuniversität':'Research University'), desc: opts && opts[1] ? opts[1].description : (de?'Mehrere Runden ohne Belohnung.\nSpäter mächtig.':'No reward for several levels.\nPowerful later.'),value:'university',color:0x296b72}
    ],(c)=>{
      ScoringEngine.recordDecision(4,c,{phase:'build'}); this._clearPersistentMessage();
      let consMsg;
      if (opts) {
        const opt = opts.find(o => o.value === c);
        consMsg = opt ? opt.consequence : null;
      }
      if(c==='university'){
        this.hasUniversity=true; this._updateStats(0,0,-8);
        this._addLandmark(this.districts[2],'🏗', de?'Universität — im Bau':'University — under construction',0x296b72);
        this._showConsequence(consMsg || (de
          ? 'Der Bau beginnt still.\nNoch kein Ergebnis. Die Stadt wartet.\nEtwas wird gebaut, das später bedeutsam sein kann.'
          : 'Construction begins quietly.\nNo result yet. The city waits.\nSomething is being built that may matter greatly later.'),()=>this._nextLevel());
      } else {
        this._updateStats(18,0,0); this.districts[0].receiveResource(1);
        this._addLandmark(this.districts[0],'🎪', de?'Festplatz':'Festival Square',0xe2a840);
        this._showConsequence(consMsg || (de
          ? 'Der Platz ist gebaut. Bürger feiern heute.\nDie Stadt ist glücklich — aber nur für jetzt.'
          : 'The square is built. Citizens celebrate today.\nThe city is happy — but only for now.'),()=>this._nextLevel());
      }
    });
  }

  // ══ LEVEL 5 ══
  _level5() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(5);
    const tech=this.districts[2];
    tech.receiveResource(4); this.time.delayedCall(500,()=>tech.receiveResource(3));
    for(let i=0;i<16;i++) this.time.delayedCall(i*170,()=>this._firework(tech.cx+Phaser.Math.Between(-95,95),tech.cy+Phaser.Math.Between(-95,10)));
    const newsLines = ld && ld.news ? ld.news
      : (de ? ['📰 Technologieviertel verdoppelt sich im Wert!','📰 Experten: Wachstum wird anhalten — Nachbarstädte investieren alles...']
             : ['📰 Technology District doubles in value!','📰 Experts: growth will continue — neighbouring cities moving in...']);
    this._newsTicker(newsLines);
    this.time.delayedCall(1500,()=>{
      this.districts.forEach((d,i)=>{if(i!==2)this.tweens.add({targets:[d.gfx,d.animGfx],alpha:0.4,duration:900});});
      this.time.delayedCall(2100,()=>{
        const storyMsg = ld && ld.story ? ld.story
          : (de ? 'Technologie boomt. Andere Viertel wirken plötzlich langweilig.\nWas tut die Stadt?'
                 : 'Technology is booming. Other districts suddenly look boring.\nWhat does the city do?');
        this._showPersistentMessage(storyMsg);
        const opts = ld && ld.options ? ld.options : null;
        this._showDecisionPanel([
          {icon:'🚀',label: opts && opts[0] ? opts[0].label : (de?'Alles rein':'All in'), desc: opts && opts[0] ? opts[0].description : (de?'Alles\nin Technologie':'Move everything\nto technology'),value:'all_in',color:0x9966cc},
          {icon:'➕',label: opts && opts[1] ? opts[1].label : (de?'Mehr investieren':'Invest more'), desc: opts && opts[1] ? opts[1].description : (de?'Engagement erhöhen\netwas Balance halten':'Increase exposure\nkeep some balance'),value:'increase',color:0x296b72},
          {icon:'⚖',label: opts && opts[2] ? opts[2].label : (de?'Diversifiziert bleiben':'Stay diversified'), desc: opts && opts[2] ? opts[2].description : (de?'Schwung widerstehen\nBalance halten':'Resist momentum\nhold the balance'),value:'hold',color:0x4aaa5c},
          {icon:'📉',label: opts && opts[3] ? opts[3].label : (de?'Gewinne mitnehmen':'Take profits'), desc: opts && opts[3] ? opts[3].description : (de?'Technologie reduzieren\nGewinne sichern':'Reduce tech\nsecure gains'),value:'reduce',color:0xe2a840}
        ],(c)=>{
          ScoringEngine.recordDecision(5,c); this._clearPersistentMessage();
          this.districts.forEach(d=>this.tweens.add({targets:[d.gfx,d.animGfx],alpha:1,duration:600}));
          let msg;
          if (opts) {
            const opt = opts.find(o => o.value === c);
            msg = opt ? opt.consequence : null;
          }
          if (!msg) {
            const m={all_in: de?'Alles auf Technologie committed.\nDie Stadt fühlt sich unaufhaltsam an. Für jetzt.':'Everything committed to technology.\nThe city feels unstoppable. For now.',
                     increase: de?'Mehr Technologie im Mix.\nDer Schwung baut sich auf.':'More technology in the mix.\nMomentum builds.',
                     hold: de?'Die Stadt beobachtet aus einer ausgewogenen Position.\nManche fühlen, sie verpasst etwas.':'The city watches from a balanced position.\nSome feel it is missing out.',
                     reduce: de?'Gewinne gesichert.\nDie Stadt tritt einen Schritt zurück.':'Profits secured.\nThe city steps back from the excitement.'};
            msg = m[c]||m.hold;
          }
          if(c==='all_in'){tech.receiveResource(3);this._updateStats(5,15,-12);}
          else if(c==='increase'){tech.receiveResource(1);this._updateStats(3,8,-5);}
          else if(c==='hold') this._updateStats(2,4,0);
          else this._updateStats(0,-3,8);
          this._showConsequence(msg,()=>this._nextLevel());
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(6);
    const arrivalMsg = this.metro
      ? (de ? 'Ein Schiff aus der Nachbarstadt segelt den Fluss herauf mit einem Investitionsangebot...' : 'A ship from the neighbouring city is sailing up the river with an investment offer...')
      : (de ? 'Eine Delegation kommt aus der Nachbarstadt an...' : 'A delegation is arriving from the neighbouring city...');
    this._showPersistentMessage(arrivalMsg);
    this.roads.sendVisitor(()=>{
      this._level6Decide(false);
    });
  }

  _level6Decide(hasRead) {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(6);
    const opts = ld && ld.options ? ld.options : null;
    this._showPersistentMessage(hasRead
      ? (de ? 'Du hast das vollständige Bild. Was tut die Stadt?' : 'You have the full picture. What does the city do?')
      : (ld && ld.story ? ld.story : (de ? 'Sie bieten an, ihre Wasserinfrastruktur zu teilen.\nWas tut die Stadt?' : 'They offer to share their water infrastructure.\nWhat does the city do?')));
    const panelOpts=[
      {icon:'🤝',label: opts && opts[0] ? opts[0].label : (de?'Geteiltes Angebot annehmen':'Accept offer'), desc: opts && opts[0] ? opts[0].description : (de?'200 Ressourcen jetzt.\nEtwas Abhängigkeitsrisiko.':'200 resources now.\nSome dependency risk.'),value:'accept',color:0x296b72},
      {icon:'🏗',label: opts && opts[1] ? opts[1].label : (de?'Unabhängig bauen':'Build own'), desc: opts && opts[1] ? opts[1].description : (de?'400 Ressourcen.\nVolle Kontrolle.':'400 resources.\nFull control.'),value:'independent',color:0x4aaa5c},
      {icon:'❌',label: opts && opts[2] ? opts[2].label : (de?'Beide ablehnen':'Decline both'), desc: opts && opts[2] ? opts[2].description : (de?'Ressourcen\nfür andere Prioritäten.':'Keep resources\nfor other priorities.'),value:'decline',color:0x6b7a8d}
    ];
    if (!hasRead) panelOpts.push({icon:'🔍',label: opts && opts[3] ? opts[3].label : (de?'Zuerst recherchieren':'Research first'), desc: opts && opts[3] ? opts[3].description : (de?'Mehr Infos sammeln\nvor der Entscheidung.':'Gather more info\nbefore deciding.'),value:'research',color:0xe2a840});
    this._showDecisionPanel(panelOpts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(6,'research');
        const reportTitle = ld && ld.offer ? ld.offer.title : (de ? 'Delegationsbericht' : 'Delegation Report');
        const reportText = de
          ? 'Ihre Infrastruktur ist gut gewartet, bindet aber deine Stadt an ihren Wartungsplan. Unabhängig zu bauen kostet mehr, entfernt aber jede Abhängigkeit. Ablehnen hält jede Option für später offen.'
          : 'Their infrastructure is well maintained but ties your city to their maintenance schedule. Building independently costs more but removes any dependency. Declining keeps every option open for later.';
        this._reportModal(reportTitle, reportText,
          ()=>{ this._updateStats(3,0,0); this.time.delayedCall(300,()=>this._level6Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(6,c,{afterResearch:hasRead});
      let acceptMsg, indMsg, decMsg;
      if (opts) {
        const aOpt = opts.find(o=>o.value==='accept');
        const iOpt = opts.find(o=>o.value==='independent');
        const dOpt = opts.find(o=>o.value==='decline');
        acceptMsg = aOpt ? aOpt.consequence : null;
        indMsg = iOpt ? iOpt.consequence : null;
        decMsg = dOpt ? dOpt.consequence : null;
      }
      const m={
        accept: acceptMsg || ((this.metro
          ? (de?'Das Angebotsschiff segelt den Fluss hinauf und legt an.':'The offer ship sails up the river and docks.')
          : (de?'Die Delegation fährt in die Stadt.':'The delegation drives into the city.'))
          + '\n' + (de?'Gemeinsame Infrastruktur wird eingerichtet — und gefeiert.':'Shared infrastructure is established — and celebrated.')),
        independent: indMsg || ((this.metro
          ? (de?'Das Schiff segelt flussabwärts zurück.':'The ship sails back downstream.')
          : (de?'Die Delegation dreht um und geht.':'The delegation turns around and leaves.'))
          + '\n' + (de?'Die Stadt baut ihre eigene — teurer, vollständig kontrolliert.':'The city builds its own — more expensive, fully controlled.')),
        decline: decMsg || ((this.metro
          ? (de?'Das Schiff segelt flussabwärts zurück.':'The ship sails back downstream.')
          : (de?'Die Delegation dreht um und geht.':'The delegation turns around and leaves.'))
          + '\n' + (de?'Ressourcen werden für andere Prioritäten erhalten.':'Resources are preserved for other priorities.'))
      };
      const dl={accept:[-8,5,-8],independent:[-5,8,-15],decline:[0,0,5]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='accept'){
        this._addLandmark(this.districts[1],'🤝', de?'Geteilte Infrastruktur':'Shared infrastructure',0x62c4dd);
        this.roads.visitorAccept(this.districts[0], ()=>{ this.districts[0].receiveResource(1); this._celebrateCity(de?'🎉 Partnerschaft gefeiert!':'🎉 Partnership Celebrated!'); });
      } else {
        if(c==='independent') this._addLandmark(this.districts[1],'🏗', de?'Eigene Infrastruktur':'Own infrastructure',0x8aa4c0);
        this.roads.visitorDecline(); if(c==='independent') this.districts[0].receiveResource(1);
      }
      this._showConsequence(m[c]||m.decline,()=>this._nextLevel());
    });
  }

  // ══ LEVEL 7 ══
  _level7() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(7);
    const newsLines = ld && ld.news ? ld.news
      : (de ? ['📰 Mehrere große Städte geben ihre Technologieviertel auf!','📰 Freunde und Berater empfehlen sofortiges Handeln...']
             : ['📰 Several major cities abandoning technology districts!','📰 Friends and advisors recommending immediate action...']);
    this._newsTicker(newsLines);
    this.time.delayedCall(2400,()=>this._level7Decide(false));
  }

  _level7Decide(hasRead) {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(7);
    const opts = ld && ld.options ? ld.options : null;
    const storyMsg = ld && ld.story ? ld.story
      : (de ? 'Nachrichten kommen aus der gesamten Region.\nNimm dir Zeit. Die Entscheidung steht offen.' : 'News arrives from across the region.\nTake your time. The decision sits open.');
    this._showPersistentMessage(hasRead
      ? (de ? 'Du hast das vollständige Bild. Entscheide jetzt, was die Stadt tut.' : 'You have the full picture. Now decide what the city does.')
      : storyMsg);
    const panelOpts=[
      {icon:'📤',label: opts && opts[0] ? opts[0].label : (de?'Technologie verkaufen':'Sell tech'), desc: opts && opts[0] ? opts[0].description : (de?'Sofort handeln.':'Act immediately.'),value:'sell',color:0xe74c3c},
      {icon:'⬇',label: opts && opts[1] ? opts[1].label : (de?'Reduzieren':'Reduce'), desc: opts && opts[1] ? opts[1].description : (de?'Vorsichtiger Mittelweg.':'Cautious middle path.'),value:'reduce',color:0xe2a840},
      {icon:'🔒',label: opts && opts[2] ? opts[2].label : (de?'Kurs halten':'Hold steady'), desc: opts && opts[2] ? opts[2].description : (de?'Schlagzeilen ignorieren.':'Ignore headlines.'),value:'hold',color:0x4aaa5c},
      {icon:'📈',label: de?'Mehr investieren':'Invest more', desc: de?'In den Rückgang kaufen.':'Buy into the dip.',value:'invest_more',color:0x9966cc}
    ];
    if (!hasRead) {
      const resOpt = opts ? opts.find(o=>o.isReport) : null;
      panelOpts.push({icon:'📋',label: resOpt ? resOpt.label : (de?'Bericht lesen':'Read report'), desc: resOpt ? resOpt.description : (de?'Kostenlos — Fakten sammeln\ndann noch entscheiden.':'Free — gather facts\nthen still decide.'),value:'research',color:0x5c8ab0});
    }
    this._showDecisionPanel(panelOpts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(7,'research');
        const reportTitle = this._tr('game.reportTitle', de?'Vollständiger Lagebericht':'Full Situation Report');
        const reportText = ld && ld.report ? ld.report
          : (de ? 'Experten sind gespalten. Die Warnung betrifft kurzfristige Unsicherheit. Langfristige Nachfrageprognosen bleiben unklar. Die verfügbaren Belege stammen aus Städten mit erheblich anderen Umständen.'
                : 'Experts are divided. The warning relates to short-term uncertainty. Long-term demand projections remain unclear. The available evidence comes from cities with significantly different circumstances.');
        this._reportModal(reportTitle, reportText,
          ()=>{ this._updateStats(3,0,0); this.time.delayedCall(300,()=>this._level7Decide(true)); });
        return;
      }
      ScoringEngine.recordDecision(7,c,{afterResearch:hasRead});
      let msg;
      if (opts) {
        const opt = opts.find(o => o.value === c);
        msg = opt ? opt.consequence : null;
      }
      if (!msg) {
        const m={sell: de?'Das Technologieviertel ist verkauft.\nRessourcen vor weiterem Rückgang geschützt.':'The technology district is sold.\nResources protected from further decline.',
                 reduce: de?'Engagement reduziert.\nDie Stadt behält etwas Technologieinteresse.':'Exposure reduced.\nThe city retains some technology interest.',
                 hold: de?'Die Stadt hält ihre Position.\nDie Zeit wird zeigen, ob die Schlagzeilen stimmten.':'The city holds its position.\nTime will tell whether the headlines were right.',
                 invest_more: de?'Die Stadt kauft in den Rückgang.\nEine selbstbewusste Wette gegen die Schlagzeilen.':'The city buys into the dip.\nA confident bet against the headlines.'};
        msg = m[c]||m.hold;
      }
      const dl={sell:[-5,-12,12],reduce:[-2,-5,5],hold:[2,0,0],invest_more:[-3,10,-15]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='sell') this.districts[2].takeDamage(15);
      if(c==='invest_more') this.districts[2].receiveResource(2);
      this._showConsequence(msg,()=>this._nextLevel());
    });
  }

  // ══ LEVEL 8 ══
  _level8() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(8);
    const opts = ld && ld.options ? ld.options : null;
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
          this._tempMessage(de
            ? 'Die Forschungsuniversität öffnet ihre Türen.\nAbsolventen gründen Unternehmen. Das Einkommen steigt. Deine Geduld zahlt sich aus.'
            : 'The Research University opens its doors.\nGraduates create companies. Income rises. Your patience pays off.',UNI_HOLD,UNI_FADE);
          this.districts[0].receiveResource(2); this.districts[1].receiveResource(1);
          this._addLandmark(this.districts[2],'🎓', de?'Universität geöffnet':'University open',0x296b72);
          this._updateStats(10,15,0);
        });
      }
      const storyMsg = ld && ld.story ? ld.story
        : (de ? 'Ein wirtschaftlicher Sturm trifft jede Stadt.\nDu kannst ihn nicht verhindern. Was schützt du?'
               : 'An economic storm hits every city.\nYou cannot prevent it. What do you protect?');
      this.time.delayedCall(this.hasUniversity?(UNI_END+250):1650,()=>{
        this._showPersistentMessage(storyMsg);
        this._showDecisionPanel([
          {icon:'🏃',label: opts && opts[0] ? opts[0].label : (de?'Alles verkaufen':'Sell all'), desc: opts && opts[0] ? opts[0].description : (de?'Verbleibende\nRessourcen schützen.':'Protect remaining\nresources.'),value:'sell_all',color:0xe74c3c},
          {icon:'🏛',label: opts && opts[1] ? opts[1].label : (de?'Wesentliches schützen':'Protect essentials'), desc: opts && opts[1] ? opts[1].description : (de?'Kritische Dienste schützen.\nPlan halten.':'Shield critical services.\nHold the plan.'),value:'hold',color:0x4aaa5c},
          {icon:'⚖',label: opts && opts[3] ? opts[3].label : (de?'Neu ausbalancieren':'Rebalance'), desc: opts && opts[3] ? opts[3].description : (de?'Durchdacht\numstrukturieren.':'Restructure\nthoughtfully.'),value:'rebalance',color:0x296b72},
          {icon:'📈',label: opts && opts[4] ? opts[4].label : (de?'Günstig investieren':'Buy the dip'), desc: opts && opts[4] ? opts[4].description : (de?'Selektiv investieren\nbei niedrigen Werten.':'Invest selectively\nwhile low.'),value:'opportunistic',color:0xe2a840}
        ],(c)=>{
          ScoringEngine.recordDecision(8,c); this._clearPersistentMessage();
          this.weather.stopStorm(250);
          this.time.delayedCall(700,()=>{
            this.districts.forEach(d=>d.setStorm(false));
            this.weather.startRecovery(()=>{ this.districts.forEach(d=>d.receiveResource(1)); this._updateStats(8,12,5); });
            let msg;
            if (opts) {
              const opt = opts.find(o => o.value === c);
              msg = opt ? opt.consequence : null;
            }
            if (!msg) {
              const m={sell_all: de?'Ressourcen gesichert.\nDie Stadt hört auf zu bauen und wartet auf ruhigere Zeiten.':'Resources secured.\nThe city stops building and waits for calmer times.',
                       hold: de?'Der Plan hält.\nDie Stadt übersteht den Sturm mit intakter Struktur.':'The plan holds.\nThe city weathers the storm with its structure intact.',
                       rebalance: de?'Eine widerstandsfähigere Struktur entsteht.\nDie Stadt reorganisiert sich durchdacht.':'A more resilient structure emerges.\nThe city reorganises thoughtfully.',
                       opportunistic: de?'Die Stadt investiert sorgfältig während des Abschwungs.\nWenn die Erholung kommt, werden diese Entscheidungen bedeutsam.':'The city invests carefully during the downturn.\nIf recovery comes, these decisions will matter.'};
              msg = m[c]||m.hold;
            }
            const dl={sell_all:[-5,-15,15],hold:[5,0,-5],rebalance:[5,8,-5],opportunistic:[3,12,-10]}[c]||[0,0,0];
            this._updateStats(dl[0],dl[1],dl[2]);
            // Final level: same clickable Continue flow as every other level —
            // the player decides when to move on to their result, rather than
            // it advancing automatically.
            this._showConsequence(msg,()=>this._nextLevel());
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this._showPersistentMessage(de
      ? 'Die Stadt braucht Geld für das Budget des nächsten Jahres. Sie muss ein Projekt verkaufen.\nAnalysten bewerten beide mit genau derselben Aussicht.'
      : 'The city needs cash for next year’s budget. It must sell one project.\nAnalysts rate both with exactly the same outlook from here.');
    this._showDecisionPanel([
      {icon:'☀',label: de?'Solarpark verkaufen':'Sell Solar Park',desc: de?'Für 400 gekauft.\nJetzt 560 wert (+40%).':'Bought for 400.\nNow worth 560 (+40%).',value:'sell_winner',color:0x4aaa5c},
      {icon:'🚏',label: de?'Straßenbahnlinie verkaufen':'Sell Tram Line',desc: de?'Für 400 gekauft.\nJetzt 280 wert (−30%).':'Bought for 400.\nNow worth 280 (−30%).',value:'sell_loser',color:0xe2a840}
    ],(c)=>{
      ScoringEngine.recordDecision(9,c,{phase:'pair'}); this._clearPersistentMessage();
      this._updateStats(0,0,6);
      const m = c==='sell_winner'
        ? (de ? 'Der Solarpark ist verkauft und der Gewinn fühlt sich gut an.\nDie Straßenbahnlinie bleibt — ihre Aussicht ist dieselbe, aber ihr Verlust steht noch in den Büchern.'
               : 'The Solar Park is sold and the gain feels good.\nThe Tram Line stays — its outlook is the same, but its loss is still on the books.')
        : (de ? 'Die Straßenbahnlinie ist verkauft und der Verlust wird real.\nDer Solarpark arbeitet weiter für die Stadt.'
               : 'The Tram Line is sold and the loss becomes real.\nThe Solar Park keeps working for the city.');
      this._showConsequence(m,()=>this._level9Twins());
    });
  }

  _level9Twins() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this._showPersistentMessage(de
      ? 'Zwei identische Werkstätten, gleiche Straße, gleiche Zukunft.\nDie Stadt kaufte eine früh und günstig, die andere später und teuer. Eine muss gehen.'
      : 'Two identical workshops, same street, same future.\nThe city bought one early and cheap, the other later and expensive. One must go.');
    this._showDecisionPanel([
      {icon:'🔨',label: de?'Werkstatt A verkaufen':'Sell Workshop A',desc: de?'Für 200 gekauft.\nHeute 300 wert.':'Bought for 200.\nWorth 300 today.',value:'sell_gain',color:0x4aaa5c},
      {icon:'🔨',label: de?'Werkstatt B verkaufen':'Sell Workshop B',desc: de?'Für 400 gekauft.\nHeute 300 wert.':'Bought for 400.\nWorth 300 today.',value:'sell_loss',color:0xe2a840},
      {icon:'⚖',label: de?'Egal welche':'Either one',desc: de?'Gleicher Wert, gleiche Zukunft.\nDer Kaufpreis ist Geschichte.':'Same value, same future.\nThe price paid is history.',value:'either',color:0x5c8ab0}
    ],(c)=>{
      ScoringEngine.recordDecision(9,c,{phase:'twin'}); this._clearPersistentMessage();
      this._updateStats(0,2,4);
      this._showConsequence(de
        ? 'Beide Werkstätten waren 300 wert und hatten dieselbe Zukunft.\nWas die Stadt einmal zahlte, ändert nicht, was jede von hier aus verdienen wird.'
        : 'Both workshops were worth 300 and had the same future.\nWhat the city once paid does not change what either will earn from here.',()=>this._nextLevel());
    });
  }

  // ══ LEVEL 10 — The Planning Desk (forecast calibration) ══
  _level10() {
    this._forecasts=[]; this._fcIndex=0;
    this._level10Ask();
  }

  _forecastOptions(){
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    return [
      {icon:'✔',label: de?'Ja — sehr sicher':'Yes — very sure',desc: de?'90% sicher':'90% confident',value:'y90',color:0x4aaa5c},
      {icon:'✓',label: de?'Ja — wahrscheinlich':'Yes — probably',desc: de?'65% sicher':'65% confident',value:'y65',color:0x296b72},
      {icon:'❓',label: de?'Keine Ahnung':'No idea',desc: de?'50 / 50':'50 / 50',value:'n50',color:0x6b7a8d},
      {icon:'✗',label: de?'Nein — wahrscheinlich':'No — probably',desc: de?'65% sicher':'65% confident',value:'x65',color:0xe2a840},
      {icon:'✘',label: de?'Nein — sehr sicher':'No — very sure',desc: de?'90% sicher':'90% confident',value:'x90',color:0xe74c3c}
    ];
  }
  _parseForecast(v){ return { pick: v==='n50'?null:v[0]==='y', conf: parseInt(v.slice(1),10) }; }

  _level10Ask() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const F=Assessment.FORECASTS, i=this._fcIndex;
    if (i>=F.length) return this._level10Reveal();
    this._showPersistentMessage((de?'Prognose ':'Forecast ')+(i+1)+' '+(de?'von ':'of ')+F.length+':\n'+F[i].q);
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const r=Assessment.forecastResult(this._forecasts);
    this.hud.advanceYear(1);
    const lines=Assessment.FORECASTS.map((q,i)=>{
      const f=this._forecasts[i]; const ok=f.pick===null?'–':(f.pick===q.outcome?'✔':'✘');
      return ok+'  '+q.q+'  → '+(q.outcome?(de?'Ja':'Yes'):(de?'Nein':'No'));
    }).join('\n');
    const summary='\n\n'+(de?'Durchschnittliche Konfidenz: ':'Average confidence: ')+Math.round(r.avgConf*100)+'%   ·   '+(de?'Korrekt: ':'Correct: ')+Math.round(r.hitRate*100)+'%'
      +(r.gap>0.1?(de?'\nDu warst zuversichtlicher als du recht hattest.':'\nYou were more confident than you were right.')
        :r.gap<-0.1?(de?'\nDu hattest öfter recht als erwartet.':'\nYou were right more often than you expected.')
        :(de?'\nDeine Konfidenz stimmte mit deiner Genauigkeit überein.':'\nYour confidence matched your accuracy closely.'))
      +(de?'\nVier Prognosen beschreiben diese Sitzung, nicht deine Persönlichkeit.':'\nFour forecasts describe this session, not your personality.');
    this._reportModal(de?'Wie sind die Prognosen verlaufen?':'How did the forecasts turn out?',lines+summary,()=>this._level10Practice());
  }

  _level10Practice() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const P=Assessment.PRACTICE;
    this._showPersistentMessage((de?'Eine Übungsprognose, jetzt wo du deine Ergebnisse gesehen hast:\n':'One practice forecast, now that you have seen your results:\n')+P.q);
    this._showDecisionPanel(this._forecastOptions(),(v)=>{
      const f=this._parseForecast(v);
      ScoringEngine.recordDecision(10,v,{phase:'practice',id:P.id,pick:f.pick,conf:f.conf,outcome:P.outcome});
      this._clearPersistentMessage();
      const ok=f.pick===null?(de?'Du hast 50/50 gesagt.':'You called it 50/50.'):(f.pick===P.outcome?(de?'Du hattest recht.':'You were right.'):(de?'Du lagst falsch.':'You were wrong.'));
      this._updateStats(2,4,0);
      this._showConsequence((de?'Das Verkehrsviertel hat sich tatsächlich erholt. ':'The transport district did recover. ')+ok+'\n'+(de?'Gute Prognostiker haben nicht immer recht — ihre Konfidenz passt dazu, wie oft sie recht haben.':'Good forecasters are not always right — their confidence matches how often they are.'),()=>this._finish());
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
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const btn=this.add.text(W/2,by+bh-this.s(36),(de?'Weiter →':'Continue →'),{
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
    // Corner messages sit inside the playable area, never under the side panel.
    const msgX=corner?this.PANEL+this.s(20):this._cx();
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
      const de=(typeof currentLang!=='undefined'&&currentLang==='de');
      const rTxt=this.add.text(rx+rw/2, ry+rh/2, de?'↺ Wiederholen':'↺ Retry level',{
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
      const de=(typeof currentLang!=='undefined'&&currentLang==='de');
      const lbl=de?'Weiter →':'Continue →';
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
