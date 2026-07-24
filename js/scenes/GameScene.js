class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width; this.H = this.scale.height;
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x0d1a0d,1); ground.fillRect(0,340,this.W,this.H-340);
    ground.fillStyle(0x0a150a,1); ground.fillRect(0,350,this.W,18);
    this.ambient    = new AmbientSystem(this);
    this.weather    = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);
    this.cityStats  = { happiness:60, development:40, resources:80 };
    this.currentLevel = 0;
    this.cubes = []; this.cubeTotal = 0; this.cubeDropped = 0;
    this.decisionPanel = null; this.worldBtn = null;
    this.consequencePanel = null; this.persistentMsg = null;
    this.hasUniversity = false;
    this._buildDistricts();
    this.roads = new RoadNetwork(this, this.districts);
    this.hud   = new HUD(this);
    this.statsPanel = new StatsPanel(this);
    this.statsPanel.updateStats(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources);
    this.input.keyboard.on('keydown-R', () => this._spawnResourceCube());
    this.input.keyboard.on('keydown-S', () => this._startLevel(8));
    this.events.on('resourceDropped', ({district,value}) => this._onResourceDropped(district,value));
    this._introSequence();
  }

  _buildDistricts() {
    this.districts = [
      new District(this, {id:'housing',name:'Housing',nameDE:'Wohnviertel',label:'Housing District',labelDE:'Wohnviertel',color:0x2d7a3a,darkColor:0x1a4d24,accentColor:0x4aaa5c,cx:280,cy:445,health:45,tooltip:'Stable homes for citizens.\nLow risk, steady growth.\nLike bonds in your portfolio.',tooltipDE:'Stabile H\u00e4user f\u00fcr B\u00fcrger.\nGeringes Risiko, stetiges Wachstum.\nWie Anleihen in deinem Portfolio.'}),
      new District(this, {id:'transport',name:'Transport',nameDE:'Verkehrsviertel',label:'Transport District',labelDE:'Verkehrsviertel',color:0x3a5f8a,darkColor:0x1e3a5c,accentColor:0x5c8ab0,cx:560,cy:405,health:45,tooltip:'Roads and transit connect the city.\nModerate risk, reliable returns.\nKeeps the city moving.',tooltipDE:'Stra\u00dfen verbinden die Stadt.\nModerates Risiko, zuverl\u00e4ssige Ertr\u00e4ge.\nH\u00e4lt die Stadt in Bewegung.'}),
      new District(this, {id:'technology',name:'Technology',nameDE:'Technologieviertel',label:'Technology District',labelDE:'Technologieviertel',color:0x6a3aaa,darkColor:0x3d1f6e,accentColor:0x9966cc,cx:840,cy:405,health:45,tooltip:'High growth potential.\nHigh uncertainty.\nCan double \u2014 or fall sharply.',tooltipDE:'Hohes Wachstumspotenzial.\nHohe Unsicherheit.\nKann sich verdoppeln \u2014 oder stark fallen.'}),
      new District(this, {id:'energy',name:'Energy',nameDE:'Energieviertel',label:'Energy District',labelDE:'Energieviertel',color:0xaa8800,darkColor:0x6e5500,accentColor:0xddaa00,cx:1060,cy:455,health:45,tooltip:'Wind and solar power the city.\nEssential infrastructure.\nSteady and reliable.',tooltipDE:'Wind und Solar versorgen die Stadt.\nWesentliche Infrastruktur.\nStabil und zuverl\u00e4ssig.'})
    ];
  }

  _introSequence() {
    const fi=this.add.graphics().setDepth(200);
    fi.fillStyle(0x000000,1); fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:2200,delay:400,onComplete:()=>{fi.destroy();this._startLevel(1);}});
    const txt=this.add.text(this.W/2,this.H/2,'Your city awaits.',{fontFamily:'Georgia,serif',fontSize:28,color:'#e2a840'}).setOrigin(0.5).setDepth(201).setAlpha(0);
    this.tweens.add({targets:txt,alpha:1,duration:700,delay:700,hold:1200,yoyo:true,onComplete:()=>txt.destroy()});
  }

  _startLevel(n) {
    this.currentLevel=n;
    this._clearDecisionPanel(); this._clearCubes(); this._clearConsequence();
    this._clearWorldBtn(); this._clearPersistentMessage();
    this.cubeDropped=0; this.cubeTotal=0;
    const map={1:this._level1_firstOpportunity,2:this._level2_setback,3:this._level3_expansion,4:this._level4_todayOrTomorrow,5:this._level5_boom,6:this._level6_outsideOffer,7:this._level7_breakingNews,8:this._level8_storm};
    const fn=map[n]; if(!fn)return;
    this.hud.setLevel(n,this._getLevelName(n));
    this.time.delayedCall(600,fn.bind(this));
  }

  _getLevelName(n){return {1:'The First Opportunity',2:'The Unexpected Setback',3:'Expansion',4:'Today or Tomorrow',5:'The Boom',6:'The Outside Offer',7:'Breaking News',8:'The Great Storm'}[n]||'Level '+n;}
  _nextLevel(){this._clearConsequence();this._clearWorldBtn();const next=this.currentLevel+1;if(next<=8)this._startLevel(next);}

  _level1_firstOpportunity() {
    this.hud.showLevelTitle(1,'The First Opportunity');
    this.time.delayedCall(3000,()=>{
      this._showSiteMarkers([
        {district:this.districts[0],label:'\uD83C\uDF31 Safe & Steady',color:0x4aaa5c},
        {district:this.districts[1],label:'\uD83D\uDE8C Reliable Growth',color:0x5c8ab0},
        {district:this.districts[2],label:'\uD83D\uDE80 High Potential',color:0x9966cc},
        {district:this.districts[3],label:'\u26A1 Balanced',color:0xddaa00}
      ]);
      this._showPersistentMessage('Tap a construction site to choose your first project.');
    });
  }

  _showSiteMarkers(sites) {
    this.siteMarkers=[];
    sites.forEach((site,i)=>{
      this.time.delayedCall(i*350,()=>{
        const m=this._createSiteMarker(site.district.cx,site.district.cy-35,site.label,site.color,site.district);
        this.siteMarkers.push(m);
      });
    });
  }

  _createSiteMarker(x,y,label,color,district) {
    const c=this.add.container(x,y).setDepth(40);
    const ring=this.add.graphics(); ring.lineStyle(2,color,0.8); ring.strokeCircle(0,0,26); c.add(ring);
    const dot=this.add.graphics(); dot.fillStyle(color,0.2); dot.fillCircle(0,0,22); dot.fillStyle(color,0.85); dot.fillCircle(0,0,9); c.add(dot);
    const txt=this.add.text(0,-46,label,{fontFamily:'Arial,sans-serif',fontSize:12,color:'#f0f4ff',backgroundColor:'#060e1c',padding:{x:8,y:4}}).setOrigin(0.5); c.add(txt);
    this.tweens.add({targets:ring,scaleX:{from:0.7,to:1.5},scaleY:{from:0.7,to:1.5},alpha:{from:0.9,to:0},duration:1300,repeat:-1});
    this.tweens.add({targets:c,y:y-9,duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    const hit=this.add.circle(x,y,52,0xffffff,0).setInteractive({useHandCursor:true});
    hit.on('pointerdown',()=>this._onLevel1Choice(district,color));
    return {c,hit};
  }

  _onLevel1Choice(district,color) {
    this._clearSiteMarkers(); this._clearPersistentMessage();
    const idx=this.districts.indexOf(district);
    const vals=['safe','balanced','aggressive','balanced'];
    ScoringEngine.recordDecision(1,vals[idx]||'balanced');
    district.receiveResource(2); this.cameras.main.shake(250,0.004); this._updateStats(5,10,-5);
    const msgs={safe:'Construction begins carefully.\nThe city grows slowly but steadily.',balanced:'A balanced approach takes shape.\nThe city moves forward with measured confidence.',aggressive:'Cranes rise. Citizens are excited.\nResults will take time to appear.'};
    this._showConsequence(msgs[vals[idx]]||msgs.balanced,()=>this._nextLevel());
  }

  _clearSiteMarkers(){if(this.siteMarkers){this.siteMarkers.forEach(m=>{try{m.c.destroy();m.hit.destroy();}catch(e){}});this.siteMarkers=[];}}

  _level2_setback() {
    this.hud.showLevelTitle(2,'The Unexpected Setback');
    this.time.delayedCall(3000,()=>{
      this._workersLeave(); this.districts[2].takeDamage(28); this._updateStats(-5,-8,0);
      this.time.delayedCall(1800,()=>{
        this._showPersistentMessage('The technology district has lost 20% of its value.\nWhat does the city do?');
        this._showDecisionPanel([
          {icon:'\uD83D\uDEE1',label:'Protect',desc:'Stop the project',value:'cancel',color:0x3a5f8a},
          {icon:'\u25B6',label:'Continue',desc:'Hold the plan',value:'continue',color:0x4aaa5c},
          {icon:'\uD83D\uDCB0',label:'Invest more',desc:'Double down',value:'invest_more',color:0xddaa00},
          {icon:'\u23F3',label:'Wait',desc:'Observe first',value:'wait',color:0x6b7a8d}
        ],(choice)=>{
          ScoringEngine.recordDecision(2,choice); this._clearPersistentMessage();
          const eff={cancel:{delta:[5,-10,10],msg:'Resources secured.\nThe project rests. The city will not benefit if it recovers.'},continue:{delta:[0,5,-5],msg:'The plan continues.\nThe city accepts short-term uncertainty.'},invest_more:{delta:[-5,12,-15],msg:'The city doubles down.\nHigh stakes.'},wait:{delta:[-5,-5,0],msg:'Construction stalls.\nResources are safe but idle.'}};
          const e=eff[choice]||eff.continue; this._updateStats(...e.delta);
          if(choice==='invest_more'){this.districts[2].receiveResource(1);this.cameras.main.shake(200,0.003);}
          else if(choice==='cancel') this.districts[2].takeDamage(8);
          this._showConsequence(e.msg,()=>this._nextLevel());
        });
      });
    });
  }

  _workersLeave() {
    for(let i=0;i<8;i++){this.time.delayedCall(i*180,()=>{const t=this.districts[2];const w=this.add.graphics().setDepth(15);w.fillStyle(0xffcc88,1);w.fillCircle(0,0,3);w.setPosition(t.cx+Phaser.Math.Between(-30,30),t.cy);this.tweens.add({targets:w,x:t.cx+Phaser.Math.Between(80,200),y:t.cy+Phaser.Math.Between(-25,25),alpha:0,duration:1400,onComplete:()=>w.destroy()});});}
    const scaff=this.add.graphics().setDepth(10); const t=this.districts[2]; scaff.lineStyle(1,0x888888,0.6);
    for(let i=0;i<4;i++)scaff.lineBetween(t.cx-20+i*12,t.cy-32,t.cx-20+i*12,t.cy+12);
    scaff.lineBetween(t.cx-20,t.cy-20,t.cx+24,t.cy-20);
    this.time.delayedCall(6000,()=>this.tweens.add({targets:scaff,alpha:0,duration:1000,onComplete:()=>scaff.destroy()}));
  }

  _level3_expansion() {
    this.hud.showLevelTitle(3,'Expansion');
    this.time.delayedCall(3000,()=>{
      this._spawnResourceCubes(6);
      this._showPersistentMessage('The city receives 600 new credits.\nDrag the glowing cubes into your chosen districts.');
    });
  }

  _spawnResourceCubes(count) {
    this.cubeTotal=count; this.cubeDropped=0;
    for(let i=0;i<count;i++){this.time.delayedCall(i*280,()=>{const cube=new ResourceCube(this,120+i*90,this.H-75,1);this.cubes.push(cube);});}
  }

  _spawnResourceCube(){const cube=new ResourceCube(this,Phaser.Math.Between(100,450),this.H-75,1);this.cubes.push(cube);}

  _onResourceDropped(district,value) {
    this.cubeDropped=(this.cubeDropped||0)+1;
    this._updateStats(2,4,-3);
    // Use a counter — container.destroyed is unreliable immediately after destroy()
    if(this.currentLevel===3 && this.cubeDropped>=(this.cubeTotal||6)){
      this._clearPersistentMessage();
      this.time.delayedCall(1000,()=>this._level3_outcome());
    }
  }

  _level3_outcome() {
    const loser=this.districts[Phaser.Math.Between(0,3)];
    loser.takeDamage(28); this.cameras.main.shake(350,0.004); this._updateStats(-5,-5,0);
    this._showConsequence('The '+loser.name+' district underperformed.\nHow much it hurt the city depended entirely\non how you spread your resources.',()=>this._nextLevel());
  }

  _level4_todayOrTomorrow() {
    this.hud.showLevelTitle(4,'Today or Tomorrow');
    this.time.delayedCall(3000,()=>{
      this._showPersistentMessage('The city can build one of two facilities.\nThis decision will echo through the rest of the game.');
      this._showDecisionPanel([
        {icon:'\uD83C\uDFAA',label:'Festival Square',desc:'Happy citizens now.\nLittle long-term value.',value:'festival',color:0xe2a840},
        {icon:'\uD83C\uDF93',label:'Research University',desc:'No reward for several levels.\nPowerful later.',value:'university',color:0x4ecdc4}
      ],(choice)=>{
        ScoringEngine.recordDecision(4,choice); this._clearPersistentMessage();
        if(choice==='university'){this.hasUniversity=true;this._updateStats(0,0,-8);this._showConsequence('Construction begins quietly.\nNo result yet. The city waits.\nSomething is being built that may matter greatly later.',()=>this._nextLevel());}
        else{this._updateStats(18,0,0);this.districts[0].receiveResource(1);this._showConsequence('The square is built. Citizens celebrate today.\nThe city is happy \u2014 but only for now.',()=>this._nextLevel());}
      });
    });
  }

  _level5_boom() {
    this.hud.showLevelTitle(5,'The Boom');
    this.time.delayedCall(3000,()=>{
      const tech=this.districts[2]; tech.receiveResource(4); tech.receiveResource(3);
      for(let i=0;i<14;i++)this.time.delayedCall(i*180,()=>this._spawnFirework(tech.cx+Phaser.Math.Between(-90,90),tech.cy+Phaser.Math.Between(-80,10)));
      this._showNewsTicker(['\uD83D\uDCF0 Technology District doubles in value!','\uD83D\uDCF0 Experts: growth will continue \u2014 neighbouring cities moving in...']);
      this.time.delayedCall(1600,()=>{
        this.districts.forEach((d,i)=>{if(i!==2)this.tweens.add({targets:d.gfx,alpha:0.45,duration:900});});
        this.time.delayedCall(2200,()=>{
          this._showPersistentMessage('Technology is booming. Other districts suddenly look boring.\nWhat does the city do?');
          this._showDecisionPanel([
            {icon:'\uD83D\uDE80',label:'All in',desc:'Move everything\nto technology',value:'all_in',color:0x9966cc},
            {icon:'\u2795',label:'Invest more',desc:'Increase exposure\nwhile keeping some',value:'increase',color:0x4ecdc4},
            {icon:'\u2696',label:'Stay diversified',desc:'Resist momentum\nhold the balance',value:'hold',color:0x4aaa5c},
            {icon:'\uD83D\uDCC9',label:'Take profits',desc:'Reduce tech\nand secure gains',value:'reduce',color:0xe2a840}
          ],(choice)=>{
            ScoringEngine.recordDecision(5,choice); this._clearPersistentMessage();
            this.districts.forEach(d=>this.tweens.add({targets:d.gfx,alpha:1,duration:600}));
            const msgs={all_in:'Everything committed to technology.\nThe city feels unstoppable. For now.',increase:'More technology in the mix.\nMomentum builds.',hold:'The city watches from a balanced position.\nSome feel it is missing out.',reduce:'Profits secured.\nThe city steps back from the excitement.'};
            if(choice==='all_in'){tech.receiveResource(3);this._updateStats(5,15,-12);}
            else if(choice==='increase'){tech.receiveResource(1);this._updateStats(3,8,-5);}
            else if(choice==='hold')this._updateStats(2,4,0);
            else this._updateStats(0,-3,8);
            this._showConsequence(msgs[choice]||msgs.hold,()=>this._nextLevel());
          });
        });
      });
    });
  }

  _spawnFirework(x,y){const colors=[0xff6644,0xffcc00,0x44ffcc,0xff44aa,0xaaccff,0xee88ff];const col=colors[Phaser.Math.Between(0,colors.length-1)];for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;const s=this.add.graphics().setDepth(35);s.fillStyle(col,1);s.fillCircle(0,0,Phaser.Math.Between(2,4));s.setPosition(x,y);this.tweens.add({targets:s,x:x+Math.cos(a)*Phaser.Math.Between(35,75),y:y+Math.sin(a)*Phaser.Math.Between(35,75),alpha:0,duration:550+Math.random()*400,onComplete:()=>s.destroy()});}}

  _level6_outsideOffer() {
    this.hud.showLevelTitle(6,'The Outside Offer');
    this.time.delayedCall(3000,()=>{
      this._showPersistentMessage('The city council reviews progress.\nA neighbouring city offers to share water infrastructure.');
      this._showDecisionPanel([
        {icon:'\uD83E\uDD1D',label:'Accept offer',desc:'200 resources now.\nSome dependency risk.',value:'accept',color:0x4ecdc4},
        {icon:'\uD83C\uDFD7',label:'Build own',desc:'400 resources.\nFull control.',value:'independent',color:0x4aaa5c},
        {icon:'\u274C',label:'Decline both',desc:'Keep resources\nfor other priorities.',value:'decline',color:0x6b7a8d},
        {icon:'\uD83D\uDD0D',label:'Research first',desc:'Gather more info\nbefore deciding.',value:'research',color:0xe2a840}
      ],(choice)=>{
        ScoringEngine.recordDecision(6,choice); this._clearPersistentMessage();
        const msgs={accept:'Shared infrastructure established.\nThe city saves resources but relies partly on a neighbour.',independent:'The city builds its own infrastructure.\nMore expensive, but fully controlled.',decline:'Resources preserved.\nInfrastructure remains a future concern.',research:'More data gathered.\nThe decision is made with greater confidence.'};
        const deltas={accept:[-8,5,-8],independent:[-5,8,-15],decline:[0,0,5],research:[3,0,0]};
        const d=deltas[choice]||[0,0,0]; this._updateStats(d[0],d[1],d[2]);
        if(choice==='accept'||choice==='independent')this.districts[0].receiveResource(1);
        this._showConsequence(msgs[choice]||msgs.research,()=>this._nextLevel());
      });
    });
  }

  _level7_breakingNews() {
    this.hud.showLevelTitle(7,'Breaking News');
    this.time.delayedCall(3000,()=>{
      this._showNewsTicker(['\uD83D\uDCF0 Several major cities abandoning technology districts!','\uD83D\uDCF0 Friends and advisors recommending immediate action...']);
      this.time.delayedCall(2000,()=>{
        this._showPersistentMessage('News arrives from across the region.\nTake your time. The decision sits open.');
        this._showDecisionPanel([
          {icon:'\uD83D\uDCE4',label:'Sell tech',desc:'Act immediately.',value:'sell',color:0xe74c3c},
          {icon:'\u2B07',label:'Reduce',desc:'Cautious middle path.',value:'reduce',color:0xe2a840},
          {icon:'\uD83D\uDD12',label:'Hold steady',desc:'Ignore headlines.',value:'hold',color:0x4aaa5c},
          {icon:'\uD83D\uDCCB',label:'Read report',desc:'Seek more info\nbefore deciding.',value:'research',color:0x5c8ab0}
        ],(choice)=>{
          ScoringEngine.recordDecision(7,choice); this._clearPersistentMessage();
          if(choice==='research'){this._showReportModal('Full Situation Report','Experts are divided. The warning relates to short-term uncertainty. Long-term demand projections remain unclear. The available evidence comes from cities with significantly different circumstances.',()=>{this._showConsequence('The full picture is examined.\nThe city proceeds with a more complete understanding.',()=>this._nextLevel());});return;}
          const msgs={sell:'The technology district is sold.\nResources protected from further decline.',reduce:'Exposure reduced.\nThe city retains some technology interest.',hold:'The city holds its position.\nTime will tell whether the headlines were right.'};
          const deltas={sell:[-5,-12,12],reduce:[-2,-5,5],hold:[2,0,0]};
          const d=deltas[choice]||[0,0,0]; this._updateStats(d[0],d[1],d[2]);
          if(choice==='sell')this.districts[2].takeDamage(15);
          this._showConsequence(msgs[choice]||msgs.hold,()=>this._nextLevel());
        });
      });
    });
  }

  _level8_storm() {
    this.hud.showLevelTitle(8,'The Great Storm');
    this.time.delayedCall(2000,()=>{
      this.weather.startStorm(()=>{
        this.districts.forEach(d=>{d.setStorm(true);d.takeDamage(26);});
        this._updateStats(-15,-20,-10); this.cameras.main.shake(900,0.012);
        if(this.hasUniversity){this.time.delayedCall(2000,()=>{this._showTemporaryMessage('The Research University opens its doors.\nGraduates create companies. Income rises. Your patience pays off.',4000);this.districts[0].receiveResource(2);this.districts[1].receiveResource(1);this._updateStats(10,15,0);});}
        this.time.delayedCall(3800,()=>{
          this._showPersistentMessage('An economic storm hits every city.\nYou cannot prevent it. What do you protect?');
          this._showDecisionPanel([
            {icon:'\uD83C\uDFC3',label:'Sell all',desc:'Protect remaining\nresources.',value:'sell_all',color:0xe74c3c},
            {icon:'\uD83C\uDFDB',label:'Protect essentials',desc:'Shield critical services.\nHold the plan.',value:'hold',color:0x4aaa5c},
            {icon:'\u2696',label:'Rebalance',desc:'Restructure\nthoughtfully.',value:'rebalance',color:0x4ecdc4},
            {icon:'\uD83D\uDCC8',label:'Buy the dip',desc:'Invest selectively\nwhile low.',value:'opportunistic',color:0xe2a840}
          ],(choice)=>{
            ScoringEngine.recordDecision(8,choice); this._clearPersistentMessage();
            this.weather.stopStorm(1000);
            this.time.delayedCall(1800,()=>{
              this.districts.forEach(d=>d.setStorm(false));
              this.weather.startRecovery(()=>{this.districts.forEach(d=>d.receiveResource(1));this._updateStats(8,12,5);});
              const msgs={sell_all:'Resources secured.\nThe city stops building and waits for calmer times.',hold:'The plan holds.\nThe city weathers the storm with its structure intact.',rebalance:'A more resilient structure emerges.\nThe city reorganises thoughtfully.',opportunistic:'The city invests carefully during the downturn.\nIf recovery comes, these decisions will matter.'};
              const deltas={sell_all:[-5,-15,15],hold:[5,0,-5],rebalance:[5,8,-5],opportunistic:[3,12,-10]};
              const d=deltas[choice]||[0,0,0]; this._updateStats(d[0],d[1],d[2]);
              this._showConsequence(msgs[choice]||msgs.hold,()=>this._showEnding());
            });
          });
        });
      });
    });
  }

  _showEnding() {
    this._clearConsequence(); this._clearWorldBtn();
    const W=this.W,H=this.H;
    const ov=this.add.graphics().setDepth(150);
    this.tweens.add({targets:ov,alpha:1,duration:2000,onUpdate:(t)=>{ov.clear();ov.fillStyle(0x060e1c,t.getValue()*0.85);ov.fillRect(0,0,W,H);}});
    this.time.delayedCall(1500,()=>{
      const nar=this.add.text(W/2,H/2-60,'The city you built was never just a city.',{fontFamily:'Georgia,serif',fontSize:26,color:'#e2a840',align:'center'}).setOrigin(0.5).setDepth(151).setAlpha(0);
      this.tweens.add({targets:nar,alpha:1,y:H/2-70,duration:1000,delay:500});
      const sub=this.add.text(W/2,H/2+10,'Your behavioral profile is ready.',{fontFamily:'Arial,sans-serif',fontSize:16,color:'#a8b2c1',align:'center'}).setOrigin(0.5).setDepth(151).setAlpha(0);
      this.tweens.add({targets:sub,alpha:1,duration:800,delay:1800});
      const btn=this.add.text(W/2,H/2+70,'[ View My Profile ]',{fontFamily:'Georgia,serif',fontSize:18,color:'#f0c060'}).setOrigin(0.5).setDepth(151).setAlpha(0).setInteractive({useHandCursor:true});
      this.tweens.add({targets:btn,alpha:1,duration:600,delay:3000});
      btn.on('pointerover',()=>btn.setColor('#ffe090')); btn.on('pointerout',()=>btn.setColor('#f0c060'));
      btn.on('pointerdown',()=>{console.log('[WealthSim] Decisions:',JSON.stringify(ScoringEngine.decisions));this.hud.showMessage('Profile scene coming soon. Check console for decisions.',4000);});
    });
  }

  _showNewsTicker(lines){const bg=this.add.graphics().setDepth(45);bg.fillStyle(0xaa1800,0.92);bg.fillRect(0,54,this.W,34);bg.lineStyle(1,0xff4422,0.8);bg.lineBetween(0,54,this.W,54);bg.lineBetween(0,88,this.W,88);const br=this.add.text(12,63,'BREAKING',{fontFamily:'Arial,sans-serif',fontSize:11,color:'#ffeecc',fontStyle:'bold',letterSpacing:2}).setDepth(46);const sep=this.add.graphics().setDepth(46);sep.fillStyle(0xffffff,0.3);sep.fillRect(82,60,1,20);const ticker=this.add.text(this.W+20,64,lines.join('   \u2605   '),{fontFamily:'Arial,sans-serif',fontSize:13,color:'#ffffff',fontStyle:'bold'}).setDepth(46);this.tweens.add({targets:ticker,x:-(ticker.width+100),duration:Math.max(10000,ticker.width*14),ease:'Linear',onComplete:()=>{ticker.destroy();bg.destroy();br.destroy();sep.destroy();}});}

  _showReportModal(title,text,callback){const W=this.W,H=this.H;const ov=this.add.graphics().setDepth(90);ov.fillStyle(0x000000,0.6);ov.fillRect(0,0,W,H);const bw=500,bh=220,bx=(W-bw)/2,by=(H-bh)/2;const box=this.add.graphics().setDepth(91);box.fillStyle(0x0a1628,0.98);box.fillRoundedRect(bx,by,bw,bh,14);box.lineStyle(1,0xe2a840,0.5);box.strokeRoundedRect(bx,by,bw,bh,14);const t=this.add.text(W/2,by+28,title,{fontFamily:'Georgia,serif',fontSize:16,color:'#e2a840'}).setOrigin(0.5).setDepth(92);const b=this.add.text(W/2,by+70,text,{fontFamily:'Arial,sans-serif',fontSize:13,color:'#a8b2c1',wordWrap:{width:440},align:'center'}).setOrigin(0.5).setDepth(92);const btn=this.add.text(W/2,by+165,'Continue \u2192',{fontFamily:'Georgia,serif',fontSize:14,color:'#f0c060'}).setOrigin(0.5).setDepth(92).setInteractive({useHandCursor:true});btn.on('pointerdown',()=>{ov.destroy();box.destroy();t.destroy();b.destroy();btn.destroy();if(callback)callback();});}

  _showPersistentMessage(text){this._clearPersistentMessage();this.persistentMsg=this.add.text(this.W/2,58,text,{fontFamily:'Georgia,serif',fontSize:15,color:'#d0daf0',align:'center',wordWrap:{width:700},backgroundColor:'#060e1c',padding:{x:18,y:10}}).setOrigin(0.5).setDepth(48).setAlpha(0);this.tweens.add({targets:this.persistentMsg,alpha:1,y:64,duration:400});}
  _clearPersistentMessage(){if(this.persistentMsg){this.tweens.killTweensOf(this.persistentMsg);this.persistentMsg.destroy();this.persistentMsg=null;}}
  _showTemporaryMessage(text,duration){const msg=this.add.text(this.W/2,this.H-100,text,{fontFamily:'Georgia,serif',fontSize:15,color:'#e2a840',align:'center',backgroundColor:'#060e1c',padding:{x:18,y:10}}).setOrigin(0.5).setDepth(65).setAlpha(0);this.tweens.add({targets:msg,alpha:1,y:this.H-108,duration:400,hold:duration||2500,yoyo:true,onComplete:()=>msg.destroy()});}

  _showConsequence(text,onContinue){
    this._clearConsequence(); this._clearDecisionPanel();
    const W=this.W,pw=Math.min(620,W-80),ph=85,px=(W-pw)/2,py=this.H-160;
    const bg=this.add.graphics().setDepth(62);
    bg.fillStyle(0x060e1c,0.92);bg.fillRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(1,0x4ecdc4,0.5);bg.strokeRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(3,0x4ecdc4,0.7);bg.lineBetween(px,py,px,py+ph);
    const txt=this.add.text(W/2,py+42,text,{fontFamily:'Georgia,serif',fontSize:14,color:'#c8d8e8',align:'center',wordWrap:{width:pw-40}}).setOrigin(0.5).setDepth(63);
    this.consequencePanel=this.add.container(0,0).setDepth(62);
    this.consequencePanel.add([bg,txt]);this.consequencePanel.setAlpha(0);
    this.tweens.add({targets:this.consequencePanel,alpha:1,duration:500});
    this.time.delayedCall(1000,()=>{
      const label=typeof currentLang!=='undefined'&&currentLang==='de'?'Weiter \u2192':'Continue \u2192';
      this.worldBtn=new WorldButton(this,W/2,this.H-220,label,()=>{this.worldBtn=null;if(onContinue)onContinue();});
    });
  }
  _clearConsequence(){if(this.consequencePanel){this.tweens.killTweensOf(this.consequencePanel);this.consequencePanel.destroy();this.consequencePanel=null;}}

  _showDecisionPanel(options,callback){
    this._clearDecisionPanel();
    const W=this.W,cols=Math.min(options.length,4);
    const btnW=Math.min(150,(W-60-(cols-1)*10)/cols);
    const panelW=cols*btnW+(cols-1)*10+40,panelH=110;
    const panelX=(W-panelW)/2,panelY=this.H-panelH-15;
    this.decisionPanel=this.add.container(0,0).setDepth(60);
    const bg=this.add.graphics();bg.fillStyle(0x060e1c,0.94);bg.fillRoundedRect(panelX,panelY,panelW,panelH,12);bg.lineStyle(1,0x1a2744,1);bg.strokeRoundedRect(panelX,panelY,panelW,panelH,12);this.decisionPanel.add(bg);
    options.forEach((opt,i)=>{
      const bx=panelX+20+i*(btnW+10),by=panelY+12;
      const btnBg=this.add.graphics();
      const draw=(hover)=>{btnBg.clear();btnBg.fillStyle(opt.color,hover?0.38:0.14);btnBg.fillRoundedRect(bx,by,btnW,86,8);btnBg.lineStyle(hover?2:1,opt.color,hover?0.9:0.4);btnBg.strokeRoundedRect(bx,by,btnW,86,8);};
      draw(false);this.decisionPanel.add(btnBg);
      const icon=this.add.text(bx+btnW/2,by+18,opt.icon,{fontSize:20}).setOrigin(0.5);
      const label=this.add.text(bx+btnW/2,by+44,opt.label,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#f0f4ff',fontStyle:'bold',align:'center',wordWrap:{width:btnW-8}}).setOrigin(0.5);
      const desc=this.add.text(bx+btnW/2,by+68,opt.desc,{fontFamily:'Arial,sans-serif',fontSize:10,color:'#6b8aaa',align:'center',wordWrap:{width:btnW-8}}).setOrigin(0.5);
      this.decisionPanel.add([icon,label,desc]);
      const hit=this.add.rectangle(bx+btnW/2,by+43,btnW-4,84,0xffffff,0).setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>draw(true)); hit.on('pointerout',()=>draw(false));
      hit.on('pointerdown',()=>{this.cameras.main.shake(80,0.002);this._clearDecisionPanel();if(callback)callback(opt.value);});
      this.decisionPanel.add(hit);
    });
    this.decisionPanel.y=70;
    this.tweens.add({targets:this.decisionPanel,y:0,duration:420,ease:'Back.easeOut'});
  }
  _clearDecisionPanel(){if(this.decisionPanel){this.tweens.killTweensOf(this.decisionPanel);this.decisionPanel.destroy();this.decisionPanel=null;}}
  _clearWorldBtn(){if(this.worldBtn){this.worldBtn.destroy();this.worldBtn=null;}}
  _clearCubes(){this.cubes.forEach(c=>{try{c.destroy();}catch(e){}});this.cubes=[];}

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
