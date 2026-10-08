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
    this.groundY = groundY;
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
    this.snapshots = {};
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

    this._initAudio(); // Bug #10
    if(this.isCompact) this._addMuteButton(); // phones: side panel hidden
    this.input.keyboard.on('keydown-P', () => this._toProfile());
    this.events.removeAllListeners('resourceDropped');
    this.events.on('resourceDropped', ({district,value,cube}) => this._onResourceDropped(district,value,cube));
    this._introSequence();
  }

  s(v){ return Math.round(v * this.S); }
  _shake(d,i){ if(!this.reducedMotion && this.cameras && this.cameras.main) this.cameras.main.shake(d,i); }
  _cx(){ return this.PANEL + (this.W - this.PANEL)/2; }
  _availW(){ return this.W - this.PANEL - this.s(60); }

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

  _levelData(n) {
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
    return (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].levels)
      ? (TRANSLATIONS[lang].levels[n-1] || null) : null;
  }

  _buildDistricts() {
    const L = this.PANEL + this.s(132);
    const R = this.W - this.s(128);
    const span = R - L;
    const px = f => Math.round(L + span * f);
    const baseY = this.isCompact ? Math.round(this.H*0.53) : Math.round(Math.max(this.s(482),Math.min(this.H*0.46,this.H-this.s(420))));
    const compactPoints = this.isCompact ? [
      {x:this.W*.27,y:baseY}, {x:this.W*.72,y:baseY-this.s(22)},
      {x:this.W*.28,y:baseY+this.s(225)}, {x:this.W*.72,y:baseY+this.s(203)}
    ] : null;
    const metroPoints = (this.metro && !this.isCompact)
      ? this.metro.districtPoints.map(p => ({x:p.x, y:p.y}))
      : null;

    const pts = metroPoints || compactPoints;

    const at=(index,f,y)=>pts ? {cx:pts[index].x,cy:pts[index].y} : {cx:px(f),cy:y};
    const p0=at(0,.12,baseY+this.s(18)),p1=at(1,.38,baseY-this.s(34));
    const p2=at(2,.375,baseY-this.s(34));
    const p3=at(3,.88,baseY+this.s(18));

    this.districts = [
      new District(this, {id:'housing',tag:'Safe & Steady',tagDE:'Sicher & stetig',name:'Housing',nameDE:'Wohnviertel',label:'Housing District',labelDE:'Wohnviertel',
        color:0xc96b4b,darkColor:0x6f9c62,accentColor:0xd87c5c,cx:p0.cx,cy:p0.cy,health:45,scale:this.S*1.16,
        tooltip:'Stable homes for citizens.\nLow risk, steady growth.\nLike bonds in a portfolio.',
        tooltipDE:'Stabile Häuser für Bürger.\nGeringes Risiko, stetiges Wachstum.'}),
      new District(this, {id:'transport',tag:'Reliable Returns',tagDE:'Verlässliche Erträge',name:'Transport',nameDE:'Verkehrsviertel',label:'Transport District',labelDE:'Verkehrsviertel',
        color:0x4f8fa0,darkColor:0x6f9c62,accentColor:0x4f9aa4,cx:p1.cx,cy:p1.cy,health:45,scale:this.S*1.16,
        tooltip:'Roads and transit connect the city.\nModerate risk, reliable returns.',
        tooltipDE:'Straßen verbinden die Stadt.\nModerates Risiko, zuverlässige Erträge.'}),
      new District(this, {id:'technology',tag:'High Potential',tagDE:'Hohes Potenzial',name:'Technology',nameDE:'Technologieviertel',label:'Technology District',labelDE:'Technologieviertel',
        color:0x557b89,darkColor:0x6f9c62,accentColor:0x296b72,cx:p2.cx,cy:p2.cy,health:45,scale:this.S*1.16,labelLift:46,
        tooltip:'High growth potential.\nHigh uncertainty.\nCan double — or fall sharply.',
        tooltipDE:'Hohes Wachstumspotenzial.\nHohe Unsicherheit.'}),
      new District(this, {id:'energy',tag:'Essential Base',tagDE:'Grundversorgung',name:'Energy',nameDE:'Energieviertel',label:'Energy District',labelDE:'Energieviertel',
        color:0xe0a82e,darkColor:0x6f9c62,accentColor:0xe0a82e,cx:p3.cx,cy:p3.cy,health:45,scale:this.S*1.16,
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
      rx += this.s(8); ry += this.s(6);
      ring = buildRing(rx, ry, 1);
      guard++;
    }

    ring = ring.map(p => ({ ...p, y: Math.max(groundY, p.y) }));

    if (!this._cityBoundaryGfx) this._cityBoundaryGfx = this.add.graphics().setDepth(2);
    const g = this._cityBoundaryGfx;
    g.clear();
    g.lineStyle(this.s(2), 0x173b40, 0.12);
    g.beginPath();
    ring.forEach((p,i) => i===0 ? g.moveTo(p.x,p.y) : g.lineTo(p.x,p.y));
    g.closePath(); g.strokePath();
  }

  _msgY() {
    const hudH = this.hud && Number.isFinite(this.hud.height) ? this.hud.height : this.s(56);
    return hudH + this.s(14);
  }

  _introSequence() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const splash = this.add.text(this._cx(), this.H*0.38,
      de ? this.cityName+'\nWillkommen in deiner Stadt.' : this.cityName+'\nWelcome to your city.',
      { fontFamily:CityTheme.heading, fontSize:this.s(36), color:'#173b40',
        align:'center', stroke:'#fffbf1', strokeThickness:this.s(4),
        lineSpacing:this.s(8) }).setOrigin(0.5).setDepth(70).setAlpha(0);
    this.tweens.add({targets:splash,alpha:1,duration:700,hold:1200,yoyo:true,
      onComplete:()=>{ splash.destroy(); this._introLevelTitleShown=true; this._startLevel(1); }});
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
    let proceedCalled = false;
    const proceed = () => {
      if (proceedCalled) return; // guard against Tutorial auto-close firing after user already clicked
      proceedCalled = true;
      this.tutorial.hide(); // cancel any pending auto-close timer
      // The very first time Level 1 starts, show city tour (Bug #4), then panel intro
      if (n===1 && !this._panelIntroShown) {
        this._panelIntroShown = true;
        this._cityTour(() => { run(); }); // tour done → start level 1 directly
      } else {
        run();
      }
    };
    if (skipTutorial || n===1) proceed(); // Level 1 skips the Tutorial card — city tour covers it
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
    // Bug #10: level transition sound; Bug #5: disable tooltips after level 1
    this._playTransition();
    if(this.currentLevel===1){
      this.districts.forEach(d=>{ if(d.disableTooltip) d.disableTooltip(); });
    }
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
    const storyText = ld && ld.story ? ld.story : this._tr('level1.story', 'Tap one of the districts below to start growing your city.');
    const guideText = ld && ld.guide ? ld.guide : this._tr('game.guideDefault', 'Read the situation. Choose a district to begin.');
    {
      this._showPersistentMessage(storyText);
      ch.forEach((o)=>{ o.d.setSelectable(true, ()=>this._onLevel1Choice(o.d,o.v)); });
    }
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
    this._addLandmark(d,'🏗', this._tr('level1.builtHere', 'Built first here'), d.accentColor);
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
  _level2() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this._workersLeave(); this.districts[2].takeDamage(28); this._updateStats(-5,-8,0);
    const ld = this._levelData(2);
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level2.story', 'The technology district has lost value.\nHeadlines are alarming, but nothing concrete has changed.\nWhat does the city do?');
    this.time.delayedCall(700,()=>{
      const guideText2 = ld && ld.guide ? ld.guide : this._tr('guide.default', 'Read the situation. Make your choice.');
      const opts = ld && ld.options ? ld.options : null;
      // Bug #1: show guide first, then story + decision panel
      {
      this._showPersistentMessage(storyMsg);
      this._showDecisionPanel([
        {icon:'🛡',label: opts && opts[0] ? opts[0].label : this._tr('level2.opt0', 'Cancel project'), desc: opts && opts[0] ? opts[0].description : this._tr('level2.opt0desc', 'Stop work now,\nkeep the resources'),value:'cancel',color:0x3a5f8a},
        {icon:'🏗',label: opts && opts[1] ? opts[1].label : this._tr('level2.opt1', 'Push through'), desc: opts && opts[1] ? opts[1].description : this._tr('level2.opt1desc', 'Finish as planned,\naccept the dip'),value:'continue',color:0x4aaa5c},
        {icon:'💰',label: opts && opts[2] ? opts[2].label : this._tr('level2.opt2', 'Invest more'), desc: opts && opts[2] ? opts[2].description : this._tr('level2.opt2desc', 'Double down\non the district'),value:'invest_more',color:0xddaa00},
        {icon:'⏳',label: opts && opts[3] ? opts[3].label : this._tr('level2.opt3', 'Pause & reassess'), desc: opts && opts[3] ? opts[3].description : this._tr('level2.opt3desc', 'Halt work now,\ndecide again later'),value:'wait',color:0x6b7a8d}
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
      } // end guide-free block
    });
  }

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

  _level2News() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this.time.delayedCall(300,()=>{
      this.districts[1].takeDamage(30); this._updateStats(-5,-8,0);
      this._shake(200,0.003);
      this.time.delayedCall(500,()=>{
        const newsStory = this._tr('level2.newsStory', 'Now the transport district is falling.\nThis time there is real news: its largest employer\nis leaving the city for good. What does the city do?');
        const ld = this._levelData(2);
        const opts = ld && ld.options ? ld.options : null;
        // Bug #1: guide then story + panel
        {
        this._showPersistentMessage(newsStory);
        this._showDecisionPanel([
          {icon:'🛡',label: opts && opts[0] ? opts[0].label : this._tr('level2news.opt0','Cut losses'), desc: de?'Distriktvermögen verkaufen\nbevor es schlimmer wird':'Sell the district assets\nbefore it gets worse',value:'cancel',color:0x3a5f8a},
          {icon:'🏗',label: opts && opts[1] ? opts[1].label : this._tr('level2news.opt1','Hold on'), desc: de?'Alles behalten,\nauf Erholung hoffen':'Keep everything,\nhope it turns around',value:'continue',color:0x4aaa5c},
          {icon:'💰',label: opts && opts[2] ? opts[2].label : this._tr('level2news.opt2','Invest more'), desc: de?'Auf das Viertel\nverdoppeln':'Double down\non the district',value:'invest_more',color:0xddaa00},
          {icon:'⏳',label: opts && opts[3] ? opts[3].label : this._tr('level2news.opt3','Pause & reassess'), desc: de?'Arbeit anhalten,\nspäter neu entscheiden':'Halt work now,\ndecide again later',value:'wait',color:0x6b7a8d}
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
        } // end guide-free block
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
    this.districts.forEach(d=>d.setSelectable(true,dd=>this._tapAllocate(dd)));
    this._showLevel3Progress();
    this._level3Idle();
  }

  _showLevel3Progress() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const placed=this.cubeDropped||0;
    this._showPersistentMessage(de
      ? `600 neue Credits\nZiehe jede Münze in die Mitte eines Viertels\noder tippe ein Viertel an.\n${placed} von 6 platziert.`
      : `600 new credits\nDrop each coin on the centre of a district\nor tap a district to send the next coin.\n${placed} of 6 placed.`,{corner:true});
  }

  _tapAllocate(district) {
    if(this.currentLevel!==3 || this._level3Resolved) return;
    const cube=(this.cubes||[]).find(c=>c&&!c._used&&!c.isDragging&&c.container&&c.container.active);
    if(cube) cube._dropOnDistrict(district);
  }

  _spawnResourceCubes(n) {
    this.cubeTotal=n; this.cubeDropped=0;
    const usableTop=Math.max(this._msgY()+this.s(130),this.H*(this.isCompact ? 0.38 : 0.44));
    if(this.isCompact){
      const gap=Math.min(this.s(70),(this.W-this.s(80))/(n-1));
      const start=this.W/2-gap*(n-1)/2;
      for(let i=0;i<n;i++) this.time.delayedCall(i*70,()=>{
        if(this.currentLevel===3) this.cubes.push(new ResourceCube(this,start+i*gap,this.H-this.s(70),1));
      });
      return;
    }
    const x=this.PANEL+this.s(48);
    const gap=Math.max(this.s(48),Math.min(this.s(66),(this.H-usableTop-this.s(50))/(n-1)));
    for(let i=0;i<n;i++) this.time.delayedCall(i*70,()=>{
      if(this.currentLevel===3) this.cubes.push(new ResourceCube(this,x,usableTop+i*gap,1));
    });
  }

  _level3Idle() {
    this._clearLevel3Idle();
    this._level3IdleTimer = this.time.delayedCall(9000,()=>{
      if(this.cubeDropped<this.cubeTotal) this._showDropRetry();
    });
  }
  _clearLevel3Idle(){
    if(this._level3IdleTimer){this._level3IdleTimer.remove(false);this._level3IdleTimer=null;}
  }

  _onResourceDropped(district,value,cube) {
    if(this.currentLevel!==3 || this._level3Resolved)return;
    if(!this._level3PlacedCubes)this._level3PlacedCubes=new Set();
    if(!cube||this._level3PlacedCubes.has(cube))return;
    this._level3PlacedCubes.add(cube);
    this.cubeDropped=this._level3PlacedCubes.size;
    this._shake(160,0.003);
    ScoringEngine.recordDecision(3,'allocate',{districtId:district.id,value});
    this._updateStats(2,4,-3);
    if(this.cubeDropped>=this.cubeTotal){
      this._level3Resolved=true;
      this._clearLevel3Idle();
      this.districts.forEach(d=>d.setSelectable(false));
      const counts={};
      (ScoringEngine.decisions||[]).filter(d=>d.level===3).forEach(d=>{counts[d.districtId]=(counts[d.districtId]||0)+1;});
      const spread=Object.entries(counts).map(([k,n])=>`${Number(n)*100} in ${k}`).join(', ');
      const de=(typeof currentLang!=='undefined'&&currentLang==='de');
      this._showPersistentMessage(de
        ? `Alle sechs platziert.\nDeine Credits: ${spread}.\nNächstes Jahr wird ein unbekanntes Viertel getroffen.`
        : `All six placed.\nYour credits: ${spread}.\nNext year one unknown district will be hit.`,{corner:true});
      this.time.delayedCall(2600,()=>{this._clearPersistentMessage();this._level3Outcome();});
    } else {
      this._showLevel3Progress();
      this._level3Idle();
    }
  }

  _level3Outcome() {
    this.districts.forEach(d=>d.setSelectable(false));
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const loser=this.districts[Phaser.Math.Between(0,3)];
    const placed=(ScoringEngine.decisions||[]).filter(d=>d.level===3&&d.districtId===loser.id).length;
    const exposed=placed*100, lost=Math.round(exposed*.4), share=placed/(this.cubeTotal||6);
    loser.takeDamage(8+Math.round(40*share));
    this._shake(120+Math.round(400*share),.002+.006*share);
    this._updateStats(-Math.round(10*share),-Math.round(15*share),0);
    const name=de?(loser.nameDE||loser.name):loser.name;
    this._showConsequence(de
      ? `Das ${name}-Viertel fällt um 40 %.\nDu hattest ${exposed} Credits dort → Verlust: ${lost} Credits.`
      : `The ${name} district fell 40%.\nYou had ${exposed} credits there → you lost ${lost} credits.`,()=>this._nextLevel());
  }

  // ══ LEVEL 4 ══
  _level4() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(4);
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level4.story', 'A new opportunity: invest now for immediate gain, or wait for a potentially larger future reward.');
    const opts = ld && ld.options ? ld.options : null;
    this._showPersistentMessage(storyMsg);
    this._showDecisionPanel([
      {icon:'💵',label: opts && opts[0] ? opts[0].label : this._tr('level4.opt0','Take it now'), desc: opts && opts[0] ? opts[0].description : this._tr('level4.opt0desc','Certain gain today'),value:'now',color:0x4aaa5c},
      {icon:'⏰',label: opts && opts[1] ? opts[1].label : this._tr('level4.opt1','Wait'), desc: opts && opts[1] ? opts[1].description : this._tr('level4.opt1desc','Possible larger gain later'),value:'wait',color:0x5c8ab0}
    ],(c)=>{
      ScoringEngine.recordDecision(4,c);
      this._clearPersistentMessage();
      const e={now:{d:[5,8,-8],m:this._tr('level4.now','You took the immediate gain.\nSmall but certain progress.')},
               wait:{d:[-3,12,5],m:this._tr('level4.wait','You waited.\nThe future reward arrives, larger than expected.')}}[c]
               ||{d:[0,5,0],m:'Decision made.'};
      this._updateStats(e.d[0],e.d[1],e.d[2]);
      this._showConsequence(e.m,()=>this._nextLevel());
    });
  }

  // ══ LEVEL 5 ══
  _level5() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(5);
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level5.story', 'The city is booming! Everyone wants to invest.\nBut is this growth sustainable, or is it a bubble?');
    const opts = ld && ld.options ? ld.options : null;
    this._showPersistentMessage(storyMsg);
    this.districts.forEach(d=>d.receiveResource(1));
    this._showDecisionPanel([
      {icon:'🚀',label: opts && opts[0] ? opts[0].label : this._tr('level5.opt0','Ride the boom'), desc: opts && opts[0] ? opts[0].description : this._tr('level5.opt0desc','Invest heavily now'),value:'ride',color:0xddaa00},
      {icon:'🛡',label: opts && opts[1] ? opts[1].label : this._tr('level5.opt1','Stay cautious'), desc: opts && opts[1] ? opts[1].description : this._tr('level5.opt1desc','Protect what you have'),value:'cautious',color:0x5c8ab0},
      {icon:'📊',label: opts && opts[2] ? opts[2].label : this._tr('level5.opt2','Diversify'), desc: opts && opts[2] ? opts[2].description : this._tr('level5.opt2desc','Spread across all sectors'),value:'diversify',color:0x9966cc}
    ],(c)=>{
      ScoringEngine.recordDecision(5,c);
      this._clearPersistentMessage();
      const e={ride:{d:[8,15,-18],m:this._tr('level5.ride','You rode the boom.\nGrowth was spectacular — until it wasn\'t.')},
               cautious:{d:[3,5,8],m:this._tr('level5.cautious','Cautious approach paid off.\nThe boom fades, but you\'re stable.')},
               diversify:{d:[6,10,-5],m:this._tr('level5.diversify','Diversified investment.\nSome sectors soar, others slide.')}}[c]
               ||{d:[0,5,0],m:'Decision made.'};
      this._updateStats(e.d[0],e.d[1],e.d[2]);
      this._showConsequence(e.m,()=>this._nextLevel());
    });
  }

  // ══ LEVEL 6 — a delegation drives in from the neighbouring city ══
  _level6() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(6);
    const arrivalMsg = this.metro
      ? this._tr('level6.arrival', 'A ship from the neighbouring city is sailing up the river with an investment offer...')
      : this._tr('level6.arrivalAlt', 'A delegation is arriving from the neighbouring city...');
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
      ? this._tr('level6.fullPicture', 'You have the full picture. What does the city do?')
      : (ld && ld.story ? ld.story : this._tr('level6.story', 'They offer to share their water infrastructure.\nWhat does the city do?')));
    const panelOpts=[
      {icon:'🤝',label: opts && opts[0] ? opts[0].label : this._tr('level6.opt0','Accept offer'), desc: opts && opts[0] ? opts[0].description : this._tr('level6.opt0desc','200 resources now.\nSome dependency risk.'),value:'accept',color:0x296b72},
      {icon:'🏗',label: opts && opts[1] ? opts[1].label : this._tr('level6.opt1','Build own'), desc: opts && opts[1] ? opts[1].description : this._tr('level6.opt1desc','400 resources.\nFull control.'),value:'independent',color:0x4aaa5c},
      {icon:'❌',label: opts && opts[2] ? opts[2].label : this._tr('level6.opt2','Decline both'), desc: opts && opts[2] ? opts[2].description : this._tr('level6.opt2desc','Keep resources\nfor other priorities.'),value:'decline',color:0x6b7a8d}
    ];
    if (!hasRead) panelOpts.push({icon:'🔍',label: opts && opts[3] ? opts[3].label : this._tr('level6.opt3','Research first'), desc: opts && opts[3] ? opts[3].description : this._tr('level6.opt3desc','Gather more info\nbefore deciding.'),value:'research',color:0xe2a840});
    this._showDecisionPanel(panelOpts,(c)=>{
      this._clearPersistentMessage();
      if(c==='research'){
        ScoringEngine.recordDecision(6,'research');
        const reportTitle = ld && ld.offer ? ld.offer.title : this._tr('level6.reportTitle','Delegation Report');
        const reportText = this._tr('level6.reportText','Their infrastructure is well maintained but ties your city to their maintenance schedule. Building independently costs more but removes any dependency. Declining keeps every option open for later.');
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
        accept: {d:[10,10,-5], m: acceptMsg||this._tr('level6.acceptResult','The city accepts the offer.\nResources flow in. Some dependency is the price.')},
        independent: {d:[5,15,-20], m: indMsg||this._tr('level6.indResult','The city builds its own infrastructure.\nCostly, but fully under control.')},
        decline: {d:[-5,-5,15], m: decMsg||this._tr('level6.decResult','The city declines.\nResources saved, but the opportunity passes.')}
      }[c]||{d:[0,0,0],m:'Decision recorded.'};
      this._updateStats(m.d[0],m.d[1],m.d[2]);
      if(c==='accept') this._celebrateCity(this._tr('level6.celebrate','🤝 Partnership!'));
      this._showConsequence(m.m,()=>this._nextLevel());
    });
  }

  // ══ LEVEL 7 ══
  _level7() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(7);
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level7.story', 'Breaking news: a scandal rocks the transport district.\nThe facts are unclear. How does the city respond?');
    const opts = ld && ld.options ? ld.options : null;
    this._showPersistentMessage(storyMsg);
    this.districts[1].takeDamage(15); this._shake(180,0.003);
    this.time.delayedCall(1400,()=>{
      this._showDecisionPanel([
        {icon:'🔍',label: opts && opts[0] ? opts[0].label : this._tr('level7.opt0','Investigate'), desc: opts && opts[0] ? opts[0].description : this._tr('level7.opt0desc','Commission a full audit'),value:'investigate',color:0x3a5f8a},
        {icon:'🗣',label: opts && opts[1] ? opts[1].label : this._tr('level7.opt1','Communicate'), desc: opts && opts[1] ? opts[1].description : this._tr('level7.opt1desc','Issue a statement quickly'),value:'communicate',color:0x4aaa5c},
        {icon:'⏳',label: opts && opts[2] ? opts[2].label : this._tr('level7.opt2','Wait it out'), desc: opts && opts[2] ? opts[2].description : this._tr('level7.opt2desc','Let the story fade naturally'),value:'wait',color:0x6b7a8d}
      ],(c)=>{
        ScoringEngine.recordDecision(7,c);
        this._clearPersistentMessage();
        const e={investigate:{d:[5,-8,-12],m:this._tr('level7.investResult','The investigation reveals mixed results.\nTransparency costs resources but builds trust.')},
                 communicate:{d:[8,-5,-5],m:this._tr('level7.commResult','Quick communication helps.\nThe narrative shifts in the city\'s favour.')},
                 wait:{d:[-8,-12,5],m:this._tr('level7.waitResult','Waiting backfires.\nRumours fill the silence. Trust erodes.')}}[c]
                 ||{d:[0,0,0],m:'Decision recorded.'};
        this._updateStats(e.d[0],e.d[1],e.d[2]);
        this._showConsequence(e.m,()=>this._nextLevel());
      });
    });
  }

  // ══ LEVEL 8 ══
  _level8() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(8);
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level8.story', 'A great storm hits the city.\nInfrastructure is damaged. The city must respond.');
    const opts = ld && ld.options ? ld.options : null;
    this._showPersistentMessage(storyMsg);
    this.districts.forEach(d=>d.takeDamage(12)); this._shake(280,0.005);
    this.time.delayedCall(1600,()=>{
      if(!this.hasUniversity){
        const uText = this._tr('level8.universityReveal', 'A university district emerges from the storm\'s aftermath—innovation will speed recovery.');
        this._tempMessage(uText, 2800, 1200);
        this.hasUniversity=true;
      }
      this._showDecisionPanel([
        {icon:'🚑',label: opts && opts[0] ? opts[0].label : this._tr('level8.opt0','Emergency response'), desc: opts && opts[0] ? opts[0].description : this._tr('level8.opt0desc','Focus on immediate relief'),value:'emergency',color:0xcc4444},
        {icon:'🏗',label: opts && opts[1] ? opts[1].label : this._tr('level8.opt1','Rebuild stronger'), desc: opts && opts[1] ? opts[1].description : this._tr('level8.opt1desc','Invest in resilient infrastructure'),value:'rebuild',color:0x4aaa5c},
        {icon:'🤝',label: opts && opts[2] ? opts[2].label : this._tr('level8.opt2','Seek external aid'), desc: opts && opts[2] ? opts[2].description : this._tr('level8.opt2desc','Accept help from neighbours'),value:'aid',color:0x5c8ab0}
      ],(c)=>{
        ScoringEngine.recordDecision(8,c);
        this._clearPersistentMessage();
        const e={emergency:{d:[12,-5,-15],m:this._tr('level8.emResult','Emergency response prioritised.\nCitizens feel supported. Recovery is slower.')},
                 rebuild:{d:[5,15,-20],m:this._tr('level8.rebResult','Rebuilding with resilience.\nCostly now, much stronger for the future.')},
                 aid:{d:[8,8,-8],m:this._tr('level8.aidResult','External aid arrives.\nRecovery is swift. Some dependency follows.')}}[c]
                 ||{d:[0,0,0],m:'Decision recorded.'};
        this._updateStats(e.d[0],e.d[1],e.d[2]);
        this.districts.forEach(d=>d.receiveResource(1));
        this._showConsequence(e.m,()=>this._nextLevel());
      });
    });
  }

  // ══ LEVEL 9 — The Project Review (disposition effect) ══
  _level9() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this._showPersistentMessage(de
      ? 'Die Stadt braucht Geld für das Budget im nächsten Jahr. Ein Projekt muss verkauft werden.\nAnalysten bewerten beide Projekte ab heute exakt gleich.'
      : 'The city needs cash for next year’s budget. It must sell one project.\nAnalysts rate both with exactly the same outlook from here.');
    this._showDecisionPanel([
      {icon:'☀',label:de?'Solarpark verkaufen':'Sell Solar Park',desc:de?'Für 400 gekauft.\nHeute 560 wert (+40 %).':'Bought for 400.\nNow worth 560 (+40%).',value:'sell_winner',color:0x4aaa5c},
      {icon:'🚋',label:de?'Straßenbahn verkaufen':'Sell Tram Line',desc:de?'Für 400 gekauft.\nHeute 280 wert (−30 %).':'Bought for 400.\nNow worth 280 (−30%).',value:'sell_loser',color:0xe2a840}
    ],(c)=>{
      ScoringEngine.recordDecision(9,c,{phase:'pair'});
      this._clearPersistentMessage();
      this._updateStats(0,0,6);
      const msg=c==='sell_winner'
        ? (de?'Der Solarpark wird verkauft und der Gewinn fühlt sich gut an.\nDie Straßenbahn bleibt — gleicher Ausblick, aber der Verlust steht weiter in den Büchern.':'The Solar Park is sold and the gain feels good.\nThe Tram Line stays — its outlook is the same, but its loss is still on the books.')
        : (de?'Die Straßenbahn wird verkauft und der Verlust wird real.\nDer Solarpark arbeitet weiter für die Stadt.':'The Tram Line is sold and the loss becomes real.\nThe Solar Park keeps working for the city.');
      this._showConsequence(msg,()=>this._level9Twins());
    });
  }

  _level9Twins() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this._showPersistentMessage(de
      ? 'Zwei identische Werkstätten, gleiche Straße, gleiche Zukunft.\nDie Stadt kaufte eine früh und günstig, die andere später und teuer. Eine muss gehen.'
      : 'Two identical workshops, same street, same future.\nThe city bought one early and cheap, the other later and expensive. One must go.');
    this._showDecisionPanel([
      {icon:'🔨',label:de?'Werkstatt A verkaufen':'Sell Workshop A',desc:de?'Für 200 gekauft.\nHeute 300 wert.':'Bought for 200.\nWorth 300 today.',value:'sell_gain',color:0x4aaa5c},
      {icon:'🔨',label:de?'Werkstatt B verkaufen':'Sell Workshop B',desc:de?'Für 400 gekauft.\nHeute 300 wert.':'Bought for 400.\nWorth 300 today.',value:'sell_loss',color:0xe2a840},
      {icon:'⚖',label:de?'Eine von beiden':'Either one',desc:de?'Gleicher Wert, gleiche Zukunft.\nDer Kaufpreis ist Vergangenheit.':'Same value, same future.\nThe price paid is history.',value:'either',color:0x5c8ab0}
    ],(c)=>{
      ScoringEngine.recordDecision(9,c,{phase:'twin'}); this._clearPersistentMessage();
      this._updateStats(0,2,4);
      this._showConsequence(de
        ? 'Beide Werkstätten waren 300 wert und hatten dieselbe Zukunft.\nWas die Stadt einst zahlte, ändert ihre künftigen Erträge nicht.'
        : 'Both workshops were worth 300 and had the same future.\nWhat the city once paid does not change what either will earn from here.',()=>this._nextLevel());
    });
  }

  // ══ LEVEL 10 — The Planning Desk (forecast calibration) ══
  _level10() {
    this._forecasts=[]; this._fcIndex=0; this._level10Ask();
  }

  _forecastOptions(){
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    return [
      {icon:'✔',label:de?'Ja — sehr sicher':'Yes — very sure',desc:de?'90 % sicher':'90% confident',value:'y90',color:0x4aaa5c},
      {icon:'✓',label:de?'Ja — wahrscheinlich':'Yes — probably',desc:de?'65 % sicher':'65% confident',value:'y65',color:0x4ecdc4},
      {icon:'❓',label:de?'Keine Ahnung':'No idea',desc:'50 / 50',value:'n50',color:0x6b7a8d},
      {icon:'✗',label:de?'Nein — wahrscheinlich':'No — probably',desc:de?'65 % sicher':'65% confident',value:'x65',color:0xe2a840},
      {icon:'✘',label:de?'Nein — sehr sicher':'No — very sure',desc:de?'90 % sicher':'90% confident',value:'x90',color:0xe74c3c}
    ];
  }
  _parseForecast(v){return{pick:v==='n50'?null:v[0]==='y',conf:parseInt(v.slice(1),10)};}

  _level10Ask() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const F=Assessment.FORECASTS,i=this._fcIndex;
    if(i>=F.length)return this._level10Reveal();
    this._showPersistentMessage((de?'Prognose ':'Forecast ')+(i+1)+' '+(de?'von':'of')+' '+F.length+':\n'+F[i].q);
    this._showDecisionPanel(this._forecastOptions(),(v)=>{
      const f=this._parseForecast(v);
      ScoringEngine.recordDecision(10,v,{phase:'forecast',id:F[i].id,pick:f.pick,conf:f.conf,outcome:F[i].outcome});
      this._forecasts.push(Object.assign({outcome:F[i].outcome},f));
      this._clearPersistentMessage();
      this._fcIndex++;
      this.time.delayedCall(250,()=>this._level10Ask());
    });
  }

  _level10Reveal(index=0) {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    if(index<Assessment.FORECASTS.length){
      const q=Assessment.FORECASTS[index],f=this._forecasts[index];
      const unsure=f.pick===null,correct=f.pick===q.outcome;
      const verdict=unsure?(de?'Keine feste Prognose':'No firm prediction'):
        correct?(de?'✓ Deine Prognose traf ein':'✓ Your prediction matched the outcome'):
        (de?'✗ Deine Prognose traf nicht ein':'✗ Your prediction did not match');
      const answer=v=>v?(de?'Ja':'Yes'):(de?'Nein':'No');
      const events=de?[
        'Das Wohnviertel gewann an Wert.',
        'Die Energiekosten fielen nicht um mehr als 10 %.',
        'Technologie übertraf Verkehr nicht.',
        'Die Zufriedenheit stieg bis zum Jahresende.'
      ]:[
        'Housing gained value.',
        'Energy costs did not fall by more than 10%.',
        'Technology did not outperform transport.',
        'Citizen happiness finished the year higher.'
      ];
      this._reportModal((de?'Ergebnis ':'Outcome ')+(index+1)+' / 4',
        q.q+'\n\n'+(de?'Deine Antwort: ':'Your answer: ')+(unsure?'50 / 50':answer(f.pick))+
        ' · '+f.conf+'% '+(de?'sicher':'confident')+'\n\n'+events[index]+'\n'+verdict+
        '\n\n'+(de?'Ein einzelnes Ergebnis macht eine Entscheidung nicht gut oder schlecht.':'One outcome does not make a decision good or bad.'),
        ()=>this._level10Reveal(index+1));
      return;
    }
    const r=Assessment.forecastResult(this._forecasts);
    this.hud.advanceYear(1);
    const summary=(de?'Durchschnittliche Sicherheit: ':'Average confidence: ')+Math.round(r.avgConf*100)+'%\n'+
      (de?'Trefferquote: ':'Accuracy: ')+Math.round(r.hitRate*100)+'%'+
      (r.gap>.1?(de?'\n\nDu warst sicherer, als du richtig lagst.':'\n\nYou were more confident than you were right.'):r.gap<-.1?(de?'\n\nDu lagst öfter richtig, als du erwartet hast.':'\n\nYou were right more often than you expected.'):(de?'\n\nDeine Sicherheit passte gut zu deiner Trefferquote.':'\n\nYour confidence matched your accuracy closely.'))+
      (de?'\n\nVier Prognosen beschreiben diese Sitzung, nicht deine Persönlichkeit.':'\n\nFour forecasts describe this session, not your personality.');
    this._reportModal(de?'Deine vier Prognosen':'Your four forecasts',summary,()=>this._level10Practice());
  }

  _level10Practice() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const P=Assessment.PRACTICE;
    this._showPersistentMessage((de?'Eine Übungsprognose, nachdem du deine Ergebnisse gesehen hast:\n':'One practice forecast, now that you have seen your results:\n')+P.q);
    this._showDecisionPanel(this._forecastOptions(),v=>{
      const f=this._parseForecast(v);
      ScoringEngine.recordDecision(10,v,{phase:'practice',id:P.id,pick:f.pick,conf:f.conf,outcome:P.outcome});
      this._clearPersistentMessage();
      const result=f.pick===null?(de?'Du nanntest 50/50.':'You called it 50/50.'):(f.pick===P.outcome?(de?'Du lagst richtig.':'You were right.'):(de?'Du lagst falsch.':'You were wrong.'));
      this._updateStats(2,4,0);
      this._showConsequence((de?'Das Verkehrsviertel erholte sich. ':'The transport district did recover. ')+result+'\n'+(de?'Gute Prognosen sind nicht immer richtig — ihre Sicherheit passt dazu, wie oft sie stimmen.':'Good forecasters are not always right — their confidence matches how often they are.'),()=>this._finish());
    });
  }

  _finish() {
    this._clearConsequence(); this._clearWorldBtn();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,10);
    const overlay=this.add.graphics().setDepth(190),fade={alpha:0};
    this.tweens.add({targets:fade,alpha:1,duration:1800,onUpdate:()=>{overlay.clear();overlay.fillStyle(0x061019,fade.alpha);overlay.fillRect(0,0,this.W,this.H);},onComplete:()=>this._toProfile()});
  }

  // City-wide celebration burst
  _celebrateCity(bannerText){
    this._playCelebration(); // Bug #10
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

  _firework(x,y){
    const colors=[0xff6b6b,0xffcc44,0x44ddaa,0x66aaff,0xffaaee];
    for(let i=0;i<12;i++){
      const p=this.add.graphics().setDepth(90);
      p.fillStyle(colors[i%colors.length],1);
      p.fillCircle(0,0,this.s(3.5));
      p.setPosition(x,y);
      const a=(i/12)*Math.PI*2;
      const spd=Phaser.Math.Between(60,130);
      this.tweens.add({targets:p,x:x+Math.cos(a)*spd,y:y+Math.sin(a)*spd,alpha:0,duration:Phaser.Math.Between(500,900),onComplete:()=>p.destroy()});
    }
  }

  _reportModal(title, text, onClose) {
    const cx=this._cx(),pw=Math.min(this.s(680),this._availW());
    const ink='#'+CityTheme.colors.ink.toString(16).padStart(6,'0');
    const paper='#'+CityTheme.colors.paper.toString(16).padStart(6,'0');
    const ttl=this.add.text(cx,0,title,{fontFamily:CityTheme.heading,fontSize:this.s(22),color:ink,fontStyle:'700',align:'center',wordWrap:{width:pw-this.s(48)}}).setOrigin(.5,0).setDepth(92);
    const txt=this.add.text(cx,0,text,{fontFamily:CityTheme.body,fontSize:this.s(17),color:ink,align:'center',wordWrap:{width:pw-this.s(48)},lineSpacing:this.s(5)}).setOrigin(.5,0).setDepth(92);
    const maxH=this.H-this.s(48);
    while(ttl.height+txt.height+this.s(130)>maxH && parseInt(txt.style.fontSize,10)>this.s(12)) txt.setFontSize(parseInt(txt.style.fontSize,10)-1);
    const ph=ttl.height+txt.height+this.s(130),py=(this.H-ph)/2,px=cx-pw/2;
    const dim=this.add.graphics().setDepth(90);
    dim.fillStyle(CityTheme.colors.ink,.55);dim.fillRect(0,0,this.W,this.H);
    const bg=this.add.graphics().setDepth(91);
    CityTheme.panel(bg,px,py,pw,ph);
    ttl.y=py+this.s(24);txt.y=ttl.y+ttl.height+this.s(18);
    const btn=this.add.text(cx,py+ph-this.s(32),this._tr('guide.continue','Continue →'),{
      fontFamily:CityTheme.body,fontSize:this.s(17),color:paper,
      backgroundColor:'#'+CityTheme.colors.teal.toString(16),padding:{x:this.s(24),y:this.s(10)}
    }).setOrigin(.5).setDepth(92).setInteractive({useHandCursor:true});
    btn.on('pointerdown',()=>{[dim,bg,ttl,txt,btn].forEach(e=>e.destroy());if(onClose)onClose();});
  }

  _saveSnapshot(n){
    this.snapshots[n]={
      happiness:this.cityStats.happiness,
      development:this.cityStats.development,
      resources:this.cityStats.resources,
      districts:this.districts.map(d=>({health:d.health}))
    };
  }

  _restoreSnapshot(n){
    const s=this.snapshots[n]; if(!s)return;
    this.cityStats.happiness=s.happiness;
    this.cityStats.development=s.development;
    this.cityStats.resources=s.resources;
    this.statsPanel.updateStats(s.happiness,s.development,s.resources);
    if(s.districts) s.districts.forEach((sd,i)=>{ if(this.districts[i]) this.districts[i].health=sd.health; });
  }

  // Bug #1: Show guide text with Continue button; calls onContinue when clicked
  _showGuide(text, onContinue) {
    this._clearPersistentMessage();
    const cx = this._cx();
    const msgWidth = Math.min(this.s(560), this._availW());
    const cy = this.H / 2;
    const ph = this.s(220);
    const py = cy - ph / 2;

    // Dim overlay
    const overlay = this.add.graphics().setDepth(190);
    overlay.fillStyle(0x000000, 0.45);
    overlay.fillRect(0, 0, this.W, this.H);

    // Card background
    const cardBg = this.add.graphics().setDepth(191);
    cardBg.fillStyle(0xfffbf1, 0.97);
    cardBg.fillRoundedRect(cx - msgWidth/2, py, msgWidth, ph, this.s(14));
    cardBg.lineStyle(this.s(2), 0x296b72, 0.8);
    cardBg.strokeRoundedRect(cx - msgWidth/2, py, msgWidth, ph, this.s(14));

    const guideBox = this.add.text(cx, py + this.s(30), text, {
      fontFamily: CityTheme.heading, fontSize: this.s(20), color: '#173b40',
      align: 'center', wordWrap: { width: msgWidth - this.s(48) },
      lineSpacing: this.s(6)
    }).setOrigin(0.5, 0).setDepth(192).setAlpha(0);
    this.tweens.add({ targets: [overlay, cardBg, guideBox], alpha: 1, duration: 300 });

    const btnY = py + ph - this.s(20);
    const contBtn = this.add.text(cx, btnY, this._tr('guide.continue', 'Continue →'), {
      fontFamily: CityTheme.body, fontSize: this.s(17), color: '#fffbf1',
      backgroundColor: '#296b72', padding: { x: this.s(24), y: this.s(12) }
    }).setOrigin(0.5, 1).setDepth(192).setInteractive({ useHandCursor: true });

    const dismiss = () => {
      [overlay, cardBg, guideBox, contBtn].forEach(el => { try { el.destroy(); } catch(e) {} });
      if (onContinue) onContinue();
    };
    contBtn.on('pointerdown', dismiss);

    this._guideBox = guideBox;
    this._guideBtn = { destroy: () => { try { overlay.destroy(); cardBg.destroy(); guideBox.destroy(); contBtn.destroy(); } catch(e) {} } };
  }

  _showPersistentMessage(text,opts){
    this._clearPersistentMessage();
    opts=opts||{};
    const y=this._msgY();
    const corner=!!opts.corner&&!this.isCompact;
    const msgWidth=corner?Math.min(this.s(390),this.W*.3):Math.min(this.s(760),this._availW());
    const msgX=corner?this.PANEL+this.s(20):this._cx();
    this.persistentMsg=this.add.text(msgX,y-this.s(6),text,{
      fontFamily:CityTheme.heading,fontSize:this.s(corner?15:18),color:'#173b40',
      align:corner?'left':'center',wordWrap:{width:msgWidth},
      backgroundColor:'#fffbf1',padding:{x:this.s(22),y:this.s(13)},lineSpacing:this.s(5),stroke:'#fffbf1',strokeThickness:1
    }).setOrigin(corner?0:0.5,0).setDepth(48).setAlpha(0);
    const top=y;
    this.persistentMsg.y=top-this.s(6);
    this.tweens.add({targets:this.persistentMsg,alpha:1,y:top,duration:600});
  }
  _clearPersistentMessage(){
    if(this._guideBox){try{this._guideBox.destroy();}catch(e){}this._guideBox=null;}
    if(this._guideBtn){try{this._guideBtn.destroy();}catch(e){}this._guideBtn=null;}
    if(this.persistentMsg){this.tweens.killTweensOf(this.persistentMsg);this.persistentMsg.destroy();this.persistentMsg=null;}
  }

  _showDropRetry(){
    if(this.dropFeedbackTimer){this.dropFeedbackTimer.remove(false);this.dropFeedbackTimer=null;}
    if(this.dropFeedback){this.tweens.killTweensOf(this.dropFeedback);this.dropFeedback.destroy();}
    this.dropFeedback=this.add.text(this._cx(),this.H-this.s(92),this._tr('guide.dropRetry','Try again — drop the coin on the centre of a district.'),{
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

  _tempMessage(text,dur,fadeDur){
    fadeDur = fadeDur || 800;
    const m=this.add.text(this._cx(),this.H-this.s(120),text,{
      fontFamily:CityTheme.heading,fontSize:this.s(17),color:'#173b40',
      align:'center',backgroundColor:'#fffbf1',padding:{x:this.s(20),y:this.s(12)},lineSpacing:this.s(5),
      wordWrap:{width:this._availW()}
    }).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.tweens.add({targets:m,alpha:1,y:this.H-this.s(128),duration:fadeDur,hold:dur?dur*.8:4000,yoyo:true,onComplete:()=>m.destroy()});
  }

  _showConsequence(text,onContinue,opts){
    const readMs=Math.max(1760,Math.min(3200,1040+String(text||'').length*16));
    opts = Object.assign({auto:true,autoDelay:readMs},opts||{});
    this._clearWorldBtn();
    this._clearConsequence(); this._clearDecisionPanel();
    const cx=this._cx();
    const pw=Math.min(this.s(720),this._availW()), ph=this.s(104), px=cx-pw/2, py=this.H-this.s(186);

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
      const rTxt=this.add.text(rx+rw/2, ry+rh/2, this._tr('game.retry','↺ Retry level'),{
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

    this.worldBtnTimer = this.time.delayedCall(1100,()=>{
      this.worldBtnTimer=null;
      this.worldBtn=new WorldButton(this,cx,this.H-this.s(262),this._tr('game.continue','Continue →'),()=>{this.worldBtn=null;this._clearConsequence();if(onContinue)onContinue();});
    });
  }
  _clearConsequence(){ if(this.consequencePanel){this.tweens.killTweensOf(this.consequencePanel);this.consequencePanel.destroy();this.consequencePanel=null;} }

  _showDecisionPanel(options,cb){
    if (typeof ScoringEngine!=='undefined') ScoringEngine.startTimer();
    this._clearDecisionPanel(); this._clearConsequence();
    const cx=this._cx();
    const cols=options.length;
    const avail=this._availW();
    const btnW=Math.min(this.s(180),(avail-this.s(48)-(cols-1)*this.s(12))/cols);
    const ink='#'+CityTheme.colors.ink.toString(16).padStart(6,'0');
    const muted='#'+CityTheme.colors.muted.toString(16).padStart(6,'0');
    const measured=options.map(o=>{
      const label=this.add.text(0,0,o.label,{fontFamily:CityTheme.body,fontSize:this.s(16),color:ink,fontStyle:'700',align:'center',wordWrap:{width:btnW-this.s(24)}}).setOrigin(.5,0);
      const description=this.add.text(0,0,o.desc,{fontFamily:CityTheme.body,fontSize:this.s(14),color:muted,align:'center',wordWrap:{width:btnW-this.s(24)},lineSpacing:this.s(3)}).setOrigin(.5,0);
      return {label,description,height:this.s(39)+label.height+this.s(12)+description.height+this.s(18)};
    });
    const btnH=Math.max(this.s(132),...measured.map(m=>m.height));
    const panelW=cols*btnW+(cols-1)*this.s(12)+this.s(48);
    const panelH=btnH+this.s(28), panelX=cx-panelW/2, panelY=this.H-panelH-this.s(18);
    this.decisionPanel=this.add.container(0,0).setDepth(60);
    const bg=this.add.graphics();
    bg.fillStyle(CityTheme.colors.paper,0.98); bg.fillRoundedRect(panelX,panelY,panelW,panelH,this.s(12));
    bg.lineStyle(1,0x24405f,1); bg.strokeRoundedRect(panelX,panelY,panelW,panelH,this.s(12));
    this.decisionPanel.add(bg);
    options.forEach((o,i)=>{
      const bx=panelX+this.s(24)+i*(btnW+this.s(12)), by=panelY+this.s(14);
      const g=this.add.graphics();
      const draw=(hv)=>{g.clear();
        g.fillStyle(o.color,hv?0.42:0.15); g.fillRoundedRect(bx,by,btnW,btnH,this.s(9));
        g.lineStyle(hv?this.s(2.4):1,o.color,hv?0.98:0.5); g.strokeRoundedRect(bx,by,btnW,btnH,this.s(9));};
      draw(false); this.decisionPanel.add(g);
      const ic=this.add.text(bx+btnW/2,by+this.s(18),o.icon,{fontSize:this.s(22)}).setOrigin(0.5);
      const lb=measured[i].label,de=measured[i].description;
      lb.setPosition(bx+btnW/2,by+this.s(39));
      de.setPosition(bx+btnW/2,lb.y+lb.height+this.s(12));
      this.decisionPanel.add([ic,lb,de]);
      const hit=this.add.rectangle(bx+btnW/2,by+btnH/2,btnW-this.s(4),btnH-this.s(2),0xffffff,0)
        .setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>draw(true)); hit.on('pointerout',()=>draw(false));
      hit.on('pointerdown',()=>{
        // Resume AudioContext on first user gesture (Bug #10)
        if(this._audioCtx && this._audioCtx.state==='suspended') this._audioCtx.resume();
        this._playClick();
        this._shake(70,0.002);this._clearDecisionPanel();if(cb)cb(o.value);
      });
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

  // ══ Sound: layered city ambience + soft interface sounds (Web Audio) ══
  _initAudio() {
    try {
      if (!GameScene._audioCtx) GameScene._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this._audioCtx = GameScene._audioCtx;
      this._muted = !!GameScene._muted;
      this._master = this._audioCtx.createGain();
      this._master.gain.value = 0.9;
      this._master.connect(this._audioCtx.destination);
      this._ambientNode = null;
      const resume = () => { if (this._audioCtx.state === 'suspended') this._audioCtx.resume(); };
      this.input.on('pointerdown', resume);
      this._startAmbient();
      this.events.once('shutdown', () => this._stopAmbient());
      this.events.once('destroy', () => this._stopAmbient());
    } catch(e) { this._audioCtx = null; }
  }

  _noiseBuffer(seconds, brown) {
    const ctx = this._audioCtx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } else d[i] = w;
    }
    return buf;
  }

  _startAmbient() {
    if (!this._audioCtx || this._muted || this._ambientNode) return;
    const ctx = this._audioCtx, now = ctx.currentTime, nodes = [];
    const bus = ctx.createGain(); bus.gain.setValueAtTime(0, now); bus.gain.linearRampToValueAtTime(1, now + 3);
    bus.connect(this._master);
    // 1) distant city hum + breeze: brown noise, low-passed, slowly breathing
    const wind = ctx.createBufferSource(); wind.buffer = this._noiseBuffer(6, true); wind.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 520; wf.Q.value = 0.4;
    const wg = ctx.createGain(); wg.gain.value = 0.11;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.05; lfo.connect(lfoG); lfoG.connect(wg.gain);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.045;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 260; lfo2.connect(lfo2G); lfo2G.connect(wf.frequency);
    wind.connect(wf); wf.connect(wg); wg.connect(bus);
    wind.start(); lfo.start(); lfo2.start(); nodes.push(wind, lfo, lfo2);
    // 2) warm, hopeful pad (D major add9), softly detuned and filtered
    const padF = ctx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 900;
    const padG = ctx.createGain(); padG.gain.value = 0.022; padF.connect(padG); padG.connect(bus);
    [146.83, 220.0, 293.66, 369.99, 329.63].forEach((f, i) => {
      [-4, 4].forEach(det => {
        const o = ctx.createOscillator(); o.type = i < 2 ? 'sine' : 'triangle';
        o.frequency.value = f; o.detune.value = det;
        const g = ctx.createGain(); g.gain.value = i < 2 ? 0.8 : 0.35;
        const tr = ctx.createOscillator(); tr.frequency.value = 0.05 + i * 0.023;
        const trG = ctx.createGain(); trG.gain.value = 0.3; tr.connect(trG); trG.connect(g.gain);
        o.connect(g); g.connect(padF); o.start(); tr.start(); nodes.push(o, tr);
      });
    });
    this._ambientNode = { bus, nodes };
    // 3) life: occasional birdsong by day, a distant tram bell now and then
    const schedule = () => {
      if (!this._ambientNode) return;
      this._ambientTimer = this.time.delayedCall(4000 + Math.random() * 7000, () => {
        if (!this._ambientNode || this._muted) return;
        const night = (this.nightStrength || 0) > 0.55;
        if (!night && Math.random() < 0.7) this._birdChirp(); else this._tramBell();
        schedule();
      });
    };
    schedule();
  }

  _birdChirp() {
    const ctx = this._audioCtx, t0 = ctx.currentTime, n = 2 + Math.floor(Math.random() * 3), base = 2600 + Math.random() * 1400;
    for (let i = 0; i < n; i++) {
      const t = t0 + i * (0.11 + Math.random() * 0.05);
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.06);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.09);
      o.connect(g); g.connect(this._ambientNode.bus); o.start(t); o.stop(t + 0.1);
    }
  }

  _tramBell() {
    const ctx = this._audioCtx, t = ctx.currentTime;
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 660 * m;
      g.gain.setValueAtTime(0.018 / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.6);
      o.connect(g); g.connect(this._ambientNode.bus); o.start(t); o.stop(t + 1.7);
    });
  }

  _stopAmbient() {
    if (this._ambientTimer) { try { this._ambientTimer.remove(false); } catch(e) {} this._ambientTimer = null; }
    const a = this._ambientNode; this._ambientNode = null;
    if (!a || !this._audioCtx) return;
    const t = this._audioCtx.currentTime;
    try { a.bus.gain.cancelScheduledValues(t); a.bus.gain.setValueAtTime(a.bus.gain.value, t); a.bus.gain.linearRampToValueAtTime(0, t + 0.6); } catch(e) {}
    setTimeout(() => { a.nodes.forEach(n => { try { n.stop(); } catch(e) {} }); try { a.bus.disconnect(); } catch(e) {} }, 700);
  }

  _tone(freq, start, dur, vol, type, attack) {
    const ctx = this._audioCtx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0005, start + dur);
    o.connect(g); g.connect(this._master); o.start(start); o.stop(start + dur + 0.05);
  }

  _playClick() {
    if (!this._audioCtx || this._muted) return;
    const ctx = this._audioCtx, t = ctx.currentTime;
    // soft wooden tap: a short filtered noise tick plus a rounded pitch blip
    const src = ctx.createBufferSource(); src.buffer = this._noiseBuffer(0.04, false);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 2.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.04);
    src.connect(f); f.connect(g); g.connect(this._master); src.start(t);
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.08);
    og.gain.setValueAtTime(0.09, t); og.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
    o.connect(og); og.connect(this._master); o.start(t); o.stop(t + 0.14);
  }

  _playTransition() {
    if (!this._audioCtx || this._muted) return;
    const t = this._audioCtx.currentTime;
    // gentle bell phrase: each note has a soft overtone so it rings like glass
    [[587.33,0],[739.99,0.16],[880,0.32]].forEach(([f,d]) => {
      this._tone(f, t + d, 1.4, 0.09, 'sine', 0.02);
      this._tone(f * 2.01, t + d, 0.7, 0.025, 'sine', 0.01);
    });
  }

  _playCelebration() {
    if (!this._audioCtx || this._muted) return;
    const t = this._audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this._tone(f, t + i * 0.09, 0.9, 0.08, 'triangle', 0.015);
      this._tone(f / 2, t + i * 0.09, 0.6, 0.03, 'sine', 0.02);
    });
    [523.25, 659.25, 783.99].forEach(f => this._tone(f, t + 0.55, 1.8, 0.04, 'sine', 0.08));
  }

  _toggleMute() {
    this._muted = !this._muted; GameScene._muted = this._muted;
    if (this._muted) this._stopAmbient();
    else {
      if (this._audioCtx && this._audioCtx.state === 'suspended') this._audioCtx.resume();
      this._startAmbient(); this._playClick();
    }
    if (this._muteBtn) this._muteBtn.setText(this._muted ? this._tr('game.unmute', '🔇 Unmute') : this._tr('game.mute', '🔊 Mute'));
  }

  _addMuteButton() {
    this._muteBtn = this.add.text(this.W - this.s(10), this.s(52), this._muted ? this._tr('game.unmute', '🔇 Unmute') : this._tr('game.mute', '🔊 Mute'), {
      fontFamily: CityTheme.body, fontSize: this.s(14), color: '#fffbf1',
      backgroundColor: '#296b72', padding: { x: this.s(8), y: this.s(4) }
    }).setOrigin(1, 0).setDepth(200).setInteractive({ useHandCursor: true });
    this._muteBtn.on('pointerdown', () => this._toggleMute());
  }

  // ══ Level 1 city tour: a spotlight moves across the real screen areas;
  //    tap anywhere to continue. Shown once, only at the start of Level 1. ══
  _cityTour(done) {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const W = this.W, H = this.H, hudH = (this.hud && this.hud.height) || this.s(48), P = this.PANEL || 0;
    const cityTop = hudH + this.s(10), cityBottom = H - this.s(150);
    const steps = [
      { r: { x: 0, y: 0, w: W, h: hudH },
        t: de ? 'Die Kopfleiste' : 'The top bar',
        b: de ? 'Hier stehen Stadtname, aktuelles Jahr und Level. Sie ändern sich, während deine Stadt wächst.' : 'City name, current year and level live here. They update as your city grows.' },
      { r: { x: P + this.s(10), y: cityTop, w: W - P - this.s(20), h: cityBottom - cityTop },
        t: de ? 'Deine vier Stadtteile' : 'Your four districts',
        b: de ? 'Wohnen, Verkehr, Technologie und Energie. Jedes Viertel wächst anders — das kurze Schild über dem Namen verrät, wie.' : 'Housing, Transport, Technology and Energy. Each grows differently — the short sign above each name tells you how.' },
      { r: { x: 0, y: hudH, w: Math.max(P, this.s(10)), h: H - hudH }, skip: !P,
        t: de ? 'Die Seitenleiste' : 'The side panel',
        b: de ? 'Zufriedenheit, Wachstum und Mittel deiner Stadt — plus Ton, Licht-Vorschau und Textgröße.' : 'Your city’s happiness, growth and funds — plus sound, lighting preview and text size.' },
      { r: { x: P + this.s(10), y: H - this.s(150), w: W - P - this.s(20), h: this.s(140) },
        t: de ? 'Entscheidungen' : 'Decisions',
        b: de ? 'Hier erscheinen deine Wahlmöglichkeiten. Nimm dir Zeit — jede Wahl prägt die Stadt dauerhaft.' : 'Your choices appear here. Take your time — every choice leaves a lasting mark on the city.' }
    ].filter(s => !s.skip);

    const layer = this.add.container(0, 0).setDepth(180);
    const dim = this.add.graphics(), ring = this.add.graphics();
    const card = this.add.graphics();
    const title = this.add.text(0, 0, '', { fontFamily: CityTheme.heading, fontSize: this.s(21), color: '#173b40', fontStyle: '700' }).setOrigin(0, 0);
    const body = this.add.text(0, 0, '', { fontFamily: CityTheme.body, fontSize: this.s(16), color: '#2a5a60', lineSpacing: this.s(5) }).setOrigin(0, 0);
    const hint = this.add.text(0, 0, '', { fontFamily: CityTheme.body, fontSize: this.s(13), color: '#9b6c12', fontStyle: '700' }).setOrigin(0, 0);
    const hit = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.001).setInteractive();
    layer.add([dim, ring, card, title, body, hint, hit]);
    const cur = { x: W / 2, y: H / 2, w: 10, h: 10 };
    let idx = -1, tw = null, finished = false;

    const paint = () => {
      const { x, y, w, h } = cur;
      dim.clear(); dim.fillStyle(0x0b1f22, 0.62);
      dim.fillRect(0, 0, W, y); dim.fillRect(0, y + h, W, H - y - h);
      dim.fillRect(0, y, x, h); dim.fillRect(x + w, y, W - x - w, h);
      ring.clear(); ring.lineStyle(this.s(3), CityTheme.colors.gold, 1); ring.strokeRoundedRect(x, y, w, h, this.s(10));
    };
    const placeCard = (r) => {
      const cw = Math.min(this.s(400), W - this.s(40));
      title.setWordWrapWidth(cw - this.s(36)); body.setWordWrapWidth(cw - this.s(36));
      const ch = this.s(28) + title.height + this.s(8) + body.height + this.s(14) + hint.height + this.s(18);
      let cx, cy;
      if (r.x + r.w + cw + this.s(24) < W && r.w < W * 0.4) { cx = r.x + r.w + this.s(18); cy = Math.min(H - ch - this.s(16), r.y + this.s(40)); }
      else if (r.y + r.h + ch + this.s(20) < H) { cx = Math.max(this.s(16), Math.min(W - cw - this.s(16), r.x + r.w / 2 - cw / 2)); cy = r.y + r.h + this.s(16); }
      else if (r.y - ch - this.s(20) > 0) { cx = Math.max(this.s(16), Math.min(W - cw - this.s(16), r.x + r.w / 2 - cw / 2)); cy = r.y - ch - this.s(16); }
      else { cx = r.x + r.w / 2 - cw / 2; cy = r.y + r.h / 2 - ch / 2; }
      card.clear(); card.fillStyle(0xfffbf1, 0.98); card.fillRoundedRect(cx, cy, cw, ch, this.s(12));
      card.fillStyle(0xe0a82e, 1); card.fillRect(cx, cy, cw, this.s(4));
      title.setPosition(cx + this.s(18), cy + this.s(18));
      body.setPosition(cx + this.s(18), title.y + title.height + this.s(8));
      hint.setPosition(cx + this.s(18), body.y + body.height + this.s(14));
      [card, title, body, hint].forEach(o => o.setAlpha(1));
    };
    const finish = () => {
      if (finished) return; finished = true;
      this.tweens.add({ targets: layer, alpha: 0, duration: 300, onComplete: () => { layer.destroy(); if (typeof done === 'function') done(); } });
    };
    const next = () => {
      idx++;
      if (idx >= steps.length) return finish();
      this._playClick();
      const s = steps[idx];
      title.setText(s.t); body.setText(s.b);
      hint.setText((idx===steps.length-1 ? (de ? 'Tippe irgendwo, um Level 1 zu starten →' : 'Click anywhere to start Level 1 →') : (de ? 'Klicke irgendwo für den nächsten Schritt →' : 'Click anywhere for the next step →')) + '  ·  ' + (idx + 1) + '/' + steps.length);
      if (tw) tw.stop();
      tw = this.tweens.add({ targets: cur, x: s.r.x, y: s.r.y, w: s.r.w, h: s.r.h, duration: idx === 0 ? 10 : 520, ease: 'Sine.easeInOut', onUpdate: paint, onComplete: paint });
      placeCard(s.r);
    };
    let ready = 0;
    hit.on('pointerdown', () => { if (this.time.now - ready < 350) return; ready = this.time.now; next(); });
    next();
  }
}
