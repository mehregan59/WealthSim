class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.S = Math.max(0.85, Math.min(1.9, this.H / 720));   // layout scale
    this.PANEL = Math.round(Math.min(260, Math.max(190, this.W * 0.155)));

    const groundY = this.s(352);
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x18351c,1); ground.fillRect(0,groundY,this.W,this.H-groundY);
    ground.fillStyle(0x122a15,1); ground.fillRect(0,groundY+this.s(10),this.W,this.s(14));

    this.ambient = new AmbientSystem(this);
    this.weather = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);

    this.cityStats = { happiness:60, development:40, resources:80 };
    this.currentLevel = 0;
    this.cubes = []; this.cubeTotal = 0; this.cubeDropped = 0;
    this.decisionPanel = null; this.worldBtn = null;
    this.consequencePanel = null; this.persistentMsg = null;
    this.hasUniversity = false; this.siteMarkers = [];
    this.tickerActive = false;

    this._buildDistricts();
    this.roads = new RoadNetwork(this, this.districts);
    this.hud = new HUD(this);
    this.statsPanel = new StatsPanel(this);
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,0);

    this.input.keyboard.on('keydown-R', () => this._spawnResourceCube());
    this.input.keyboard.on('keydown-S', () => this._startLevel(8));
    this.input.keyboard.on('keydown-P', () => this._toProfile());
    this.events.on('resourceDropped', ({district,value}) => this._onResourceDropped(district,value));
    this._introSequence();
  }

  s(v){ return Math.round(v * this.S); }
  _cx(){ return this.PANEL + (this.W - this.PANEL)/2; }
  _availW(){ return this.W - this.PANEL - this.s(60); }

  // Districts sit closer together so the side panel can be wide
  _buildDistricts() {
    const L = this.PANEL + this.s(70);
    const R = this.W - this.s(70);
    const span = R - L;
    const px = f => Math.round(L + span * f);
    const baseY = this.s(470);
    this.districts = [
      new District(this, {id:'housing',name:'Housing',nameDE:'Wohnviertel',label:'Housing District',labelDE:'Wohnviertel',
        color:0x2f8a42,darkColor:0x143d1c,accentColor:0x4aaa5c,cx:px(0.00),cy:baseY,health:45,
        tooltip:'Stable homes for citizens.\nLow risk, steady growth.\nLike bonds in a portfolio.',
        tooltipDE:'Stabile Häuser für Bürger.\nGeringes Risiko, stetiges Wachstum.'}),
      new District(this, {id:'transport',name:'Transport',nameDE:'Verkehrsviertel',label:'Transport District',labelDE:'Verkehrsviertel',
        color:0x33608f,darkColor:0x142a44,accentColor:0x5c8ab0,cx:px(0.33),cy:baseY-this.s(38),health:45,
        tooltip:'Roads and transit connect the city.\nModerate risk, reliable returns.',
        tooltipDE:'Straßen verbinden die Stadt.\nModerates Risiko, zuverlässige Erträge.'}),
      new District(this, {id:'technology',name:'Technology',nameDE:'Technologieviertel',label:'Technology District',labelDE:'Technologieviertel',
        color:0x6b3fae,darkColor:0x2a1450,accentColor:0x9966cc,cx:px(0.67),cy:baseY-this.s(38),health:45,
        tooltip:'High growth potential.\nHigh uncertainty.\nCan double — or fall sharply.',
        tooltipDE:'Hohes Wachstumspotenzial.\nHohe Unsicherheit.'}),
      new District(this, {id:'energy',name:'Energy',nameDE:'Energieviertel',label:'Energy District',labelDE:'Energieviertel',
        color:0xa8850f,darkColor:0x5c4408,accentColor:0xddaa00,cx:px(1.00),cy:baseY+this.s(8),health:45,
        tooltip:'Wind and solar power the city.\nEssential infrastructure.',
        tooltipDE:'Wind und Solar versorgen die Stadt.'})
    ];
  }

  _introSequence() {
    const fi=this.add.graphics().setDepth(200);
    fi.fillStyle(0x000000,1); fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:2000,delay:300,onComplete:()=>{fi.destroy();this._startLevel(1);}});
    const txt=this.add.text(this.W/2,this.H/2,'Your city awaits.',{
      fontFamily:'Playfair Display, Georgia, serif', fontSize:this.s(32), color:'#e2a840'
    }).setOrigin(0.5).setDepth(201).setAlpha(0);
    this.tweens.add({targets:txt,alpha:1,duration:900,delay:700,hold:1600,yoyo:true,onComplete:()=>txt.destroy()});
  }

  _startLevel(n) {
    this.currentLevel=n;
    this._clearDecisionPanel(); this._clearCubes(); this._clearConsequence();
    this._clearWorldBtn(); this._clearPersistentMessage(); this._clearSiteMarkers();
    this.districts.forEach(d=>d.setSelectable(false));
    this.cubeDropped=0; this.cubeTotal=0;
    const map={1:this._level1,2:this._level2,3:this._level3,4:this._level4,5:this._level5,6:this._level6,7:this._level7,8:this._level8};
    const fn=map[n]; if(!fn)return;
    this.hud.setLevel(n,this._levelName(n));
    this.time.delayedCall(500,fn.bind(this));
  }

  _levelName(n){return {1:'The First Opportunity',2:'The Unexpected Setback',3:'Expansion',4:'Today or Tomorrow',5:'The Boom',6:'The Outside Offer',7:'Breaking News',8:'The Great Storm'}[n]||'Level '+n;}

  _nextLevel(){
    this._clearConsequence(); this._clearWorldBtn();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,this.currentLevel);
    const next=this.currentLevel+1;
    if(next<=8) this._startLevel(next);
  }

  _toProfile(){ this.tweens.killAll(); this.scene.start('ProfileScene',{stats:this.cityStats}); }

  _level1() {
    this.hud.showLevelTitle(1,'The First Opportunity');
    this.time.delayedCall(2600,()=>{
      const ch=[
        {d:this.districts[0], l:'🌱 Safe & Steady',   v:'safe',       c:0x4aaa5c},
        {d:this.districts[1], l:'🚏 Reliable Growth', v:'balanced',   c:0x5c8ab0},
        {d:this.districts[2], l:'🚀 High Potential',  v:'aggressive', c:0x9966cc},
        {d:this.districts[3], l:'⚡ Balanced',        v:'balanced',   c:0xddaa00}
      ];
      this.siteMarkers=[];
      ch.forEach((o,i)=>{
        this.time.delayedCall(i*280,()=>{
          this.siteMarkers.push(this._choiceLabel(o.d.cx, o.d.cy-this.s(74), o.l, o.c));
          o.d.setSelectable(true, ()=>this._onLevel1Choice(o.d,o.v));
        });
      });
      this._showPersistentMessage('Tap a district to choose your first project.');
    });
  }

  _choiceLabel(x,y,text,color) {
    const c=this.add.container(x,y).setDepth(14);
    const t=this.add.text(0,0,text,{fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(13),color:'#ffffff',fontStyle:'600'}).setOrigin(0.5);
    const w=t.width+this.s(22), h=this.s(25);
    const bg=this.add.graphics();
    bg.fillStyle(color,0.3); bg.fillRoundedRect(-w/2,-h/2,w,h,h/2);
    bg.lineStyle(this.s(1.6),color,0.95); bg.strokeRoundedRect(-w/2,-h/2,w,h,h/2);
    c.add([bg,t]); c.setAlpha(0); c.setScale(0.8);
    this.tweens.add({targets:c,alpha:1,scaleX:1,scaleY:1,duration:400,ease:'Back.easeOut'});
    this.tweens.add({targets:c,y:y-this.s(5),duration:1500,yoyo:true,repeat:-1,ease:'Sine.easeInOut',delay:400});
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

  _level2() {
    this.hud.showLevelTitle(2,'The Unexpected Setback');
    this.time.delayedCall(2600,()=>{
      this._workersLeave(); this.districts[2].takeDamage(28); this._updateStats(-5,-8,0);
      this.time.delayedCall(1900,()=>{
        this._showPersistentMessage('The technology district has lost value.\nWhat does the city do?');
        this._showDecisionPanel([
          {icon:'🛡',label:'Protect',desc:'Stop the project',value:'cancel',color:0x3a5f8a},
          {icon:'▶',label:'Continue',desc:'Hold the plan',value:'continue',color:0x4aaa5c},
          {icon:'💰',label:'Invest more',desc:'Double down',value:'invest_more',color:0xddaa00},
          {icon:'⏳',label:'Wait',desc:'Observe first',value:'wait',color:0x6b7a8d}
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

  _level3() {
    this.hud.showLevelTitle(3,'Expansion');
    this.time.delayedCall(2600,()=>{
      this._spawnResourceCubes(6);
      this._showPersistentMessage('The city receives 600 new credits.\nDrag the glowing cubes onto your chosen districts.');
    });
  }

  _spawnResourceCubes(n) {
    this.cubeTotal=n; this.cubeDropped=0;
    const sx=this.PANEL+this.s(50), gap=this.s(84);
    for(let i=0;i<n;i++) this.time.delayedCall(i*250,()=>this.cubes.push(new ResourceCube(this,sx+i*gap,this.H-this.s(70),1)));
  }
  _spawnResourceCube(){ this.cubes.push(new ResourceCube(this,Phaser.Math.Between(this.PANEL+50,this.PANEL+400),this.H-this.s(70),1)); }

  _onResourceDropped(district) {
    this.cubeDropped=(this.cubeDropped||0)+1;
    if(this.currentLevel===3) ScoringEngine.recordDecision(3,'allocate',{districtId:district.id});
    this._updateStats(2,4,-3);
    if(this.currentLevel===3 && this.cubeDropped>=(this.cubeTotal||6)){
      this._clearPersistentMessage();
      this.time.delayedCall(950,()=>this._level3Outcome());
    }
  }

  _level3Outcome() {
    const loser=this.districts[Phaser.Math.Between(0,3)];
    loser.takeDamage(28); this.cameras.main.shake(330,0.004); this._updateStats(-5,-5,0);
    this._showConsequence('The '+loser.name+' district underperformed.\nHow much it hurt depended entirely\non how you spread your resources.',()=>this._nextLevel());
  }

  _level4() {
    this.hud.showLevelTitle(4,'Today or Tomorrow');
    this.time.delayedCall(2600,()=>{
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
    });
  }

  _level5() {
    this.hud.showLevelTitle(5,'The Boom');
    this.time.delayedCall(2600,()=>{
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

  _level6() {
    this.hud.showLevelTitle(6,'The Outside Offer');
    this.time.delayedCall(2600,()=>{
      this._showPersistentMessage('The city council reviews progress.\nA neighbouring city offers to share water infrastructure.');
      this._showDecisionPanel([
        {icon:'🤝',label:'Accept offer',desc:'200 resources now.\nSome dependency risk.',value:'accept',color:0x4ecdc4},
        {icon:'🏗',label:'Build own',desc:'400 resources.\nFull control.',value:'independent',color:0x4aaa5c},
        {icon:'❌',label:'Decline both',desc:'Keep resources\nfor other priorities.',value:'decline',color:0x6b7a8d},
        {icon:'🔍',label:'Research first',desc:'Gather more info\nbefore deciding.',value:'research',color:0xe2a840}
      ],(c)=>{
        ScoringEngine.recordDecision(6,c); this._clearPersistentMessage();
        const m={accept:'Shared infrastructure established.\nThe city saves resources but relies partly on a neighbour.',
                 independent:'The city builds its own infrastructure.\nMore expensive, but fully controlled.',
                 decline:'Resources preserved.\nInfrastructure remains a future concern.',
                 research:'More data gathered.\nThe decision is made with greater confidence.'};
        const dl={accept:[-8,5,-8],independent:[-5,8,-15],decline:[0,0,5],research:[3,0,0]}[c]||[0,0,0];
        this._updateStats(dl[0],dl[1],dl[2]);
        if(c==='accept'||c==='independent') this.districts[0].receiveResource(1);
        this._showConsequence(m[c]||m.research,()=>this._nextLevel());
      });
    });
  }

  // LEVEL 7 — reading the report is a free extra action; a real decision still follows
  _level7() {
    this.hud.showLevelTitle(7,'Breaking News');
    this.time.delayedCall(2600,()=>{
      this._newsTicker(['📰 Several major cities abandoning technology districts!','📰 Friends and advisors recommending immediate action...']);
      this.time.delayedCall(2400,()=>this._level7Decide(false));
    });
  }

  _level7Decide(hasRead) {
    this._showPersistentMessage(hasRead
      ? 'You have the full picture. Now decide what the city does.'
      : 'News arrives from across the region.\nTake your time. The decision sits open.');

    const opts=[
      {icon:'📤',label:'Sell tech',desc:'Act immediately.',value:'sell',color:0xe74c3c},
      {icon:'⬇',label:'Reduce',desc:'Cautious middle path.',value:'reduce',color:0xe2a840},
      {icon:'🔒',label:'Hold steady',desc:'Ignore headlines.',value:'hold',color:0x4aaa5c}
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
               hold:'The city holds its position.\nTime will tell whether the headlines were right.'};
      const dl={sell:[-5,-12,12],reduce:[-2,-5,5],hold:[2,0,0]}[c]||[0,0,0];
      this._updateStats(dl[0],dl[1],dl[2]);
      if(c==='sell') this.districts[2].takeDamage(15);
      this._showConsequence(m[c]||m.hold,()=>this._nextLevel());
    });
  }

  _level8() {
    this.hud.showLevelTitle(8,'The Great Storm');
    this.time.delayedCall(1800,()=>{
      this.weather.startStorm(()=>{
        this.districts.forEach(d=>{d.setStorm(true);d.takeDamage(26);});
        this._updateStats(-15,-20,-10); this.cameras.main.shake(900,0.012);
        if(this.hasUniversity){
          this.time.delayedCall(2000,()=>{
            this._tempMessage('The Research University opens its doors.\nGraduates create companies. Income rises. Your patience pays off.',6000);
            this.districts[0].receiveResource(2); this.districts[1].receiveResource(1);
            this._updateStats(10,15,0);
          });
        }
        this.time.delayedCall(this.hasUniversity?7400:3900,()=>{
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
              this._showConsequence(m[c]||m.hold,()=>this._finish());
            });
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

  // Ticker sits directly under the top bar; messages stack below it
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

  _tempMessage(text,dur){
    const m=this.add.text(this._cx(),this.H-this.s(120),text,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),color:'#e2a840',
      align:'center',backgroundColor:'#040a14',padding:{x:this.s(20),y:this.s(12)},lineSpacing:this.s(5)
    }).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.tweens.add({targets:m,alpha:1,y:this.H-this.s(128),duration:1000,hold:dur||5000,yoyo:true,onComplete:()=>m.destroy()});
  }

  _showConsequence(text,onContinue){
    this._clearConsequence(); this._clearDecisionPanel();
    const cx=this._cx();
    const pw=Math.min(this.s(720),this._availW()), ph=this.s(104), px=cx-pw/2, py=this.H-this.s(186);
    const bg=this.add.graphics();
    bg.fillStyle(0x040a14,0.95); bg.fillRoundedRect(px,py,pw,ph,this.s(12));
    bg.lineStyle(1,0x4ecdc4,0.55); bg.strokeRoundedRect(px,py,pw,ph,this.s(12));
    bg.lineStyle(this.s(4),0x4ecdc4,0.8); bg.lineBetween(px,py+this.s(10),px,py+ph-this.s(10));
    const t=this.add.text(cx,py+ph/2,text,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(17),color:'#dbe8f4',
      align:'center',wordWrap:{width:pw-this.s(56)},lineSpacing:this.s(6)}).setOrigin(0.5);
    this.consequencePanel=this.add.container(0,0).setDepth(62);
    this.consequencePanel.add([bg,t]); this.consequencePanel.setAlpha(0);
    this.tweens.add({targets:this.consequencePanel,alpha:1,duration:650});
    this.time.delayedCall(1100,()=>{
      const lbl=(typeof currentLang!=='undefined'&&currentLang==='de')?'Weiter →':'Continue →';
      this.worldBtn=new WorldButton(this,cx,this.H-this.s(262),lbl,()=>{this.worldBtn=null;if(onContinue)onContinue();});
    });
  }
  _clearConsequence(){ if(this.consequencePanel){this.tweens.killTweensOf(this.consequencePanel);this.consequencePanel.destroy();this.consequencePanel=null;} }

  _showDecisionPanel(options,cb){
    this._clearDecisionPanel();
    const cx=this._cx(), cols=Math.min(options.length,4);
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
  _clearWorldBtn(){ if(this.worldBtn){this.worldBtn.destroy();this.worldBtn=null;} }
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
