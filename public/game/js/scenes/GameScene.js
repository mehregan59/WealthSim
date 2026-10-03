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
    const pts = compactPoints || [
      {x:px(0.08), y:baseY},
      {x:px(0.34), y:baseY - this.s(30)},
      {x:px(0.66), y:baseY - this.s(30)},
      {x:px(0.92), y:baseY}
    ];
    const labels = ['Housing','Transport','Technology','Energy'];
    const colors = [0x7eab6e, 0x7da5c8, 0xa87bc4, 0xe8a838];
    this.districts = pts.map((p,i) => new District(this, p.x, p.y, labels[i], colors[i]));
  }

  _introSequence() {
    this._startLevel(1);
  }

  _restoreSnapshot(n) {
    if (!this.snapshots[n]) return;
    const snap = this.snapshots[n];
    this.cityStats = Object.assign({}, snap.cityStats);
    this.statsPanel.updateStats(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources);
    this._decisions = snap.decisions.slice();
    this._choicesMade = snap.choicesMade.slice();
  }

  _saveSnapshot(n) {
    this.snapshots[n] = {
      cityStats: Object.assign({}, this.cityStats),
      decisions: this._decisions.slice(),
      choicesMade: this._choicesMade ? this._choicesMade.slice() : []
    };
  }

  _startLevel(n) {
    this.currentLevel = n;
    this._saveSnapshot(n);
    const ld = this._levelData(n);
    this._clearDecisionPanel();
    this._clearConsequence();
    this._clearWorldBtn();
    if (!ld) {
      if (n > this.totalLevels || !this.totalLevels) this._toProfile();
      return;
    }
    this._panelIntroShown = this._panelIntroShown || false;
    const showPanel = () => {
      if (!this._panelIntroShown && this.statsPanel && !this.isCompact) {
        this._panelIntroShown = true;
        this.statsPanel.container.setVisible(true);
        this.statsPanel.animateIn && this.statsPanel.animateIn();
      }
      this._showLevelIntro(n, ld);
    };
    if (n === 1) {
      this.time.delayedCall(600, showPanel);
    } else {
      showPanel();
    }
  }

  get totalLevels() { return 10; }

  _showLevelIntro(n, ld) {
    this.hud.showLevelBanner(n, this._levelName(), ld.situation || '', () => {
      this._showDecisionPanel(n, ld);
    });
  }

  _showDecisionPanel(n, ld) {
    if (!ld) ld = this._levelData(n);
    if (!ld) { this._toProfile(); return; }
    const choices = ld.choices || [];
    if (!choices.length) { this._applyOutcome(n, ld, null); return; }
    this.decisionPanel = new DecisionPanel(this, n, ld, this.isCompact, (chosen) => {
      this._clearDecisionPanel();
      this._applyOutcome(n, ld, chosen);
    });
  }

  _clearDecisionPanel() {
    if (this.decisionPanel) { this.decisionPanel.destroy(); this.decisionPanel = null; }
  }

  _applyOutcome(n, ld, chosen) {
    const outcomes = ld.outcomes || {};
    const out = (chosen !== null && outcomes[chosen]) ? outcomes[chosen] : (outcomes['*'] || {});
    this._recordChoice(n, chosen, out);
    const delta = out.delta || {};
    if (delta.happiness) this.cityStats.happiness = Math.max(0, Math.min(100, this.cityStats.happiness + delta.happiness));
    if (delta.development) this.cityStats.development = Math.max(0, Math.min(100, this.cityStats.development + delta.development));
    if (delta.resources) this.cityStats.resources = Math.max(0, Math.min(100, this.cityStats.resources + delta.resources));
    this.statsPanel.updateStats(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources);
    this.statsPanel.recordSnapshot(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources, n);
    this.cityscape && this.cityscape.growCity(n);
    this._showConsequence(n, ld, chosen, out);
  }

  _recordChoice(n, chosen, out) {
    if (!this._choicesMade) this._choicesMade = [];
    this._choicesMade.push({ level: n, choice: chosen, outcome: out });
    if (typeof recordDecision === 'function') recordDecision(n, chosen, out);
  }

  _showConsequence(n, ld, chosen, out) {
    const text = out.consequence || out.text || '';
    if (!text) { this._afterConsequence(n); return; }
    this.consequencePanel = new AskResults(this, text, this.isCompact, () => {
      this._clearConsequence();
      this._afterConsequence(n);
    });
  }

  _clearConsequence() {
    if (this.consequencePanel) { this.consequencePanel.destroy(); this.consequencePanel = null; }
  }

  _afterConsequence(n) {
    if (n >= this.totalLevels) {
      this.time.delayedCall(400, () => this._toProfile());
    } else {
      this.time.delayedCall(300, () => {
        this.cityscape && this.cityscape.transitionToLevel(n + 1);
        this._startLevel(n + 1);
      });
    }
  }

  _toProfile() {
    const data = {
      choices: this._choicesMade || [],
      cityStats: this.cityStats,
      cityName: this.cityName
    };
    this.scene.start('ProfileScene', data);
  }

  _clearWorldBtn() {
    if (this.worldBtn) { this.worldBtn.destroy(); this.worldBtn = null; }
    if (this.worldBtnTimer) { this.worldBtnTimer.remove(); this.worldBtnTimer = null; }
  }

  _onResourceDropped(district, value, cube) {
    const n = this.currentLevel;
    if (n === 3) {
      this.cubeDropped++;
      const ld = this._levelData(n);
      const threshold = (ld && ld.dropThreshold) ? ld.dropThreshold : 3;
      if (this.cubeDropped >= threshold && !this._level3complete) {
        this._level3complete = true;
        if (this._level3IdleTimer) { this._level3IdleTimer.remove(); this._level3IdleTimer = null; }
        this._clearWorldBtn();
        const ld3 = this._levelData(3);
        this._applyOutcome(3, ld3, 'drop');
      }
    }
    this.cityStats.resources = Math.max(0, Math.min(100, this.cityStats.resources + value * 2));
    this.statsPanel.updateStats(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources);
    const fb = this.add.text(cube.x, cube.y - 20, '+' + value,
      { fontSize: this.s(18) + 'px', color: '#e0a82e', fontFamily: 'Space Grotesk', fontStyle: 'bold' })
      .setDepth(120).setAlpha(0.92);
    this.tweens.add({ targets: fb, y: fb.y - this.s(40), alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => fb.destroy() });
  }

  _levelName(){const lvl=this.currentLevel;const tr=typeof TRANSLATIONS!=='undefined'&&TRANSLATIONS[typeof currentLang!=='undefined'?currentLang:'en'];return (tr&&tr.levels&&tr.levels[lvl-1]&&tr.levels[lvl-1].title)||{1:'The First Opportunity',2:'The Unexpected Setback',3:'The Regulatory Shift',4:'Community Investment',5:'The Boom',6:'The New Competitor',7:'Market Turbulence',8:'The Crash',9:'The Recovery',10:'The Harvest'}[lvl]||'Level '+lvl}

  _tickerLoop(strings, color) {
    if (!this.tickerActive) return;
    const s = strings[Math.floor(Math.random() * strings.length)];
    if (this.persistentMsg) { this.persistentMsg.destroy(); this.persistentMsg = null; }
    const x0 = this.PANEL + this.s(18);
    const maxW = this.W - x0 - this.s(18);
    const fs = this.isCompact ? this.s(13) : this.s(15);
    this.persistentMsg = this.add.text(x0, this.H - this.s(36), s,
      { fontSize: fs + 'px', color: color || '#e0a82e', fontFamily: 'DM Sans', wordWrap: { width: maxW } })
      .setDepth(60).setAlpha(0.78);
    this.time.delayedCall(4200, () => {
      if (this.persistentMsg) {
        this.tweens.add({ targets: this.persistentMsg, alpha: 0, duration: 600,
          onComplete: () => { if (this.persistentMsg) { this.persistentMsg.destroy(); this.persistentMsg = null; } } });
      }
      this.time.delayedCall(700, () => this._tickerLoop(strings, color));
    });
  }

  _showDropFeedback(text, color) {
    if (this.dropFeedbackTimer) { this.dropFeedbackTimer.remove(); this.dropFeedbackTimer = null; }
    if (this.dropFeedback) { this.dropFeedback.destroy(); this.dropFeedback = null; }
    const x0 = this.PANEL + this.s(18);
    const maxW = this.W - x0 - this.s(18);
    const fs = this.isCompact ? this.s(13) : this.s(15);
    this.dropFeedback = this.add.text(x0, this.H - this.s(36), text,
      { fontSize: fs + 'px', color: color || '#ffffff', fontFamily: 'DM Sans', wordWrap: { width: maxW } })
      .setDepth(60).setAlpha(0.88);
    this.dropFeedbackTimer = this.time.delayedCall(3000, () => {
      if (this.dropFeedback) {
        this.tweens.add({ targets: this.dropFeedback, alpha: 0, duration: 500,
          onComplete: () => { if (this.dropFeedback) { this.dropFeedback.destroy(); this.dropFeedback = null; } } });
      }
      this.dropFeedbackTimer = null;
    });
  }

  update(time, delta) {
    if (this.metro) this.metro.update(time, delta);
    if (this.roads) {
      const night = this.ambient ? this.ambient.isNight() : false;
      const quiet = this.ambient ? this.ambient.isQuiet() : false;
      if (!quiet || this.roads.visitor) this.roads.update(delta, night);
    }
    if (this.districts) this.districts.forEach(d => d.update(time, delta));
    if (this.ambient) this.ambient.update(time, delta);
    if (this.weather) this.weather.update(delta);
    if (this.cubes) this.cubes.forEach(c => c && c.active && c.update && c.update(delta));
    if (this.hud) this.hud.update(time, delta);
  }
}
