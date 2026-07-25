class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width; this.H = this.scale.height;
    this.PANEL = 170; // left stats panel reserve

    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x18351c,1); ground.fillRect(0,352,this.W,this.H-352);
    ground.fillStyle(0x122a15,1); ground.fillRect(0,362,this.W,14);

    this.ambient = new AmbientSystem(this);
    this.weather = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);

    this.cityStats = { happiness:60, development:40, resources:80 };
    this.currentLevel = 0;
    this.cubes = []; this.cubeTotal = 0; this.cubeDropped = 0;
    this.decisionPanel = null; this.worldBtn = null;
    this.consequencePanel = null; this.persistentMsg = null;
    this.hasUniversity = false; this.siteMarkers = [];

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

  // Responsive district placement across available width
  _buildDistricts() {
    const L = this.PANEL + 40, R = this.W - 60, span = R - L;
    const px = f => Math.round(L + span * f);
    this.districts = [
      new District(this, {id:'housing',name:'Housing',nameDE:'Wohnviertel',label:'Housing District',labelDE:'Wohnviertel',
        color:0x2f8a42,darkColor:0x143d1c,accentColor:0x4aaa5c,cx:px(0.06),cy:470,health:45,
        tooltip:'Stable homes for citizens.\nLow risk, steady growth.\nLike bonds in a portfolio.',
        tooltipDE:'Stabile Häuser für Bürger.\nGeringes Risiko, stetiges Wachstum.\nWie Anleihen im Portfolio.'}),
      new District(this, {id:'transport',name:'Transport',nameDE:'Verkehrsviertel',label:'Transport District',labelDE:'Verkehrsviertel',
        color:0x33608f,darkColor:0x142a44,accentColor:0x5c8ab0,cx:px(0.36),cy:432,health:45,
        tooltip:'Roads and transit connect the city.\nModerate risk, reliable returns.\nKeeps everything moving.',
        tooltipDE:'Straßen verbinden die Stadt.\nModerates Risiko, zuverlässige Erträge.\nHält alles in Bewegung.'}),
      new District(this, {id:'technology',name:'Technology',nameDE:'Technologieviertel',label:'Technology District',labelDE:'Technologieviertel',
        color:0x6b3fae,darkColor:0x2a1450,accentColor:0x9966cc,cx:px(0.66),cy:432,health:45,
        tooltip:'High growth potential.\nHigh uncertainty.\nCan double — or fall sharply.',
        tooltipDE:'Hohes Wachstumspotenzial.\nHohe Unsicherheit.\nKann sich verdoppeln — oder stark fallen.'}),
      new District(this, {id:'energy',name:'Energy',nameDE:'Energieviertel',label:'Energy District',labelDE:'Energieviertel',
        color:0xa8850f,darkColor:0x5c4408,accentColor:0xddaa00,cx:px(0.94),cy:478,health:45,
        tooltip:'Wind and solar power the city.\nEssential infrastructure.\nSteady and reliable.',
        tooltipDE:'Wind und Solar versorgen die Stadt.\nWesentliche Infrastruktur.\nStabil und zuverlässig.'})
    ];
  }

  _cx(){ return this.PANEL + (this.W - this.PANEL)/2; }

  _introSequence() {
    const fi=this.add.graphics().setDepth(200);
    fi.fillStyle(0x000000,1); fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:2000,delay:300,onComplete:()=>{fi.destroy();this._startLevel(1);}});
    const txt=this.add.text(this.W/2,this.H/2,'Your city awaits.',{fontFamily:'Playfair Display, Georgia, serif',fontSize:30,color:'#e2a840'}).setOrigin(0.5).setDepth(201).setAlpha(0);
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

  _toProfile(){
    this.tweens.killAll();
    this.scene.start('ProfileScene', { stats: this.cityStats });
  }

  // LEVEL 1
  _level1() {
    this.hud.showLevelTitle(1,'The First Opportunity');
    this.time.delayedCall(2600,()=>{
      const choices=[
        {d:this.districts[0], label:'🌱 Safe & Steady',   val:'safe',       col:0x4aaa5c},
        {d:this.districts[1], label:'🚏 Reliable Growth', val:'balanced',   col:0x5c8ab0},
        {d:this.districts[2], label:'🚀 High Potential',  val:'aggressive', col:0x9966cc},
        {d:this.districts[3], label:'⚡ Balanced',        val:'balanced',   col:0xddaa00}
      ];
      this.siteMarkers=[];
      choices.forEach((c,i)=>{
        this.time.delayedCall(i*280,()=>{
          const m=this._choiceLabel(c.d.cx, c.d.cy-74, c.label, c.col);
          this.siteMarkers.push(m);
          c.d.setSelectable(true, ()=>this._onLevel1Choice(c.d, c.val));
        });
      });
      this._showPersistentMessage('Tap a district to choose your first project.');
    });
  }

  _choiceLabel(x, y, text, color) {
    const c=this.add.container(x,y).setDepth(14);
    const t=this.add.text(0,0,text,{fontFamily:'Inter, Arial, sans-serif',fontSize:12,color:'#ffffff',fontStyle:'600'}).setOrigin(0.5);
    const w=t.width+20,h=22;
    const bg=this.add.graphics();
    bg.fillStyle(color,0.28); bg.fillRoundedRect(-w/2,-h/2,w,h,11);
    bg.lineStyle(1.5,color,0.95); bg.strokeRoundedRect(-w/2,-h/2,w,h,11);
    c.add([bg,t]);
    c.setAlpha(0); c.setScale(0.8);
    this.tweens.add({targets:c,alpha:1,scaleX:1,scaleY:1,duration:400,ease:'Back.easeOut'});
    this.tweens.add({targets:c,y:y-5,duration:1400,yoyo:true,repeat:-1,ease:'Sine.easeInOut',delay:400});
    return c;
  }

  _clearSiteMarkers(){
    if(this.siteMarkers){
      this.siteMarkers.forEach(m=>{try{this.tweens.killTweensOf(m);m.destroy();}catch(e){}});
      this.siteMarkers=[];
    }
  }

  _onLevel1Choice(district, val) {
    this._clearSiteMarkers(); this._clearPersistentMessage();
    this.districts.forEach(d=>d.setSelectable(false));
    ScoringEngine.recordDecision(1, val, {districtId:district.id});
    district.receiveResource(2);
    this.cameras.main.shake(240,0.004);
    this._updateStats(5,10,-5);
    const msgs={
      safe:'Construction begins carefully.\nThe city grows slowly but steadily.',
      balanced:'A balanced approach takes shape.\nThe city moves forward with measured confidence.',
      aggressive:'Cranes rise. Citizens are excited.\nResults will take time to appear.'
    };
    this._showConsequence(msgs[val]||msgs.balanced, ()=>this._nextLevel());
  }

  // LEVEL 2
  _level2() {
    this.hud.showLevelTitle(2,'The Unexpected Setback');
    this.time.delayedCall(2600,()=>{
      this._workersLeave();
      this.districts[2].takeDamage(28);
      this._updateStats(-5,-8,0);
      this.time.delayedCall(1900,()=>{
        this._showPersistentMessage('The technology district has lost value.\nWhat does the city do?');
        this._showDecisionPanel([
          {icon:'🛡',label:'Protect',desc:'Stop the project',value:'cancel',color:0x3a5f8a},
          {icon:'▶',label:'Continue',desc:'Hold the plan',value:'continue',color:0x4aaa5c},
          {icon:'💰',label:'Invest more',desc:'Double down',value:'invest_more',color:0xddaa00},
          {icon:'⏳',label:'Wait',desc:'Observe first',value:'wait',color:0x6b7a8d}
        ],(ch)=>{
          ScoringEngine.recordDecision(2,ch); this._clearPersistentMessage();
          const e={
            cancel:{d:[5,-10,10],m:'Resources secured.\nThe project rests. The city will not benefit if it recovers.'},
            continue:{d:[0,5,-5],m:'The plan continues.\nThe city accepts short-term uncertainty.'},
            invest_more:{d:[-5,12,-15],m:'The city doubles down.\nHigh stakes.'},
            wait:{d:[-5,-5,0],m:'Construction stalls.\nResources are safe but idle. The cost of doing nothing.'}
          }[ch]||{d:[0,5,-5],m:'The plan continues.'};
          this._updateStats(e.d[0],e.d[1],e.d[2]);
          if(ch==='invest_more'){this.districts[2].receiveResource(1);this.cameras.main.shake(190,0.003);}
          else if(ch==='cancel') this.districts[2].takeDamage(8);
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
        w.fillStyle(0xffcc88,1); w.fillCircle(0,0,2.6); w.fillRect(-1.2,0,2.4,5);
        w.setPosition(t.cx+Phaser.Math.Between(-28,28), t.cy);
        this.tweens.add({targets:w,x:t.cx+Phaser.Math.Between(90,210),y:t.cy+Phaser.Math.Between(-20,30),alpha:0,duration:1700,onComplete:()=>w.destroy()});
      });
    }
    const s=this.add.graphics().setDepth(12);
    s.lineStyle(1.2,0x8a8a8a,0.65);
    for(let i=0;i<5;i++) s.lineBetween(t.cx-26+i*12,t.cy-40,t.cx-26+i*12,t.cy+10);
    s.lineBetween(t.cx-26,t.cy-26,t.cx+22,t.cy-26);
    s.lineBetween(t.cx-26,t.cy-8,t.cx+22,t.cy-8);
    this.time.delayedCall(6500,()=>this.tweens.add({targets:s,alpha:0,duration:1400,onComplete:()=>s.destroy()}));
  }

  // LEVEL 3
  _level3() {
    this.hud.showLevelTitle(3,'Expansion');
    this.time.delayedCall(2600,()=>{
      this._spawnResourceCubes(6);
      this._showPersistentMessage('The city receives 600 new credits.\nDrag the glowing cubes onto your chosen districts.');
    });
  }

  _spawnResourceCubes(n) {
    this.cubeTotal=n; this.cubeDropped=0;
    const startX = this.PANEL + 40;
    for(let i=0;i<n;i++){
      this.time.delayedCall(i*250,()=>{
        this.cubes.push(new ResourceCube(this, startX+i*84, this.H-70, 1));
      });
    }
  }
  _spawnResourceCube(){ this.cubes.push(new ResourceCube(this,Phaser.Math.Between(this.PANEL+40,this.PANEL+400),this.H-70,1)); }

  _onResourceDropped(district,value) {
    this.cubeDropped=(this.cubeDropped||0)+1;
    if (this.currentLevel===3) ScoringEngine.recordDecision(3,'allocate',{districtId:district.id});
    this._updateStats(2,4,-3);
    if(this.currentLevel===3 && this.cubeDropped>=(this.cubeTotal||6)){
      this._clearPersistentMessage();
      this.time.delayedCall(950,()=>this._level3Outcome());
    }
  }

  _level3Outcome() {
    const loser=this.districts[Phaser.Math.Between(0,3)];
    loser.takeDamage(28);
    this.cameras.main.shake(330,0.004);
    this._updateStats(-5,-5,0);
    this._showConsequence('The '+loser.name+' district underperformed.\nHow much it hurt depended entirely\non how you spread your resources.',()=>this._nextLevel());
  }

  // LEVEL 4
  _level4() {
    this.hud.showLevelTitle(4,'Today or Tomorrow');
    this.time.delayedCall(2600,()=>{
      this._showPersistentMessage('The city can build one of two facilities.\nThis decision will echo through the rest of the game.');
      this._showDecisionPanel([
        {icon:'🎪',label:'Festival Square',desc:'Happy citizens now.\nLittle long-term value.',value:'festival',color:0xe2a840},
        {icon:'🎓',label:'Research University',desc:'No reward for several levels.\nPowerful later.',value:'university',color:0x4ecdc4}
      ],(ch)=>{
        ScoringEngine.recordDecision(4,ch); this._clearPersistentMessage();
        if(ch==='university'){
          this.hasUniversity=true; this._updateStats(0,0,-8);
          this._showConsequence('Construction begins quietly.\nNo result yet. The city waits.\nSomething is being built that may matter greatly later.',()=>this._nextLevel());
        } else {
          this._updateStats(18,0,0); this.districts[0].receiveResource(1);
          this._showConsequence('The square is built. Citizens celebrate today.\nThe city is happy — but only for now.',()=>this._nextLevel());
        }
      });
    });
  }

  // LEVEL 5
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
          ],(ch)=>{
            ScoringEngine.recordDecision(5,ch); this._clearPersistentMessage();
            this.districts.forEach(d=>this.tweens.add({targets:[d.gfx,d.animGfx],alpha:1,duration:600}));
            const m={all_in:'Everything committed to technology.\nThe city feels unstoppable. For now.',increase:'More technology in the mix.\nMomentum builds.',hold:'The city watches from a balanced position.\nSome feel it is missing out.',reduce:'Profits secured.\nThe city steps back from the excitement.'};
            if(ch==='all_in'){tech.receiveResource(3);this._updateStats(5,15,-12);}
            else if(ch==='increase'){tech.receiveResource(1);this._updateStats(3,8,-5);}
            else if(ch==='hold') this._updateStats(2,4,0);
            else this._updateStats(0,-3,8);
            this._showConsequence(m[ch]||m.hold,()=>this._nextLevel());
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
      s.fillStyle(col,1); s.fillCircle(0,0,Phaser.Math.Between(2,4)); s.setPosition(x,y);
      this.tweens.add({targets:s,x:x+Math.cos(a)*Phaser.Math.Between(35,80),y:y+Math.sin(a)*Phaser.Math.Between(35,80),alpha:0,duration:550+Math.random()*420,onComplete:()=>s.destroy()});
    }
  }

  // LEVEL 6
  _level6() {
    this.hud.showLevelTitle(6,'The Outside Offer');
    this.time.delayedCall(2600,()=>{
      this._showPersistentMessage('The city council reviews progress.\nA neighbouring city offers to share water infrastructure.');
      this._showDecisionPanel([
        {icon:'🤝',label:'Accept offer',desc:'200 resources now.\nSome dependency risk.',value:'accept',color:0x4ecdc4},
        {icon:'🏗',label:'Build own',desc:'400 resources.\nFull control.',value:'independent',color:0x4aaa5c},
        {icon:'❌',label:'Decline both',desc:'Keep resources\nfor other priorities.',value:'decline',color:0x6b7a8d},
        {icon:'🔍',label:'Research first',desc:'Gather more info\nbefore deciding.',value:'research',color:0xe2a840}
      ],(ch)=>{
        ScoringEngine.recordDecision(6,ch); this._clearPersistentMessage();
        const m={accept:'Shared infrastructure established.\nThe city saves resources but relies partly on a neighbour.',independent:'The city builds its own infrastructure.\nMore expensive, but fully controlled.',decline:'Resources preserved.\nInfrastructure remains a future concern.',research:'More data gathered.\nThe decision is made with greater confidence.'};
        const dl={accept:[-8,5,-8],independent:[-5,8,-15],decline:[0,0,5],research:[3,0,0]}[ch]||[0,0,0];
        this._updateStats(dl[0],dl[1],dl[2]);
        if(ch==='accept'||ch==='independent') this.districts[0].receiveResource(1);
        this._showConsequence(m[ch]||m.research,()=>this._nextLevel());
      });
    });
  }

  // LEVEL 7
  _level7() {
    this.hud.showLevelTitle(7,'Breaking News');
    this.time.delayedCall(2600,()=>{
      this._newsTicker(['📰 Several major cities abandoning technology districts!','📰 Friends and advisors recommending immediate action...']);
      this.time.delayedCall(2200,()=>{
        this._showPersistentMessage('News arrives from across the region.\nTake your time. The decision sits open.');
        this._showDecisionPanel([
          {icon:'📤',label:'Sell tech',desc:'Act immediately.',value:'sell',color:0xe74c3c},
          {icon:'⬇',label:'Reduce',desc:'Cautious middle path.',value:'reduce',color:0xe2a840},
          {icon:'🔒',label:'Hold steady',desc:'Ignore headlines.',value:'hold',color:0x4aaa5c},
          {icon:'📋',label:'Read report',desc:'Seek more info\nbefore deciding.',value:'research',color:0x5c8ab0}
        ],(ch)=>{
          ScoringEngine.recordDecision(7,ch); this._clearPersistentMessage();
          if(ch==='research'){
            this._reportModal('Full Situation Report','Experts are divided. The warning relates to short-term uncertainty. Long-term demand projections remain unclear. The available evidence comes from cities with significantly different circumstances.',()=>{
              this._showConsequence('The full picture is examined.\nThe city proceeds with a more complete understanding.',()=>this._nextLevel());
            });
            return;
          }
          const m={sell:'The technology district is sold.\nResources protected from further decline.',reduce:'Exposure reduced.\nThe city retains some technology interest.',hold:'The city holds its position.\nTime will tell whether the headlines were right.'};
          const dl={sell:[-5,-12,12],reduce:[-2,-5,5],hold:[2,0,0]}[ch]||[0,0,0];
          this._updateStats(dl[0],dl[1],dl[2]);
          if(ch==='sell') this.districts[2].takeDamage(15);
          this._showConsequence(m[ch]||m.hold,()=>this._nextLevel());
        });
      });
    });
  }

  // LEVEL 8
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
        this.time.delayedCall(this.hasUniversity ? 7200 : 3900,()=>{
          this._showPersistentMessage('An economic storm hits every city.\nYou cannot prevent it. What do you protect?');
          this._showDecisionPanel([
            {icon:'🏃',label:'Sell all',desc:'Protect remaining\nresources.',value:'sell_all',color:0xe74c3c},
            {icon:'🏛',label:'Protect essentials',desc:'Shield critical services.\nHold the plan.',value:'hold',color:0x4aaa5c},
            {icon:'⚖',label:'Rebalance',desc:'Restructure\nthoughtfully.',value:'rebalance',color:0x4ecdc4},
            {icon:'📈',label:'Buy the dip',desc:'Invest selectively\nwhile low.',value:'opportunistic',color:0xe2a840}
          ],(ch)=>{
            ScoringEngine.recordDecision(8,ch); this._clearPersistentMessage();
            this.weather.stopStorm(1000);
            this.time.delayedCall(1700,()=>{
              this.districts.forEach(d=>d.setStorm(false));
              this.weather.startRecovery(()=>{
                this.districts.forEach(d=>d.receiveResource(1));
                this._updateStats(8,12,5);
              });
              const m={sell_all:'Resources secured.\nThe city stops building and waits for calmer times.',hold:'The plan holds.\nThe city weathers the storm with its structure intact.',rebalance:'A more resilient structure emerges.\nThe city reorganises thoughtfully.',opportunistic:'The city invests carefully during the downturn.\nIf recovery comes, these decisions will matter.'};
              const dl={sell_all:[-5,-15,15],hold:[5,0,-5],rebalance:[5,8,-5],opportunistic:[3,12,-10]}[ch]||[0,0,0];
              this._updateStats(dl[0],dl[1],dl[2]);
              this._showConsequence(m[ch]||m.hold,()=>this._finish());
            });
          });
        });
      });
    });
  }

  _finish() {
    this._clearConsequence(); this._clearWorldBtn();
    this.statsPanel.recordSnapshot(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources,8);
    const ov = this.add.graphics().setDepth(180);
    this.tweens.add({
      targets:ov, alpha:1, duration:1800,
      onUpdate:(t)=>{ ov.clear(); ov.fillStyle(0x061019, t.getValue()); ov.fillRect(0,0,this.W,this.H); },
      onComplete:()=>this._toProfile()
    });
  }

  // News ticker — 50% slower
  _newsTicker(lines){
    const bg=this.add.graphics().setDepth(45);
    bg.fillStyle(0x9e1600,0.94); bg.fillRect(0,54,this.W,34);
    bg.lineStyle(1,0xff4422,0.8); bg.lineBetween(0,54,this.W,54); bg.lineBetween(0,88,this.W,88);
    const br=this.add.text(14,63,'BREAKING',{fontFamily:'Inter, Arial, sans-serif',fontSize:11,color:'#ffeecc',fontStyle:'700',letterSpacing:2}).setDepth(46);
    const sep=this.add.graphics().setDepth(46); sep.fillStyle(0xffffff,0.3); sep.fillRect(88,60,1,20);
    const tk=this.add.text(this.W+20,64,lines.join('   ★   '),{fontFamily:'Inter, Arial, sans-serif',fontSize:13,color:'#ffffff',fontStyle:'600'}).setDepth(46);
    const dur = Math.max(22000, tk.width*28);  // was width*14 — 2x slower
    this.tweens.add({targets:tk,x:-(tk.width+100),duration:dur,ease:'Linear',onComplete:()=>{tk.destroy();bg.destroy();br.destroy();sep.destroy();}});
  }

  _reportModal(title,text,cb){
    const W=this.W,H=this.H;
    const ov=this.add.graphics().setDepth(90); ov.fillStyle(0x000000,0.65); ov.fillRect(0,0,W,H);
    const bw=520,bh=230,bx=(W-bw)/2,by=(H-bh)/2;
    const box=this.add.graphics().setDepth(91);
    box.fillStyle(0x08121f,0.99); box.fillRoundedRect(bx,by,bw,bh,14);
    box.lineStyle(1,0xe2a840,0.5); box.strokeRoundedRect(bx,by,bw,bh,14);
    const t=this.add.text(W/2,by+30,title,{fontFamily:'Playfair Display, Georgia, serif',fontSize:17,color:'#e2a840'}).setOrigin(0.5).setDepth(92);
    const b=this.add.text(W/2,by+76,text,{fontFamily:'Inter, Arial, sans-serif',fontSize:13,color:'#a8b2c1',wordWrap:{width:450},align:'center',lineSpacing:4}).setOrigin(0.5).setDepth(92);
    const btn=this.add.text(W/2,by+178,'Continue →',{fontFamily:'Playfair Display, Georgia, serif',fontSize:15,color:'#f0c060'}).setOrigin(0.5).setDepth(92).setInteractive({useHandCursor:true});
    btn.on('pointerover',()=>btn.setColor('#ffe090')); btn.on('pointerout',()=>btn.setColor('#f0c060'));
    btn.on('pointerdown',()=>{ov.destroy();box.destroy();t.destroy();b.destroy();btn.destroy();if(cb)cb();});
  }

  _showPersistentMessage(text){
    this._clearPersistentMessage();
    this.persistentMsg=this.add.text(this._cx(),60,text,{fontFamily:'Playfair Display, Georgia, serif',fontSize:16,color:'#dfe8f7',align:'center',wordWrap:{width:Math.min(720,this.W-this.PANEL-80)},backgroundColor:'#040a14',padding:{x:20,y:11},lineSpacing:3}).setOrigin(0.5).setDepth(48).setAlpha(0);
    this.tweens.add({targets:this.persistentMsg,alpha:1,y:66,duration:600});
  }
  _clearPersistentMessage(){ if(this.persistentMsg){this.tweens.killTweensOf(this.persistentMsg);this.persistentMsg.destroy();this.persistentMsg=null;} }

  // Temporary message — much slower fade and longer hold
  _tempMessage(text,dur){
    const m=this.add.text(this._cx(),this.H-110,text,{fontFamily:'Playfair Display, Georgia, serif',fontSize:15,color:'#e2a840',align:'center',backgroundColor:'#040a14',padding:{x:18,y:10},lineSpacing:3}).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.tweens.add({targets:m,alpha:1,y:this.H-118,duration:1000,hold:dur||5000,yoyo:true,onComplete:()=>m.destroy()});
  }

  _showConsequence(text,onContinue){
    this._clearConsequence(); this._clearDecisionPanel();
    const cx=this._cx();
    const pw=Math.min(640,this.W-this.PANEL-80), ph=88, px=cx-pw/2, py=this.H-166;
    const bg=this.add.graphics();
    bg.fillStyle(0x040a14,0.94); bg.fillRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(1,0x4ecdc4,0.5); bg.strokeRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(3,0x4ecdc4,0.75); bg.lineBetween(px,py+8,px,py+ph-8);
    const t=this.add.text(cx,py+44,text,{fontFamily:'Playfair Display, Georgia, serif',fontSize:14,color:'#cfe0ee',align:'center',wordWrap:{width:pw-44},lineSpacing:4}).setOrigin(0.5);
    this.consequencePanel=this.add.container(0,0).setDepth(62);
    this.consequencePanel.add([bg,t]); this.consequencePanel.setAlpha(0);
    this.tweens.add({targets:this.consequencePanel,alpha:1,duration:650});
    this.time.delayedCall(1100,()=>{
      const lbl=(typeof currentLang!=='undefined'&&currentLang==='de')?'Weiter →':'Continue →';
      this.worldBtn=new WorldButton(this,cx,this.H-236,lbl,()=>{this.worldBtn=null;if(onContinue)onContinue();});
    });
  }
  _clearConsequence(){ if(this.consequencePanel){this.tweens.killTweensOf(this.consequencePanel);this.consequencePanel.destroy();this.consequencePanel=null;} }

  _showDecisionPanel(options,cb){
    this._clearDecisionPanel();
    const cx=this._cx();
    const cols=Math.min(options.length,4);
    const availW = this.W - this.PANEL - 80;
    const btnW=Math.min(158,(availW-40-(cols-1)*10)/cols);
    const panelW=cols*btnW+(cols-1)*10+40;
    const panelH=112, panelX=cx-panelW/2, panelY=this.H-panelH-16;
    this.decisionPanel=this.add.container(0,0).setDepth(60);
    const bg=this.add.graphics();
    bg.fillStyle(0x040a14,0.95); bg.fillRoundedRect(panelX,panelY,panelW,panelH,12);
    bg.lineStyle(1,0x1a2744,1); bg.strokeRoundedRect(panelX,panelY,panelW,panelH,12);
    this.decisionPanel.add(bg);
    options.forEach((o,i)=>{
      const bx=panelX+20+i*(btnW+10), by=panelY+13;
      const g=this.add.graphics();
      const draw=(hv)=>{g.clear();g.fillStyle(o.color,hv?0.4:0.14);g.fillRoundedRect(bx,by,btnW,86,8);g.lineStyle(hv?2:1,o.color,hv?0.95:0.42);g.strokeRoundedRect(bx,by,btnW,86,8);};
      draw(false); this.decisionPanel.add(g);
      const ic=this.add.text(bx+btnW/2,by+17,o.icon,{fontSize:20}).setOrigin(0.5);
      const lb=this.add.text(bx+btnW/2,by+43,o.label,{fontFamily:'Inter, Arial, sans-serif',fontSize:11,color:'#f0f4ff',fontStyle:'700',align:'center',wordWrap:{width:btnW-10}}).setOrigin(0.5);
      const de=this.add.text(bx+btnW/2,by+68,o.desc,{fontFamily:'Inter, Arial, sans-serif',fontSize:9.5,color:'#7d97b3',align:'center',wordWrap:{width:btnW-10},lineSpacing:2}).setOrigin(0.5);
      this.decisionPanel.add([ic,lb,de]);
      const hit=this.add.rectangle(bx+btnW/2,by+43,btnW-4,84,0xffffff,0).setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>draw(true)); hit.on('pointerout',()=>draw(false));
      hit.on('pointerdown',()=>{this.cameras.main.shake(70,0.002);this._clearDecisionPanel();if(cb)cb(o.value);});
      this.decisionPanel.add(hit);
    });
    this.decisionPanel.y=70;
    this.tweens.add({targets:this.decisionPanel,y:0,duration:450,ease:'Back.easeOut'});
  }
  _clearDecisionPanel(){ if(this.decisionPanel){this.tweens.killTweensOf(this.decisionPanel);this.decisionPanel.destroy();this.decisionPanel=null;} }
  _clearWorldBtn(){ if(this.worldBtn){this.worldBtn.destroy();this.worldBtn=null;} }
  _clearCubes(){ this.cubes.forEach(c=>{try{c.destroy();}catch(e){}}); this.cubes=[]; }

  _updateStats(h,d,r){
    this.cityStats.happiness=Math.max(5,Math.min(100,this.cityStats.happiness+h));
    this.cityStats.development=Math.max(5,Math.min(100,this.cityStats.development+d));
    this.cityStats.resources=Math.max(5,Math.min(100,this.cityStats.resources+r));
    this.hud.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.statsPanel.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.hud.advanceYear(2);
  }

  update(time,delta){
    const isNight=this.ambient.isNightTime();
    this.ambient.update(time,delta);
    this.weather.update(delta);
    this.roads.update(delta,isNight);
    this.districts.forEach(d=>d.update(time,delta));
  }
}
