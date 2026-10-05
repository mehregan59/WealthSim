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
    this._addMuteButton(); // Bug #10
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
    // Bug #6: Technology district moved to far right corner
    const p2raw=at(2,.62,baseY-this.s(34));
    const p2={cx: pts ? this.W - this.s(80) : Math.round(this.W - this.s(80)), cy: p2raw.cy};
    const p3=at(3,.88,baseY+this.s(18));

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
    const hudH = this.hud ? this.hud.height() : this.s(56);
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
    this._drawCityBoundary();
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
      // The very first time Level 1 starts, show city tour (Bug #4), then panel intro
      if (n===1 && !this._panelIntroShown) {
        this._panelIntroShown = true;
        this._cityTour(() => { this.statsPanel.introHighlight(run); }); // tour done → show panel intro
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
    ch.forEach((o,i)=>{
      this.time.delayedCall(i*260,()=>{
        this.siteMarkers.push(this._choiceLabel(o.d.cx, o.d.subLabelY(), o.l, o.c));
        o.d.setSelectable(true, ()=>this._onLevel1Choice(o.d,o.v));
      });
    });
    const storyText = ld && ld.story ? ld.story : this._tr('level1.story', 'Tap one of the districts below to start growing your city.');
    const guideText = ld && ld.guide ? ld.guide : this._tr('game.guideDefault', 'Read the situation. Choose a district to begin.');
    // Bug #1: show guide first, then story + districts on Continue
    this._showGuide(guideText, () => {
      this._showPersistentMessage(storyText);
      // Districts are already selectable — just show the message
    });
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
    this.time.delayedCall(1900,()=>{
      const guideText2 = ld && ld.guide ? ld.guide : this._tr('guide.default', 'Read the situation. Make your choice.');
      const opts = ld && ld.options ? ld.options : null;
      // Bug #1: show guide first, then story + decision panel
      this._showGuide(guideText2, () => {
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
      }); // end _showGuide callback
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
    this.time.delayedCall(1200,()=>{
      this.districts[1].takeDamage(30); this._updateStats(-5,-8,0);
      this._shake(200,0.003);
      this.time.delayedCall(1600,()=>{
        const newsStory = this._tr('level2.newsStory', 'Now the transport district is falling.\nThis time there is real news: its largest employer\nis leaving the city for good. What does the city do?');
        const ld = this._levelData(2);
        const opts = ld && ld.options ? ld.options : null;
        // Bug #1: guide then story + panel
        this._showGuide(this._tr('guide.default', 'Read the situation. Make your choice.'), () => {
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
        }); // end _showGuide callback
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
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level3.story', 'The city has grown. Now it\'s time to expand.\nYou have resources to invest. Choose wisely.');
    this._showPersistentMessage(storyMsg);
    const opts = ld && ld.options ? ld.options : null;
    this.districts.forEach((d,i)=>{
      d.setSelectable(true,()=>this._onLevel3Choice(d,i));
    });
    this.cubeTotal=3;
    this._spawnCube();
    this._level3Idle();
  }

  _level3Idle() {
    this._clearLevel3Idle();
    this._level3IdleTimer = this.time.delayedCall(18000,()=>{
      if(this.cubeDropped<this.cubeTotal) this._showDropRetry();
    });
  }
  _clearLevel3Idle(){
    if(this._level3IdleTimer){this._level3IdleTimer.remove(false);this._level3IdleTimer=null;}
  }

  _spawnCube(){
    if(this.cubeDropped>=this.cubeTotal)return;
    const cube=new ResourceCube(this,this._cx(),this.s(100));
    this.cubes.push(cube);
    cube.spawn(this.districts);
  }

  _onResourceDropped(district,value,cube) {
    if(this.currentLevel!==3)return;
    this.cubeDropped++;
    district.receiveResource(value);
    this._shake(160,0.003);
    ScoringEngine.recordDecision(3,'drop',{districtId:district.id,value});
    this._updateStats(0,8,-10);
    if(this.cubeDropped>=this.cubeTotal){
      this._clearLevel3Idle();
      this.time.delayedCall(600,()=>this._level3Outcome());
    } else {
      this.time.delayedCall(400,()=>{ this._spawnCube(); this._level3Idle(); });
    }
  }

  _level3Outcome() {
    this.districts.forEach(d=>d.setSelectable(false));
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(3);
    const resultMsg = ld && ld.outcome ? ld.outcome
      : this._tr('level3.outcome', 'Resources invested. The city expands.\nWatch how each district develops over time.');
    this._showConsequence(resultMsg,()=>this._nextLevel());
  }

  _onLevel3Choice(d,i) {
    // Districts are selectable in level 3 for visual feedback only
    // actual resource allocation is via cube drops
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

  // ══ LEVEL 9 ══
  _level9() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(9);
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level9.story', 'Project review time.\nSome districts thrived, others struggled. How does the city allocate remaining resources?');
    const opts = ld && ld.options ? ld.options : null;
    this._showPersistentMessage(storyMsg);
    this._showDecisionPanel([
      {icon:'🏆',label: opts && opts[0] ? opts[0].label : this._tr('level9.opt0','Reward success'), desc: opts && opts[0] ? opts[0].description : this._tr('level9.opt0desc','Invest in top performers'),value:'reward',color:0xddaa00},
      {icon:'⚖️',label: opts && opts[1] ? opts[1].label : this._tr('level9.opt1','Balance the city'), desc: opts && opts[1] ? opts[1].description : this._tr('level9.opt1desc','Support struggling districts'),value:'balance',color:0x5c8ab0},
      {icon:'🔬',label: opts && opts[2] ? opts[2].label : this._tr('level9.opt2','Invest in research'), desc: opts && opts[2] ? opts[2].description : this._tr('level9.opt2desc','Fund future innovation'),value:'research',color:0x9966cc}
    ],(c)=>{
      ScoringEngine.recordDecision(9,c);
      this._clearPersistentMessage();
      const e={reward:{d:[5,12,-10],m:this._tr('level9.rewardResult','Top performers accelerate.\nThe gap between districts widens.')},
               balance:{d:[8,5,-8],m:this._tr('level9.balanceResult','Balance restored.\nAll districts move forward together.')},
               research:{d:[3,10,-12],m:this._tr('level9.researchResult','Research investment pays dividends.\nFuture growth looks promising.')}}[c]
               ||{d:[0,0,0],m:'Decision recorded.'};
      this._updateStats(e.d[0],e.d[1],e.d[2]);
      this._showConsequence(e.m,()=>this._nextLevel());
    });
  }

  // ══ LEVEL 10 ══
  _level10() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(10);
    const storyMsg = ld && ld.story ? ld.story
      : this._tr('level10.story', 'The Planning Desk.\nThe city has grown. Now design its future.');
    this._showPersistentMessage(storyMsg);
    this.time.delayedCall(1200,()=>this._level10Ask());
  }

  _level10Ask() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const ld = this._levelData(10);
    const opts = ld && ld.options ? ld.options : null;
    this._showDecisionPanel([
      {icon:'🌱',label: opts && opts[0] ? opts[0].label : this._tr('level10.opt0','Green city'), desc: opts && opts[0] ? opts[0].description : this._tr('level10.opt0desc','Prioritise sustainability'),value:'green',color:0x4aaa5c},
      {icon:'🏙',label: opts && opts[1] ? opts[1].label : this._tr('level10.opt1','Smart city'), desc: opts && opts[1] ? opts[1].description : this._tr('level10.opt1desc','Prioritise technology'),value:'smart',color:0x5c8ab0},
      {icon:'🫦',label: opts && opts[2] ? opts[2].label : this._tr('level10.opt2','People first'), desc: opts && opts[2] ? opts[2].description : this._tr('level10.opt2desc','Prioritise community'),value:'people',color:0xddaa00}
    ],(c)=>{
      ScoringEngine.recordDecision(10,c);
      this._clearPersistentMessage();
      this.time.delayedCall(400,()=>this._level10Reveal(c));
    });
  }

  _level10Reveal(choice) {
    const e={
      green:{d:[8,12,-10],m:this._tr('level10.greenResult','A green city emerges.\nSustainable, healthy, and resilient.')},
      smart:{d:[5,15,-12],m:this._tr('level10.smartResult','A smart city takes shape.\nEfficient systems, data-driven decisions.')},
      people:{d:[12,8,-8],m:this._tr('level10.peopleResult','A people-first city flourishes.\nCommunity bonds are its greatest asset.')}
    }[choice]||{d:[0,0,0],m:'The city\'s future is set.'};
    this._updateStats(e.d[0],e.d[1],e.d[2]);
    this.districts.forEach(d=>d.receiveResource(2));
    this._celebrateCity(this._tr('level10.celebrate','🏆 City Complete!'));
    this._showConsequence(e.m,()=>this._level10Practice());
  }

  _level10Practice() {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const summary = ScoringEngine.getSummary ? ScoringEngine.getSummary() : null;
    const finalMsg = summary
      ? this._tr('level10.finalWithScore', 'Journey complete. Your decisions shaped this city.\nYour score reflects your choices across all levels.')
      : this._tr('level10.final', 'Journey complete.\nEvery decision you made shaped this city.\nYou can now explore or restart.');
    this._showConsequence(finalMsg, ()=>{
      this._clearConsequence();
      this._showPersistentMessage(this._tr('level10.done', '🏙 Your city journey is complete. Well done!'));
    }, {auto:false});
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
    const cx=this._cx(), cy=this.H/2;
    const pw=Math.min(this.s(560),this._availW()), ph=this.s(280);
    const px=cx-pw/2, py=cy-ph/2;
    const dim=this.add.graphics().setDepth(90);
    dim.fillStyle(0x000000,0.55); dim.fillRect(0,0,this.W,this.H);
    const bg=this.add.graphics().setDepth(91);
    bg.fillStyle(0xfffbf1,0.98); bg.fillRoundedRect(px,py,pw,ph,this.s(14));
    bg.lineStyle(this.s(2),0x296b72,0.8); bg.strokeRoundedRect(px,py,pw,ph,this.s(14));
    const ttl=this.add.text(cx,py+this.s(24),title,{
      fontFamily:CityTheme.heading,fontSize:this.s(19),color:'#173b40',fontStyle:'700',align:'center'
    }).setOrigin(0.5,0).setDepth(92);
    const txt=this.add.text(cx,py+this.s(60),text,{
      fontFamily:CityTheme.body,fontSize:this.s(14),color:'#2a5a60',
      align:'center',wordWrap:{width:pw-this.s(48)},lineSpacing:this.s(5)
    }).setOrigin(0.5,0).setDepth(92);
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const btn=this.add.text(cx,py+ph-this.s(30),this._tr('game.close','Close'),{
      fontFamily:CityTheme.body,fontSize:this.s(14),color:'#fffbf1',
      backgroundColor:'#296b72',padding:{x:this.s(20),y:this.s(10)}
    }).setOrigin(0.5).setDepth(92).setInteractive({useHandCursor:true});
    btn.on('pointerdown',()=>{
      [dim,bg,ttl,txt,btn].forEach(e=>{try{e.destroy();}catch(e){}});
      if(onClose)onClose();
    });
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
    const msgWidth = Math.min(this.s(760), this._availW());
    const y = this._msgY();
    const guideBox = this.add.text(cx, y, text, {
      fontFamily: CityTheme.heading, fontSize: this.s(22), color: '#173b40',
      align: 'center', wordWrap: { width: msgWidth },
      backgroundColor: '#e8f6f8', padding: { x: this.s(24), y: this.s(15) },
      lineSpacing: this.s(6), stroke: '#e8f6f8', strokeThickness: 1
    }).setOrigin(0.5, 0).setDepth(48).setAlpha(0);
    this.tweens.add({ targets: guideBox, alpha: 1, duration: 500 });
    const contBtn = new WorldButton(this, cx, y + this.s(80), this._tr('guide.continue', 'Continue →'), () => {
      guideBox.destroy();
      contBtn.destroy();
      if (onContinue) onContinue();
    });
    this._guideBox = guideBox;
    this._guideBtn = contBtn;
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

  // ══ Bug #10 — Web Audio sound system ══
  _initAudio() {
    try {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this._muted = false;
      this._ambientNode = null;
      this._startAmbient();
    } catch(e) { this._audioCtx = null; }
  }

  _startAmbient() {
    if (!this._audioCtx || this._muted) return;
    const ctx = this._audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    this._ambientNode = { osc, gain };
  }

  _stopAmbient() {
    if (this._ambientNode) {
      try { this._ambientNode.osc.stop(); } catch(e) {}
      this._ambientNode = null;
    }
  }

  _playClick() {
    if (!this._audioCtx || this._muted) return;
    const ctx = this._audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  }

  _playTransition() {
    if (!this._audioCtx || this._muted) return;
    const ctx = this._audioCtx;
    [261, 329, 392].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  }

  _playCelebration() {
    if (!this._audioCtx || this._muted) return;
    const ctx = this._audioCtx;
    [523, 659, 784, 1046].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.6);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.7);
    });
  }

  _toggleMute() {
    this._muted = !this._muted;
    if (this._muted) {
      this._stopAmbient();
    } else {
      if (this._audioCtx && this._audioCtx.state === 'suspended') {
        this._audioCtx.resume();
      }
      this._startAmbient();
    }
    if (this._muteBtn) this._muteBtn.setText(this._muted ? this._tr('game.unmute', '🔇 Unmute') : this._tr('game.mute', '🔊 Mute'));
  }

  _addMuteButton() {
    this._muteBtn = this.add.text(this.W - this.s(10), this.s(10), this._tr('game.mute', '🔊 Mute'), {
      fontFamily: CityTheme.body, fontSize: this.s(12), color: '#7dbfc8',
      backgroundColor: '#0d2b2e', padding: { x: this.s(8), y: this.s(4) }
    }).setOrigin(1, 0).setDepth(200).setInteractive({ useHandCursor: true });
    this._muteBtn.on('pointerdown', () => this._toggleMute());
  }

  // ══ Bug #4 — City tour at level 1 start ══
  _cityTour(done) {
    const steps = [
      {
        title: this._tr('tour.step1.title', '🏙 Welcome to Your City!'),
        text: this._tr('tour.step1.text', 'This is your city dashboard. The top bar (HUD) shows the city name, current year, and level. Watch it update as your city grows!')
      },
      {
        title: this._tr('tour.step2.title', '🏘 Your Districts'),
        text: this._tr('tour.step2.text', 'Each coloured area on the map is a district: Housing, Transport, Technology, and Energy. Each district has a different risk and growth profile.')
      },
      {
        title: this._tr('tour.step3.title', '📊 Stats Panel'),
        text: this._tr('tour.step3.text', 'On the left you can see three key stats: Happiness, Development, and Resources. Every decision you make affects these numbers.')
      },
      {
        title: this._tr('tour.step4.title', '🗳 Decision Area'),
        text: this._tr('tour.step4.text', 'At the bottom of the screen you\'ll see decision panels. Read each option carefully — your choices have lasting consequences for the city!')
      },
      {
        title: this._tr('tour.step5.title', '🏆 Level Progress'),
        text: this._tr('tour.step5.text', 'Complete each level by making a key decision. There are 10 levels total. Each one teaches a different lesson about wealth and city management.')
      }
    ];

    let currentStep = 0;
    let tourOverlay = null;
    let tourBg = null;
    let tourTitle = null;
    let tourText = null;
    let nextBtn = null;
    let skipBtn = null;

    const cleanup = () => {
      [tourOverlay, tourBg, tourTitle, tourText, nextBtn, skipBtn].forEach(el => {
        if (el) { try { el.destroy(); } catch(e) {} }
      });
      tourOverlay = tourBg = tourTitle = tourText = nextBtn = skipBtn = null;
    };

    const showStep = (idx) => {
      cleanup();
      if (idx >= steps.length) return;

      const step = steps[idx];
      const cx = this._cx();
      const cy = this.H / 2;
      const pw = Math.min(this.s(560), this._availW());
      const ph = this.s(260);
      const px = cx - pw / 2;
      const py = cy - ph / 2;

      tourOverlay = this.add.graphics().setDepth(180);
      tourOverlay.fillStyle(0x000000, 0.45);
      tourOverlay.fillRect(0, 0, this.W, this.H);

      tourBg = this.add.graphics().setDepth(181);
      tourBg.fillStyle(0xfffbf1, 0.97);
      tourBg.fillRoundedRect(px, py, pw, ph, this.s(14));
      tourBg.lineStyle(this.s(2), 0x296b72, 0.8);
      tourBg.strokeRoundedRect(px, py, pw, ph, this.s(14));

      tourTitle = this.add.text(cx, py + this.s(26), step.title, {
        fontFamily: CityTheme.heading, fontSize: this.s(26), color: '#173b40',
        align: 'center', fontStyle: '700'
      }).setOrigin(0.5, 0).setDepth(182);

      tourText = this.add.text(cx, py + this.s(60), step.text, {
        fontFamily: CityTheme.body, fontSize: this.s(19), color: '#2a5a60',
        align: 'center', wordWrap: { width: pw - this.s(48) }, lineSpacing: this.s(6)
      }).setOrigin(0.5, 0).setDepth(182);

      const stepLabel = (idx + 1) + ' / ' + steps.length;
      const stepTxt = this.add.text(cx, py + ph - this.s(14), stepLabel, {
        fontFamily: CityTheme.body, fontSize: this.s(14), color: '#7dbfc8'
      }).setOrigin(0.5, 1).setDepth(182);

      const nextLabel = idx < steps.length - 1 ? this._tr('tour.next', 'Next →') : this._tr('tour.done', 'Start Game →');
      nextBtn = this.add.text(cx + this.s(70), py + ph + this.s(14), nextLabel, {
        fontFamily: CityTheme.body, fontSize: this.s(17), color: '#fffbf1',
        backgroundColor: '#296b72', padding: { x: this.s(20), y: this.s(11) }
      }).setOrigin(0.5, 0).setDepth(182).setInteractive({ useHandCursor: true });
      nextBtn.on('pointerdown', () => { cleanup(); try { stepTxt.destroy(); } catch(e) {} if (idx + 1 >= steps.length) { if (typeof done === 'function') done(); } else { showStep(idx + 1); } });

      skipBtn = this.add.text(cx - this.s(70), py + ph + this.s(14), this._tr('tour.skip', 'Skip Tour'), {
        fontFamily: CityTheme.body, fontSize: this.s(16), color: '#7dbfc8',
        backgroundColor: '#0d2b2e', padding: { x: this.s(16), y: this.s(11) }
      }).setOrigin(0.5, 0).setDepth(182).setInteractive({ useHandCursor: true });
      skipBtn.on('pointerdown', () => { cleanup(); try { stepTxt.destroy(); } catch(e) {} if (typeof done === 'function') done(); });
    };

    showStep(0);
  }
}
