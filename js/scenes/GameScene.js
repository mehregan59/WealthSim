class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;

    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x0d1f0d, 1); ground.fillRect(0, 330, W, H - 330);
    ground.fillStyle(0x111a11, 1); ground.fillRect(0, 340, W, 20);

    this.ambient = new AmbientSystem(this);
    this.weather = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);
    this.hud = new HUD(this);

    this.cityStats = { happiness: 60, development: 40, resources: 80 };
    this.currentLevel = 1;
    this.cubes = [];
    this.decisionPanel = null;

    this._buildDistricts();
    this.ambient.spawnCarsOnce(this.districts);
    this.hud.updateStats(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources);

    this.input.keyboard.on('keydown-S', () => this._triggerStorm());
    this.input.keyboard.on('keydown-R', () => this._spawnResourceCube());
    this.input.keyboard.on('keydown-ONE', () => this._startLevel(1));
    this.input.keyboard.on('keydown-TWO', () => this._startLevel(2));
    this.input.keyboard.on('keydown-THREE', () => this._startLevel(3));
    this.input.keyboard.on('keydown-FIVE', () => this._startLevel(5));

    this.events.on('resourceDropped', ({ district, value }) => this._onResourceDropped(district, value));

    this._introSequence();
  }

  _buildDistricts() {
    this.districts = [
      new District(this, { id:'housing', name:'Housing District', nameDE:'Wohnviertel', color:0x2d7a3a, darkColor:0x1a4d24, accentColor:0x4aaa5c, cx:280, cy:440, health:50, tooltip:'Stable homes for citizens. Low risk, steady growth. Like bonds in your portfolio.', tooltipDE:'Stabile H\u00e4user f\u00fcr B\u00fcrger. Geringes Risiko, stetiges Wachstum. Wie Anleihen.' }),
      new District(this, { id:'transport', name:'Transport District', nameDE:'Verkehrsviertel', color:0x3a5f8a, darkColor:0x1e3a5c, accentColor:0x5c8ab0, cx:560, cy:400, health:50, tooltip:'Roads and transit connect the city. Moderate risk, reliable returns.', tooltipDE:'Stra\u00dfen und Verkehr verbinden die Stadt. Moderates Risiko, zuverl\u00e4ssige Ertr\u00e4ge.' }),
      new District(this, { id:'technology', name:'Technology District', nameDE:'Technologieviertel', color:0x6a3aaa, darkColor:0x3d1f6e, accentColor:0x9966cc, cx:840, cy:400, health:50, tooltip:'High growth potential. High uncertainty. Can double in value \u2014 or fall sharply.', tooltipDE:'Hohes Wachstumspotenzial. Hohe Unsicherheit. Kann sich verdoppeln \u2014 oder stark fallen.' }),
      new District(this, { id:'energy', name:'Energy District', nameDE:'Energieviertel', color:0xaa8800, darkColor:0x6e5500, accentColor:0xddaa00, cx:1080, cy:450, health:50, tooltip:'Wind and solar power the city. Essential infrastructure. Steady and reliable.', tooltipDE:'Wind und Solar versorgen die Stadt. Wesentliche Infrastruktur. Stabil und zuverl\u00e4ssig.' })
    ];
  }

  _introSequence() {
    const fadeIn = this.add.graphics().setDepth(200);
    fadeIn.fillStyle(0x000000, 1); fadeIn.fillRect(0, 0, this.W, this.H);
    this.tweens.add({ targets: fadeIn, alpha: 0, duration: 2000, delay: 500, onComplete: () => { fadeIn.destroy(); this._startLevel(1); } });
    const openText = this.add.text(this.W/2, this.H/2, 'Your city awaits.', { fontFamily: 'Georgia, serif', fontSize: 28, color: '#e2a840' }).setOrigin(0.5).setDepth(201).setAlpha(0);
    this.tweens.add({ targets: openText, alpha: 1, duration: 800, delay: 600, hold: 1200, yoyo: true, onComplete: () => openText.destroy() });
  }

  _startLevel(levelNum) {
    this.currentLevel = levelNum;
    this._clearDecisionPanel();
    this._clearCubes();
    const levels = { 1: this._level1_firstOpportunity, 2: this._level2_setback, 3: this._level3_expansion, 5: this._level5_boom };
    const fn = levels[levelNum];
    if (fn) { this.hud.setLevel(levelNum, this._getLevelName(levelNum)); this.time.delayedCall(800, fn.bind(this)); }
  }

  _getLevelName(n) {
    return { 1:'The First Opportunity', 2:'The Unexpected Setback', 3:'Expansion', 5:'The Boom' }[n] || 'Level '+n;
  }

  _level1_firstOpportunity() {
    this.hud.showLevelTitle(1, 'The First Opportunity');
    this.time.delayedCall(2800, () => this._showConstructionSites());
  }

  _showConstructionSites() {
    const sites = [
      { district: this.districts[0], label: '\uD83C\uDF31 Safe & Steady', color: 0x4aaa5c },
      { district: this.districts[2], label: '\u26A1 High Growth', color: 0x9966cc },
      { district: this.districts[3], label: '\u2600\uFE0F Balanced', color: 0xddaa00 }
    ];
    this.siteMarkers = [];
    sites.forEach((site, i) => {
      this.time.delayedCall(i * 400, () => {
        const marker = this._createSiteMarker(site.district.cx, site.district.cy - 30, site.label, site.color, site.district);
        this.siteMarkers.push(marker);
      });
    });
    this.hud.showMessage('Tap a construction site to choose your first project', 3000);
  }

  _createSiteMarker(x, y, label, color, district) {
    const container = this.add.container(x, y).setDepth(40);
    const ring = this.add.graphics();
    ring.lineStyle(2, color, 0.8); ring.strokeCircle(0, 0, 24);
    container.add(ring);
    const icon = this.add.graphics();
    icon.fillStyle(color, 0.15); icon.fillCircle(0, 0, 20);
    icon.fillStyle(color, 0.8); icon.fillCircle(0, 0, 8);
    container.add(icon);
    const text = this.add.text(0, -42, label, { fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#f0f4ff', backgroundColor: '#060e1c', padding: { x: 8, y: 4 } }).setOrigin(0.5);
    container.add(text);
    this.tweens.add({ targets: ring, scaleX: { from: 0.8, to: 1.4 }, scaleY: { from: 0.8, to: 1.4 }, alpha: { from: 0.9, to: 0 }, duration: 1200, repeat: -1 });
    this.tweens.add({ targets: container, y: y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const hitZone = this.add.circle(x, y, 50, 0xffffff, 0).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => this._onLevel1Choice(district, label, color, hitZone, container));
    return { container, hitZone };
  }

  _onLevel1Choice(district, label, color, hitZone, marker) {
    if (this.siteMarkers) this.siteMarkers.forEach(m => { try { m.container.destroy(); m.hitZone.destroy(); } catch(e){} });
    const distIdx = this.districts.indexOf(district);
    const valueMap = { 0: 'safe', 1: 'balanced', 2: 'aggressive', 3: 'balanced' };
    ScoringEngine.recordDecision(1, valueMap[distIdx] || 'balanced');
    district.receiveResource(2);
    this.cameras.main.shake(300, 0.005);
    this.time.delayedCall(800, () => {
      const msgs = { safe: 'Construction begins quietly. Slow. Safe.', balanced: 'A balanced approach takes shape.', aggressive: 'Cranes swing. The city feels alive.' };
      this.hud.showMessage(msgs[valueMap[distIdx]] || msgs.balanced, 2500);
      this.time.delayedCall(2800, () => this.hud.showMessage('Press 2 for Level 2  \u2022  S for storm  \u2022  R for resource cube', 3000));
    });
    this._updateCityStats(5, 10, -5);
  }

  _level2_setback() {
    this.hud.showLevelTitle(2, 'The Unexpected Setback');
    this.time.delayedCall(2800, () => {
      this._workersLeave();
      this.districts[2].takeDamage(25);
      this.time.delayedCall(1500, () => {
        this._showDecisionPanel([
          { icon: '\uD83D\uDEE1', label: 'Protect', desc: 'Stop the project', value: 'cancel', color: 0x3a5f8a },
          { icon: '\u25B6', label: 'Continue', desc: 'Hold the plan', value: 'continue', color: 0x4aaa5c },
          { icon: '\uD83D\uDCB0', label: 'Invest more', desc: 'Double down', value: 'invest_more', color: 0xddaa00 },
          { icon: '\u23F3', label: 'Wait', desc: 'Observe', value: 'wait', color: 0x6b7a8d }
        ], (choice) => { ScoringEngine.recordDecision(2, choice); this._onLevel2Consequence(choice); });
      });
    });
  }

  _workersLeave() {
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 200, () => {
        const tech = this.districts[2];
        const w = this.add.graphics().setDepth(15);
        w.fillStyle(0xffcc88, 1); w.fillCircle(0, 0, 3);
        w.setPosition(tech.cx + Phaser.Math.Between(-30,30), tech.cy);
        this.tweens.add({ targets: w, x: tech.cx + Phaser.Math.Between(80,200), y: tech.cy + Phaser.Math.Between(-20,20), alpha: 0, duration: 1500, onComplete: () => w.destroy() });
      });
    }
    const scaff = this.add.graphics().setDepth(10);
    const tech = this.districts[2];
    scaff.lineStyle(1, 0x888888, 0.7);
    for (let i = 0; i < 4; i++) scaff.lineBetween(tech.cx-20+i*10, tech.cy-30, tech.cx-20+i*10, tech.cy+10);
    scaff.lineBetween(tech.cx-20, tech.cy-20, tech.cx+20, tech.cy-20);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: scaff, alpha: 0, duration: 1000, onComplete: () => scaff.destroy() }));
    this.hud.showMessage('Construction costs rise. Workers are leaving...', 2000);
  }

  _onLevel2Consequence(choice) {
    this._clearDecisionPanel();
    const effects = {
      cancel: { delta: [5,-10,10], msg: 'Resources secured. The project rests.' },
      continue: { delta: [0,5,-5], msg: 'The plan continues. The city holds.' },
      invest_more: { delta: [-5,12,-15], msg: 'The city doubles down. High stakes.' },
      wait: { delta: [-5,-5,0], msg: 'The city waits. Resources safe, but idle.' }
    };
    const eff = effects[choice] || effects.continue;
    this._updateCityStats(...eff.delta);
    this.hud.showMessage(eff.msg, 2500);
    if (choice === 'invest_more') { this.districts[2].receiveResource(1); this.cameras.main.shake(200, 0.003); }
    else if (choice === 'cancel') this.districts[2].takeDamage(10);
    this.time.delayedCall(3000, () => this.hud.showMessage('Press 3 for Level 3', 2500));
  }

  _level3_expansion() {
    this.hud.showLevelTitle(3, 'Expansion');
    this.time.delayedCall(2800, () => {
      this._spawnResourceCubes(6);
      this.hud.showMessage('Allocate your resources. Drag the cubes into the districts.', 3500);
    });
  }

  _spawnResourceCubes(count) {
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 300, () => {
        const cube = new ResourceCube(this, 160 + (i % 6) * 80, this.H - 80, 1);
        this.cubes.push(cube);
      });
    }
  }

  _spawnResourceCube() {
    const cube = new ResourceCube(this, Phaser.Math.Between(150, 500), this.H - 80, 1);
    this.cubes.push(cube);
  }

  _onResourceDropped(district, value) {
    this.cubes = this.cubes.filter(c => !c.container?.destroyed);
    this._updateCityStats(2, 5, -3);
    if (this.cubes.length === 0 && this.currentLevel === 3) {
      this.time.delayedCall(1200, () => this._level3_outcome());
    }
  }

  _level3_outcome() {
    const idx = Phaser.Math.Between(0, 3);
    const loser = this.districts[idx];
    loser.takeDamage(30);
    this.cameras.main.shake(400, 0.004);
    this.hud.showMessage('The ' + loser.name + ' underperformed...', 2000);
    this.time.delayedCall(2200, () => this.hud.showMessage('How much it hurt depended on how you spread your resources.', 3000));
  }

  _level5_boom() {
    this.hud.showLevelTitle(5, 'The Boom');
    this.time.delayedCall(2800, () => {
      const tech = this.districts[2];
      tech.receiveResource(4); tech.receiveResource(4);
      for (let i = 0; i < 12; i++) this.time.delayedCall(i * 200, () => this._spawnFirework(tech.cx + Phaser.Math.Between(-80,80), tech.cy + Phaser.Math.Between(-80,20)));
      this._showNewsTicker(['\uD83D\uDCF0 Technology District doubles! All neighbouring cities are moving in...', '\uD83D\uDCF0 Experts: Growth will continue \u2014 time to move in?']);
      this.time.delayedCall(1500, () => {
        this.districts.forEach((d, i) => { if (i !== 2) this.tweens.add({ targets: d.gfx, alpha: 0.5, duration: 800 }); });
        this.time.delayedCall(2000, () => {
          this._showDecisionPanel([
            { icon: '\uD83D\uDE80', label: 'All in', desc: 'Move everything to Tech', value: 'all_in', color: 0x9966cc },
            { icon: '\u2795', label: 'Add more', desc: 'Increase exposure', value: 'increase', color: 0x4ecdc4 },
            { icon: '\u2696', label: 'Stay balanced', desc: 'Keep diversified', value: 'hold', color: 0x4aaa5c },
            { icon: '\uD83D\uDCC9', label: 'Take profits', desc: 'Reduce tech position', value: 'reduce', color: 0xe2a840 }
          ], (choice) => { ScoringEngine.recordDecision(5, choice); this._onBoomChoice(choice); });
        });
      });
    });
  }

  _spawnFirework(x, y) {
    const colors = [0xff6644,0xffcc00,0x44ffcc,0xff44aa,0xaaccff];
    const color = colors[Phaser.Math.Between(0, colors.length-1)];
    for (let i = 0; i < 10; i++) {
      const angle = (i/10)*Math.PI*2;
      const spark = this.add.graphics().setDepth(35);
      spark.fillStyle(color,1); spark.fillCircle(0,0,2); spark.setPosition(x,y);
      this.tweens.add({ targets:spark, x:x+Math.cos(angle)*Phaser.Math.Between(30,70), y:y+Math.sin(angle)*Phaser.Math.Between(30,70), alpha:0, duration:600+Math.random()*400, onComplete:()=>spark.destroy() });
    }
  }

  _showNewsTicker(lines) {
    const bg = this.add.graphics().setDepth(45);
    bg.fillStyle(0xcc2200,0.9); bg.fillRect(0,55,this.W,32);
    bg.lineStyle(1,0xff4422,1); bg.lineBetween(0,55,this.W,55); bg.lineBetween(0,87,this.W,87);
    const ticker = this.add.text(this.W+20,63,lines.join('  \u2605  '),{fontFamily:'Arial,sans-serif',fontSize:14,color:'#ffffff',fontStyle:'bold'}).setDepth(46);
    this.tweens.add({ targets:ticker, x:-(ticker.width||800), duration:14000, ease:'Linear', onComplete:()=>{ ticker.destroy(); bg.destroy(); } });
  }

  _onBoomChoice(choice) {
    this._clearDecisionPanel();
    this.districts.forEach(d => this.tweens.add({ targets:d.gfx, alpha:1, duration:600 }));
    const msgs = { all_in:'All in on technology. The city feels unstoppable.', increase:'More technology. Momentum builds.', hold:'The city watches the boom from a balanced position.', reduce:'Profits secured. The city steps back.' };
    this.hud.showMessage(msgs[choice] || msgs.hold, 2500);
    this.time.delayedCall(3000, () => this.hud.showMessage('Press S to experience the storm', 3000));
  }

  _triggerStorm() {
    this._clearDecisionPanel(); this._clearCubes();
    this.hud.showLevelTitle(8, 'The Great Storm');
    this.weather.startStorm(() => {
      this.districts.forEach(d => { d.setStorm(true); d.takeDamage(25); });
      this._updateCityStats(-15,-20,-10);
      this.cameras.main.shake(800, 0.01);
      this.hud.showMessage('An economic storm hits every city...', 2500);
      this.time.delayedCall(3500, () => this._showStormDecision());
    });
  }

  _showStormDecision() {
    this._showDecisionPanel([
      { icon: '\uD83C\uDFC3', label: 'Sell all', desc: 'Protect resources', value: 'sell_all', color: 0xe74c3c },
      { icon: '\uD83C\uDFDB', label: 'Protect essentials', desc: 'Hold the plan', value: 'hold', color: 0x4aaa5c },
      { icon: '\u2696', label: 'Rebalance', desc: 'Redistribute resources', value: 'rebalance', color: 0x4ecdc4 },
      { icon: '\uD83D\uDCC8', label: 'Buy the dip', desc: 'Invest while low', value: 'opportunistic', color: 0xe2a840 }
    ], (choice) => { ScoringEngine.recordDecision(8, choice); this._onStormChoice(choice); });
  }

  _onStormChoice(choice) {
    this._clearDecisionPanel();
    this.weather.stopStorm(1000);
    this.time.delayedCall(1500, () => {
      this.districts.forEach(d => d.setStorm(false));
      this.weather.startRecovery(() => {
        this.districts.forEach(d => d.receiveResource(1));
        this._updateCityStats(10,15,5);
        this.hud.showMessage('The storm passes. The city recovers.', 3000);
      });
      const msgs = { sell_all:'Resources secured. The city waits.', hold:'The plan holds. The city weathers the storm.', rebalance:'A more resilient structure emerges.', opportunistic:'The city invests at the bottom. Risky. Bold.' };
      this.hud.showMessage(msgs[choice]||msgs.hold, 2500);
    });
  }

  _showDecisionPanel(options, callback) {
    this._clearDecisionPanel();
    const panelW = Math.min(this.W-40, options.length*160+40);
    const panelH = 110, panelX = (this.W-panelW)/2, panelY = this.H-panelH-20;
    this.decisionPanel = this.add.container(0,0).setDepth(60);
    const bg = this.add.graphics();
    bg.fillStyle(0x060e1c,0.92); bg.fillRoundedRect(panelX,panelY,panelW,panelH,12);
    bg.lineStyle(1,0x1a2744,1); bg.strokeRoundedRect(panelX,panelY,panelW,panelH,12);
    this.decisionPanel.add(bg);
    const btnW = (panelW-40-(options.length-1)*10)/options.length;
    options.forEach((opt, i) => {
      const bx=panelX+20+i*(btnW+10), by=panelY+15;
      const btnBg=this.add.graphics();
      const _drawBtn=(hover)=>{ btnBg.clear(); btnBg.fillStyle(opt.color,hover?0.35:0.15); btnBg.fillRoundedRect(bx,by,btnW,80,8); btnBg.lineStyle(hover?2:1,opt.color,hover?0.8:0.4); btnBg.strokeRoundedRect(bx,by,btnW,80,8); };
      _drawBtn(false);
      this.decisionPanel.add(btnBg);
      const icon=this.add.text(bx+btnW/2,by+18,opt.icon,{fontSize:20}).setOrigin(0.5);
      const label=this.add.text(bx+btnW/2,by+44,opt.label,{fontFamily:'Arial,sans-serif',fontSize:12,color:'#f0f4ff',fontStyle:'bold'}).setOrigin(0.5);
      const desc=this.add.text(bx+btnW/2,by+62,opt.desc,{fontFamily:'Arial,sans-serif',fontSize:10,color:'#6b8aaa'}).setOrigin(0.5);
      this.decisionPanel.add([icon,label,desc]);
      const hit=this.add.rectangle(bx+btnW/2,by+40,btnW-4,76,0xffffff,0).setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>_drawBtn(true)); hit.on('pointerout',()=>_drawBtn(false));
      hit.on('pointerdown',()=>{ this.cameras.main.shake(100,0.002); if(callback) callback(opt.value); });
      this.decisionPanel.add(hit);
    });
    this.decisionPanel.y=80;
    this.tweens.add({targets:this.decisionPanel,y:0,duration:400,ease:'Back.easeOut'});
  }

  _clearDecisionPanel() {
    if (this.decisionPanel) { this.tweens.killTweensOf(this.decisionPanel); this.decisionPanel.destroy(); this.decisionPanel=null; }
  }

  _clearCubes() {
    this.cubes.forEach(c => { try { c.destroy(); } catch(e){} });
    this.cubes = [];
  }

  _updateCityStats(h, d, r) {
    this.cityStats.happiness = Math.max(5,Math.min(100,this.cityStats.happiness+h));
    this.cityStats.development = Math.max(5,Math.min(100,this.cityStats.development+d));
    this.cityStats.resources = Math.max(5,Math.min(100,this.cityStats.resources+r));
    this.hud.updateStats(this.cityStats.happiness,this.cityStats.development,this.cityStats.resources);
    this.hud.advanceYear(2);
  }

  update(time, delta) {
    this.ambient.update(time, delta, this.districts);
    this.weather.update(delta);
    this.districts.forEach(d => d.update(time, delta));
  }
}
