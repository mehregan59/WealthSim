class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.S = Math.max(0.85, Math.min(1.9, this.H / 720));
    this.PANEL = this.W < 700 ? 0 : Math.round(Math.min(240, this.W * 0.18));
    this.reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    this.cityName = (window.cityName && String(window.cityName).trim()) ||
      ((typeof currentLang!=='undefined'&&currentLang==='de') ? 'Meine Stadt' : 'My City');

    const groundY = Math.min(this.H * 0.42, this.s(310));
    this.groundY = groundY;
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x9fc88a,1); ground.fillRect(0,groundY,this.W,this.H-groundY);
    ground.fillStyle(0xb2d39a,1); ground.fillRect(0,groundY+this.s(10),this.W,this.s(14));

    this.ambient = new AmbientSystem(this);
    this.weather = new WeatherSystem(this);
    this.tooltipManager = new TooltipManager(this);
    this.tutorial = new Tutorial(this);

    this.cityStats = { happiness:60, development:40, resources:80 };
    this.seed = (window.WS_SEED && String(window.WS_SEED)) ||
                ('s' + Date.now().toString(36) + Math.random().toString(36).slice(2,6));
    this.sim = (window.WS && WS.Sim && WS.Economy)
      ? WS.Sim.createSession(this.seed, { startingCash: WS.Economy.RULES.startCash }) : null;
    if (this.sim) this.cityStats.resources = WS.Economy.fundsIndex(this.sim.total());
    if (typeof ScoringEngine !== 'undefined') ScoringEngine.session = { seed:this.seed, sim:this.sim };
    if (!this.sim) console.error('[WealthSim] simulation not loaded — funds fall back to scripted values');
    this.currentLevel = 0;
    this.cubes = []; this.cubeTotal = 0; this.cubeDropped = 0;
    this.decisionPanel = null; this.worldBtn = null; this.worldBtnTimer = null;
    this.consequencePanel = null; this.persistentMsg = null;
    this.hasUniversity = false; this.siteMarkers = [];
    this.tickerActive = false;
    this.snapshots = {};
    this._panelIntroShown = false;
    this._level3IdleTimer = null;
    this._storm = null;
    // Ch1 contract ladder state
    this._forecastEvents = [];
    this._ch1PairIdx = 0;
    this._ch1Choices = [];
    // Ch9 project review state
    this._ch9Trials = null;
    this._ch9TrialIdx = 0;

    this.hud = new HUD(this);
    this.statsPanel = new StatsPanel(this);

    this._buildDistricts();
    this._buildStats();
    this.roads = new RoadNetwork(this, this.districts);

    this.cameras.main.setBackgroundColor('#b8dded');
    this.experience = new CityExperience(this);
    this.hud.container.setVisible(false);
    if (this.W < 700) this.statsPanel.container.setVisible(false);
    const shake = this.cameras.main.shake.bind(this.cameras.main);
    this.cameras.main.shake = (...args) => this.reducedMotion ? this.cameras.main : shake(...args);

    this._drawCityBoundary();

    this.ambient.update(0, 0);
    if (window.WS_PLAY_MODE === 'research') this._startLevel(1);
    else this.experience.welcome(() => this._startLevel(1));
  }

  _drawCityBoundary(){
    const dxs = this.districts.map(d => d.cx);
    const dys = this.districts.map(d => d.cy);
    const cx = (Math.min(...dxs) + Math.max(...dxs)) / 2;
    const cy = (Math.min(...dys) + Math.max(...dys)) / 2 + this.s(20);
    const rx = (Math.max(...dxs) - Math.min(...dxs)) / 2 + this.s(90);
    const ry = (Math.max(...dys) - Math.min(...dys)) / 2 + this.s(80);
    const N = 32;
    const clampTop = this.s(60);
    const outer = [], inner = [];
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2;
      const wobble = 1 + 0.08 * Math.sin(angle * 3 + 0.7) + 0.05 * Math.cos(angle * 5);
      const ox = cx + Math.cos(angle) * rx * wobble * 1.08;
      const oy = Math.max(clampTop, cy + Math.sin(angle) * ry * wobble * 1.08);
      const ix = cx + Math.cos(angle) * rx * wobble * 0.96;
      const iy = Math.max(clampTop, cy + Math.sin(angle) * ry * wobble * 0.96);
      outer.push({ x: ox, y: oy });
      inner.push({ x: ix, y: iy });
    }
    const boundary = this.add.graphics().setDepth(-3);
    boundary.lineStyle(3, 0xe2a840, 0.22);
    boundary.beginPath();
    outer.forEach((p, i) => i === 0 ? boundary.moveTo(p.x, p.y) : boundary.lineTo(p.x, p.y));
    boundary.closePath(); boundary.strokePath();
    boundary.lineStyle(1.2, 0x4adfbb, 0.13);
    boundary.beginPath();
    inner.forEach((p, i) => i === 0 ? boundary.moveTo(p.x, p.y) : boundary.lineTo(p.x, p.y));
    boundary.closePath(); boundary.strokePath();
  }

  _introSequence(){
    const de = this.de();
    const cityLabel = de
      ? (this.cityName + ' erwartet dich.')
      : (this.cityName + ' awaits.');
    const cx = this.PANEL + (this.W - this.PANEL) / 2;
    const cy = this.H / 2 - this.s(20);
    const dim = this.add.graphics().setDepth(50);
    dim.fillStyle(0x02060c, 0.75); dim.fillRect(0, 0, this.W, this.H);
    const title = this.add.text(cx, cy, cityLabel, {
      fontFamily: 'Playfair Display, Georgia, serif',
      fontSize: this.s(34) + 'px',
      color: '#e2a840',
      alpha: 0,
    }).setOrigin(0.5).setDepth(51).setAlpha(0);
    const sub = this.add.text(cx, cy + this.s(44), de ? 'Deine Stadt, deine Entscheidungen.' : 'Your city. Your decisions.', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: this.s(15) + 'px',
      color: '#8aaac4',
    }).setOrigin(0.5).setDepth(51).setAlpha(0);
    this.tweens.add({ targets: [dim, title, sub], alpha: { from: 0, to: 1 }, duration: 600 });
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [dim, title, sub], alpha: 0, duration: 500,
        onComplete: () => {
          dim.destroy(); title.destroy(); sub.destroy();
          this.tutorial.showBriefing(() => this._startLevel(1));
        }
      });
    });
  }

  // ─── helpers ──────────────────────────────────────────────────────────────────────────
  s(n){ return Math.round(n * this.S); }
  de(){ return typeof currentLang!=='undefined' && currentLang==='de'; }

  _buildDistricts(){
    const W=this.W, H=this.H, s=n=>this.s(n);
    const groundY=this.groundY;
    const narrow = W < 700;
    const area = W - this.PANEL;
    const scale = Math.min(this.S, area / (narrow ? 430 : 850));
    const palette = [
      ['housing','Housing','Wohnen',0xe2a18a,0xb6ce94,0x934d3e],
      ['transport','Transport','Verkehr',0x74b7c7,0xb2d3a3,0x276772],
      ['technology','Technology','Technik',0xb6a0d5,0xb9cba0,0x735b9d],
      ['energy','Energy','Energie',0xf0c96b,0xc3d59c,0x94722c]
    ];
    this.districts = palette.map((d,i) => new District(this, {
      id:d[0], name:d[1], nameDE:d[2], label:d[1], labelDE:d[2],
      cx:this.PANEL + area * (narrow ? (i%2 ? 0.74 : 0.26) : (0.14+i*0.235)),
      cy:narrow ? this.H * (i<2 ? 0.30 : 0.43) : groundY + this.s(15+(i%2)*18),
      scale, color:d[3], darkColor:d[4], accentColor:d[5], health:45,
      tooltip:d[1], tooltipDE:d[2]
    }));
    this.roads && this.roads.init && this.roads.init(this.districts);
  }

  _buildStats(){
    this.statsPanel.updateStats(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources);
    if (this.sim) this.statsPanel.setFundsCredits(this.sim.total());
  }

  _updateStats(dh, dd, dr){
    this.cityStats.happiness   = Math.max(0, Math.min(100, this.cityStats.happiness   + dh));
    this.cityStats.development = Math.max(0, Math.min(100, this.cityStats.development + dd));
    this.cityStats.resources   = Math.max(0, Math.min(100, this.cityStats.resources   + dr));
    this.statsPanel.updateStats(this.cityStats.happiness, this.cityStats.development, this.cityStats.resources);
    if (this.sim) this.statsPanel.setFundsCredits(this.sim.total());
  }

  // ─── level routing ────────────────────────────────────────────────────────────────
  _startLevel(n, isRetry){
    if (ScoringEngine.session) ScoringEngine.session.mode = window.WS_PLAY_MODE || 'quick';
    this.currentLevel = n;
    this.experience && (this.experience.hint = "");
    ScoringEngine.startTimer();
    if (!isRetry) this._snapshotBefore(n);
    this.hud && this.hud.setLevel(n, this._levelName(n));
    const map = {
      1:  this._level1.bind(this),
      2:  this._level2.bind(this),
      3:  this._level3.bind(this),
      4:  this._level4.bind(this),
      5:  this._level5.bind(this),
      6:  this._level6.bind(this),
      7:  this._level7.bind(this),
      8:  this._level8.bind(this),
      9:  this._level9.bind(this),
      10: this._level10.bind(this),
    };
    (map[n] || (() => this._finish()))();
  }

  _levelName(n){
    if (this.de()) return ['', 'Die ersten Verträge', 'Der unerwartete Rückschlag', 'Expansion', 'Heute oder morgen', 'Der Boom', 'Das externe Angebot', 'Schlagzeilen', 'Der große Sturm', 'Die Projektüberprüfung', 'Prognosen und Übung'][n] || ('Kapitel '+n);
    return {
      1: 'The First Contracts', 2: 'The Unexpected Setback',
      3: 'Expansion',           4: 'Today or Tomorrow',
      5: 'The Boom',            6: 'The Outside Offer',
      7: 'Breaking News',       8: 'The Great Storm',
      9: 'The Project Review',  10: 'Forecasts & Practice',
    }[n] || ('Level ' + n);
  }

  _nextLevel(){
    this._clearConsequence(); this._clearWorldBtn(); this._clearLevel3Idle();
    this.statsPanel.recordSnapshot(
      this.cityStats.happiness, this.cityStats.development,
      this.cityStats.resources, this.currentLevel);
    const next = this.currentLevel + 1;
    if (next <= 10) this._startLevel(next);
    else this._finish();
  }

  _snapshotBefore(n){
    this.snapshots[n] = {
      happiness:   this.cityStats.happiness,
      development: this.cityStats.development,
      resources:   this.cityStats.resources,
      simState:    this.sim ? this.sim.snapshot() : null,
    };
  }

  _restoreSnapshot(n){
    const snap = this.snapshots[n];
    if (!snap) return;
    this.cityStats.happiness   = snap.happiness;
    this.cityStats.development = snap.development;
    this.cityStats.resources   = snap.resources;
    if (this.sim && snap.simState) this.sim.restore(snap.simState);
    this._buildStats();
  }

  _retryLevel(){
    const n = this.currentLevel;
    this._clearDecisionPanel(); this._clearConsequence(); this._clearWorldBtn();
    this._clearPersistentMessage(); this._clearSiteMarkers(); this._clearCubes();
    this._clearLevel3Idle();
    this._restoreSnapshot(n);
    if (n === 1) { this._ch1PairIdx = 0; this._ch1Choices = []; }
    this.time.delayedCall(250, () => this._startLevel(n, true));
  }

  // ─── economy bridge ──────────────────────────────────────────────────────────────
  _econ(fn, ...args){
    if (!this.sim || !window.WS || !WS.Economy) return null;
    try {
      const report = WS.Economy[fn](this.sim, ...args);
      if (report && report.returns) {
        (this._forecastEvents || []).forEach(ev => {
          const spec = WS.Chapters.FORECASTS.find(f => f.id === ev.forecastId);
          if (ev.outcome === undefined && spec && Number.isFinite(report.returns[spec.district])) {
            ev.outcome = report.returns[spec.district] > 0 ? 1 : 0;
            ev.resolvedBy = fn;
          }
        });
      }
      return report;
    } catch(e) { console.error('[_econ]', fn, e); return null; }
  }

  _fundsLine(ec){
    if (!ec || !this.sim) return '';
    const t = this.sim.total();
    return '\nFunds: ' + Math.round(t).toLocaleString() + ' credits';
  }

  _investLine(ec, name){
    if (!ec || !this.sim) return '';
    const t = this.sim.total();
    return '\nFunds: ' + Math.round(t).toLocaleString() + ' credits.';
  }

  _yearLine(ec){
    return this._fundsLine(ec);
  }

  // ─── Chapter 1: contract ladder ─────────────────────────────────────────────────────
  _level1(){
    this._ch1PairIdx = 0;
    this._ch1Choices = [];
    this._ch1ShowPair();
  }

  _ch1ShowPair(){
    const Ch = window.WS && WS.Chapters;
    const pairs = Ch ? WS.Chapters.CH1_PAIRS : [];
    if (this._ch1PairIdx >= pairs.length) {
      const wideCount = this._ch1Choices.filter(c => c === 'wide').length;
      const distId = wideCount >= 3 ? 'technology'
                   : wideCount === 2 ? 'transport'
                   : wideCount === 1 ? 'energy'
                   : 'housing';
      const d = this.districts.find(x => x.id === distId);
      if (typeof ScoringEngine !== 'undefined')
        ScoringEngine.recordDecision(1, 'ch1_done', { choices: this._ch1Choices.slice(), districtId: distId });
      const ec = this._econ('level1', distId);
      if (d) d.receiveResource && d.receiveResource(2);
      this.cameras.main.shake(240, 0.004);
      this._updateStats(5, 10, 0);
      const choiceStr = this._ch1Choices.map((c, i) => 'Pair ' + (i + 1) + ': ' + c).join(', ');
      this._showConsequence(
        'Your contract choices directed funds to ' + (d ? d.name : distId) + '.\n' +
        choiceStr + this._investLine(ec, d ? d.name : distId),
        () => this._nextLevel()
      );
      return;
    }
    const pair = pairs[this._ch1PairIdx];
    const fmtContract = c =>
      c.outcomes.map(([p, v]) => (Math.round(p * 100) + '% chance of ' + v + ' credits')).join(' / ');
    this._showDecisionPanel([
      { icon: '�퐒', label: 'Contract A', desc: fmtContract(pair.narrow) + '\nMore predictable outcomes.', value: 'narrow', color: 0x4aaa5c },
      { icon: '🈲', label: 'Contract B', desc: fmtContract(pair.wide)   + '\nHigher potential, higher variance.', value: 'wide',   color: 0x9966cc },
    ], (c) => {
      this._ch1Choices.push(c);
      if (typeof ScoringEngine !== 'undefined')
        ScoringEngine.recordDecision(1, c, { scenarioId:'ch1:pair', trialId: pair.trialId, pHigh: pair.pHigh, pairIdx: this._ch1PairIdx });
      this._ch1PairIdx++;
      const msg = c === 'wide'
        ? 'Contract B chosen — higher potential, higher variance.'
        : 'Contract A chosen — more stable outcomes.';
      this._updateStats(0, 3, 0);
      this._showConsequence(msg, () => this._ch1ShowPair(), { auto: true, autoDelay: 1400 });
    });
  }

  // ─── Chapter 2: setback ─────────────────────────────────────────────────────────────
  _level2(){
    this._workersLeave();
    const techDistrict = this.districts.find(x => x.id === 'technology');
    if (techDistrict) techDistrict.takeDamage && techDistrict.takeDamage(28);
    this._l2event = this._econ('level2Start');
    this._updateStats(-5, -8, 0);
    this.time.delayedCall(800, () => this._level2Decide(false));
  }

  _level2Decide(hadResearch){
    const de = this.de();
    const opts = [
      { icon:'❌', label: de?'Abbrechen':'Cancel',       desc: de?'Projekt stoppen.':'Stop the project.',                                          value:'cancel',       color:0xe74c3c },
      { icon:'⏸', label: de?'Abwarten':'Wait',          desc: de?'Weitere Infos abwarten.':'Wait for more information.',                           value:'wait',         color:0xe2a840 },
      { icon:'▶', label: de?'Weitermachen':'Continue',  desc: de?'Trotzdem weiterzuführen.':'Continue despite the setback.',                       value:'continue',     color:0x4aaa5c },
      { icon:'💰',label: de?'Mehr investieren':'Invest more', desc: de?'Mehr einsetzen.':'Commit additional resources.',                       value:'invest_more',  color:0x9966cc },
    ];
    if (!hadResearch)
      opts.push({ icon:'�퐍', label: de?'Untersuchen':'Investigate', desc: de?'Experten befragen.':'Consult experts before deciding.', value:'research',     color:0x5c8ab0 });

    this._showDecisionPanel(opts, (c) => {
      if (c === 'research') {
        ScoringEngine && ScoringEngine.recordDecision(2, 'research', { phase:'baseline', scenarioId:'ch2:setback' });
        this._showConsequence(
          'Experts are divided. Some expect recovery; others see lasting damage.',
          () => this._level2Decide(true)
        );
        return;
      }
      const ec = this._econ('level2', c);
      const m = {
        cancel:      'You stopped the project. Resources saved, but development paused.',
        wait:        'Construction stalls. The city loses momentum gradually.',
        continue:    'Work continues despite uncertainty.',
        invest_more: 'Additional resources committed to the troubled district.',
      };
      ScoringEngine && ScoringEngine.recordDecision(2, c, {
        hadResearch,
        phase: 'baseline',
        scenarioId: 'ch2:setback',
        trialId: 'l2main',
      });
      const dh = (c === 'cancel') ? -3 : (c === 'continue' || c === 'invest_more') ? 2 : -1;
      const dd = (c === 'invest_more') ? 5 : (c === 'continue') ? 2 : (c === 'cancel') ? -2 : -3;
      this._updateStats(dh, dd, 0);
      this._showConsequence((m[c] || m.wait) + this._yearLine(ec), () => this._nextLevel());
    });
  }

  _workersLeave(){
    const d = this.districts.find(x => x.id === 'technology');
    if (d && d.setStorm) d.setStorm(true);
    this.time.delayedCall(1200, () => { if (d && d.setStorm) d.setStorm(false); });
  }

  // ─── Chapter 3: allocation ─────────────────────────────────────────────────────────────
  _level3(){
    this.cubeTotal = 6; this.cubeDropped = 0;
    this._clearCubes();
    this._econ('level3Deposit');
    this._showPersistentMessage(
      this.de() ? '6 Würfel verteilen — dann auf OK klicken.' : 'Distribute 6 cubes across districts — then press OK.'
    );
    if (this.experience) { this.experience.allocation(); return; }
    this._spawnCubes();
    this._buildWorldBtn(this.de() ? 'OK' : 'OK', () => {
      if (this.cubeDropped < this.cubeTotal) return;
      this._clearPersistentMessage();
      this._clearSiteMarkers();
      this._finishLevel3();
    });
    this._level3IdleTimer = this.time.delayedCall(12000, () => {
      this._showPersistentMessage(
        this.de() ? 'Alle Würfel platzieren, dann OK drücken.' : 'Place all cubes, then press OK.'
      );
    });
  }

  _onResourceDropped(district){
    if (!district || this.cubeDropped >= this.cubeTotal) return;
    this.cubeDropped++;
    if (typeof ScoringEngine !== 'undefined')
      ScoringEngine.recordDecision(3, district.id, { cubeIndex: this.cubeDropped, scenarioId:'ch3:allocate' });
    this._econ('level3Cube', district.id);
    district.receiveResource && district.receiveResource(1);
    this._updateStats(1, 3, 0);
    if (this.cubeDropped >= this.cubeTotal) this._worldBtnFlash && this._worldBtnFlash();
  }

  _finishLevel3(){
    const ec = this._econ('level3Done');
    this._updateStats(3, 5, 0);
    this._showConsequence(
      (this.de() ? 'Ressourcen verteilt. Die Stadt wächst!' : 'Resources distributed. The city grows!') + this._yearLine(ec),
      () => this._nextLevel()
    );
  }

  // ─── Chapter 4: time discount ───────────────────────────────────────────────────────────
  _level4(){
    const de = this.de();
    const Ch = window.WS && WS.Chapters;
    const scenario = Ch ? WS.Chapters.getTimeScenario() : null;
    const now  = scenario ? scenario.now  : { label: de?'300 jetzt':'300 now',  credits: 300 };
    const later = scenario ? scenario.later : { label: de?'500 später':'500 later', credits: 500 };
    this._showDecisionPanel([
      { icon: '💰', label: de?'Jetzt':'Now',   desc: (de?'Sofortige Gutschrift: ':'Immediate credit: ') + now.label,   value:'now',   color:0xe2a840 },
      { icon: '🕒', label: de?'Später':'Later', desc: (de?'Spätere Gutschrift: ':'Future credit: ')   + later.label, value:'later', color:0x4aaa5c },
    ], (c) => {
      const ec = this._econ('level4', c);
      ScoringEngine && ScoringEngine.recordDecision(4, c, {
        phase:'baseline', scenarioId:'ch4:time',
        trialId: scenario ? scenario.trialId : 'l4main',
        nowLabel: now.label, laterLabel: later.label,
      });
      const msg = c === 'now'
        ? (de ? 'Sofortige Mittel sichern stadtweite Stabilität.' : 'Immediate funds secure city-wide stability.')
        : (de ? 'Aufgeschobene Mittel bieten langfristiges Wachstum.' : 'Deferred funds offer long-term growth.');
      this._updateStats(c === 'now' ? 4 : 2, c === 'now' ? 2 : 6, 0);
      this._showConsequence(msg + this._yearLine(ec), () => this._nextLevel());
    });
  }

  // ─── Chapter 5: boom ───────────────────────────────────────────────────────────────────────────
  _level5(){
    const de = this.de();
    const Ch = window.WS && WS.Chapters;
    const scenario = Ch ? WS.Chapters.getBoomScenario() : null;
    const maxGain = scenario ? scenario.maxGain : 800;
    const safeGain = scenario ? scenario.safeGain : 400;
    this._showDecisionPanel([
      { icon: '📊', label: de?'Konservativ':'Conservative', desc: de?('Sicherer Gewinn: '+safeGain+' Credits.'):('Safe gain: '+safeGain+' credits.'),     value:'conservative', color:0x4aaa5c },
      { icon: '🚀', label: de?'Aggressiv':'Aggressive',     desc: de?('Max. Gewinn: '+maxGain+' Credits.'):('Max gain: '+maxGain+' credits.'),           value:'aggressive',   color:0x9966cc },
    ], (c) => {
      const ec = this._econ('level5', c);
      ScoringEngine && ScoringEngine.recordDecision(5, c, {
        phase:'baseline', scenarioId:'ch5:boom',
        trialId: scenario ? scenario.trialId : 'l5main',
        safeGain, maxGain,
      });
      const msg = c === 'aggressive'
        ? (de ? 'Aggressives Investment zahlt sich aus.' : 'Aggressive investment pays off.')
        : (de ? 'Konservative Strategie sichert stabile Erträge.' : 'Conservative strategy secures stable returns.');
      this._updateStats(c === 'aggressive' ? 6 : 3, c === 'aggressive' ? 8 : 4, 0);
      this._showConsequence(msg + this._yearLine(ec), () => this._nextLevel());
    });
  }

  // ─── Chapter 6: outside offer ──────────────────────────────────────────────────────────
  _level6(){
    const de = this.de();
    const Ch = window.WS && WS.Chapters;
    const scenario = Ch ? WS.Chapters.getOfferScenario() : null;
    const offerVal = scenario ? scenario.offerVal : 600;
    const localVal = scenario ? scenario.localVal : 350;
    this._showDecisionPanel([
      { icon: '🌍', label: de?'Externes Angebot':'Outside Offer', desc: de?('Externer Anbieter: '+offerVal+' Credits.'):('External provider: '+offerVal+' credits.'), value:'outside', color:0x9966cc },
      { icon: '🏠', label: de?'Lokal investieren':'Local',          desc: de?('Lokaler Ausbau: '+localVal+' Credits.'):('Local build-out: '+localVal+' credits.'),     value:'local',   color:0x4aaa5c },
    ], (c) => {
      const ec = this._econ('level6', c);
      ScoringEngine && ScoringEngine.recordDecision(6, c, {
        phase:'baseline', scenarioId:'ch6:offer',
        trialId: scenario ? scenario.trialId : 'l6main',
        offerVal, localVal,
      });
      const msg = c === 'outside'
        ? (de ? 'Externes Kapital fließt in die Stadt.' : 'External capital flows into the city.')
        : (de ? 'Lokale Infrastruktur gestärkt.' : 'Local infrastructure strengthened.');
      this._updateStats(c === 'outside' ? 4 : 3, c === 'outside' ? 3 : 5, 0);
      this._showConsequence(msg + this._yearLine(ec), () => this._nextLevel());
    });
  }

  // ─── Chapter 7: news ───────────────────────────────────────────────────────────────────────────
  _level7(){
    const de = this.de();
    const Ch = window.WS && WS.Chapters;
    const scenario = Ch ? WS.Chapters.getNewsScenario() : null;
    const headline = scenario ? scenario.headline : (de ? 'Steigende Ungleichheit in der Region.' : 'Rising inequality in the region.');
    const opts = scenario ? scenario.options.map((o,i) => ({
      icon: ['📺','🗣','🖇','📢'][i] || '○',
      label: o.label,
      desc:  o.desc,
      value: o.value,
      color: [0x4aaa5c, 0xe2a840, 0x9966cc, 0x5c8ab0][i] || 0x888888,
    })) : [
      { icon:'📺', label:de?'Ignorieren':'Ignore',     desc:de?'Keine Reaktion.':'No response.',              value:'ignore',   color:0x888888 },
      { icon:'🗣', label:de?'Erklären':'Explain',    desc:de?'Sachlich informieren.':'Inform factually.',    value:'explain',  color:0x4aaa5c },
      { icon:'🖇', label:de?'Gegensteuern':'Redirect', desc:de?'Lenke Aufmerksamkeit um.':'Redirect attention.',value:'redirect', color:0x9966cc },
      { icon:'📢', label:de?'Handeln':'Act',           desc:de?'Sofort Reformen einleiten.':'Implement reforms immediately.',value:'act',color:0xe2a840 },
    ];
    this._showPersistentMessage(de ? 'Schlagzeile: ' + headline : 'Headline: ' + headline);
    this._showDecisionPanel(opts, (c) => {
      const ec = this._econ('level7', c);
      ScoringEngine && ScoringEngine.recordDecision(7, c, {
        phase:'baseline', scenarioId:'ch7:news',
        trialId: scenario ? scenario.trialId : 'l7main',
      });
      const m = { ignore:'City trust erodes slowly.', explain:'Citizens appreciate transparency.', redirect:'Attention shifts — temporarily.', act:'Swift action boosts confidence.' };
      const dh = { ignore:-3, explain:2, redirect:1, act:4 }[c] ?? 0;
      const dd = { ignore:0, explain:1, redirect:0, act:3 }[c] ?? 0;
      this._clearPersistentMessage();
      this._updateStats(dh, dd, 0);
      this._showConsequence((m[c] || '') + this._yearLine(ec), () => this._nextLevel());
    });
  }

  // ─── Chapter 8: storm ───────────────────────────────────────────────────────────────────────────
  _level8(){
    const de = this.de();
    const Ch = window.WS && WS.Chapters;
    const scenario = Ch ? WS.Chapters.getStormScenario() : null;
    const stormTarget = scenario ? scenario.target : 'housing';
    const d = this.districts.find(x => x.id === stormTarget);
    if (d && d.setStorm) { d.setStorm(true); this._storm = d; }
    this._econ('level8Start');
    this._updateStats(-8, -5, 0);
    const opts = scenario ? scenario.options.map((o,i) => ({
      icon: ['🛡','💰','📝','🤝'][i] || '○',
      label: o.label, desc: o.desc, value: o.value,
      color: [0xe74c3c, 0xe2a840, 0x5c8ab0, 0x4aaa5c][i] || 0x888888,
    })) : [
      { icon:'🛡', label:de?'Absichern':'Fortify',       desc:de?'Infrastruktur schützen.':'Protect infrastructure.',     value:'fortify',  color:0xe74c3c },
      { icon:'💰', label:de?'Entschädigen':'Compensate', desc:de?'Betroffene entschädigen.':'Compensate affected citizens.',value:'compensate',color:0xe2a840 },
      { icon:'📝', label:de?'Dokumentieren':'Document',  desc:de?'Schäden erfassen.':'Document damage for aid.',          value:'document', color:0x5c8ab0 },
      { icon:'🤝', label:de?'Kooperieren':'Cooperate',   desc:de?'Nachbarn um Hilfe bitten.':'Seek help from neighbors.',   value:'cooperate',color:0x4aaa5c },
    ];
    this.time.delayedCall(700, () => {
      this._showDecisionPanel(opts, (c) => {
        if (this._storm && this._storm.setStorm) this._storm.setStorm(false);
        const ec = this._econ('level8', c);
        ScoringEngine && ScoringEngine.recordDecision(8, c, {
          phase:'baseline', scenarioId:'ch8:storm',
          trialId: scenario ? scenario.trialId : 'l8main', stormTarget,
        });
        const m = {
          fortify:    de ? 'Infrastruktur gesichert. Schäden begrenzt.'      : 'Infrastructure secured. Damage limited.',
          compensate: de ? 'Bürger erhalten Entschädigung.'                 : 'Citizens receive compensation.',
          document:   de ? 'Schäden erfasst. Hilfe unterwegs.'               : 'Damage recorded. Aid incoming.',
          cooperate:  de ? 'Nachbarn helfen. Gemeinschaft gestärkt.'          : 'Neighbors help. Community strengthened.',
        };
        const dh = { fortify:3, compensate:6, document:2, cooperate:5 }[c] ?? 2;
        const dd = { fortify:5, compensate:2, document:3, cooperate:4 }[c] ?? 2;
        this._updateStats(dh, dd, 0);
        this._showConsequence((m[c] || '') + this._yearLine(ec), () => this._nextLevel());
      });
    });
  }

  // ─── Chapter 9: project review ─────────────────────────────────────────────────────────
  _level9(){
    const Ch = window.WS && WS.Chapters;
    this._ch9Trials = Ch ? WS.Chapters.getCh9Trials() : [];
    this._ch9TrialIdx = 0;
    this._ch9ShowTrial();
  }

  _ch9ShowTrial(){
    const de = this.de();
    if (this._ch9TrialIdx >= this._ch9Trials.length) {
      const ec = this._econ('level9Done');
      this._updateStats(4, 6, 0);
      this._showConsequence(
        (de ? 'Projektprüfungen abgeschlossen.' : 'Project reviews complete.') + this._yearLine(ec),
        () => this._nextLevel()
      );
      return;
    }
    const trial = this._ch9Trials[this._ch9TrialIdx];
    const opts = trial.options.map((o, i) => ({
      icon: ['💡','🔍','ℹ️','📊'][i] || '○',
      label: o.label, desc: o.desc, value: o.value,
      color: [0x4aaa5c, 0x5c8ab0, 0xe2a840, 0x9966cc][i] || 0x888888,
    }));
    this._showDecisionPanel(opts, (c) => {
      ScoringEngine && ScoringEngine.recordDecision(9, c, {
        phase:'baseline', scenarioId:'ch9:review',
        trialId: trial.trialId, trialIdx: this._ch9TrialIdx,
      });
      this._econ('level9', trial.trialId, c);
      this._updateStats(2, 3, 0);
      this._ch9TrialIdx++;
      this._showConsequence(
        (de ? 'Entscheidung getroffen. Weiter.' : 'Decision recorded. Moving on.'),
        () => this._ch9ShowTrial(), { auto: true, autoDelay: 1200 }
      );
    });
  }

  // ─── Chapter 10: forecasts & practice ─────────────────────────────────────────────────
  _level10(){
    const Ch = window.WS && WS.Chapters;
    const forecasts = Ch ? WS.Chapters.FORECASTS : [];
    this._forecastEvents = forecasts.map(f => ({ forecastId: f.id, outcome: undefined }));
    this._showForecastPanel();
  }

  _showForecastPanel(){
    const de = this.de();
    const Ch = window.WS && WS.Chapters;
    const forecasts = Ch ? WS.Chapters.FORECASTS : [];
    const opts = forecasts.map((f, i) => ({
      icon: ['📈','🏡','⚡','🚌'][i] || '○',
      label: f.label || f.id,
      desc:  f.desc  || '',
      value: f.id,
      color: [0x4aaa5c, 0xe2a840, 0x9966cc, 0x5c8ab0][i] || 0x888888,
    }));
    this._showDecisionPanel(opts, (c) => {
      const spec = forecasts.find(f => f.id === c);
      const ev   = this._forecastEvents.find(e => e.forecastId === c);
      if (ev) ev.prediction = c;
      ScoringEngine && ScoringEngine.recordDecision(10, c, {
        phase:'baseline', scenarioId:'ch10:forecast', forecastId: c,
      });
      const ec = this._econ('level10', c);
      const resolve = ev && ev.outcome !== undefined;
      const correct = ev && ev.outcome === 1;
      const msg = resolve
        ? (correct
            ? (de ? 'Prognose bestätigt! Gut eingeschätzt.' : 'Forecast confirmed! Well judged.')
            : (de ? 'Prognose nicht bestätigt.' : 'Forecast did not materialise.'))
        : (de ? 'Prognose registriert.' : 'Forecast recorded.');
      this._updateStats(correct ? 4 : 1, correct ? 3 : 1, 0);
      this._showConsequence(msg + this._yearLine(ec), () => this._finish());
    });
  }

  // ─── finish ─────────────────────────────────────────────────────────────────────────────────
  _finish(){
    this._clearConsequence(); this._clearWorldBtn(); this._clearDecisionPanel();
    this._clearPersistentMessage(); this._clearSiteMarkers(); this._clearCubes();
    if (this._storm && this._storm.setStorm) this._storm.setStorm(false);
    const report = ScoringEngine.finish(this.sim);
    if (typeof window !== 'undefined' && typeof window.onGameFinish === 'function') {
      window.onGameFinish(report);
    } else {
      this.scene.start('EndScene', { report });
    }
  }

  // ─── UI helpers ─────────────────────────────────────────────────────────────────────────────
  _showDecisionPanel(options, onChoose){
    this._clearDecisionPanel();
    if (!this._panelIntroShown) {
      this._panelIntroShown = true;
      this.hud.container.setVisible(true);
      if (this.W >= 700) this.statsPanel.container.setVisible(true);
    }
    this.decisionPanel = new DecisionPanel(this, options, onChoose);
  }

  _clearDecisionPanel(){
    if (this.decisionPanel) { this.decisionPanel.destroy(); this.decisionPanel = null; }
  }

  _showConsequence(text, onNext, opts={}){
    this._clearConsequence();
    this.consequencePanel = new ConsequencePanel(this, text, onNext, opts);
  }

  _clearConsequence(){
    if (this.consequencePanel) { this.consequencePanel.destroy(); this.consequencePanel = null; }
  }

  _showPersistentMessage(text){
    this._clearPersistentMessage();
    this.persistentMsg = new PersistentMessage(this, text);
  }

  _clearPersistentMessage(){
    if (this.persistentMsg) { this.persistentMsg.destroy(); this.persistentMsg = null; }
  }

  _buildWorldBtn(label, onClick){
    this._clearWorldBtn();
    this.worldBtn = new WorldButton(this, label, onClick);
  }

  _worldBtnFlash(){
    if (this.worldBtn) this.worldBtn.flash && this.worldBtn.flash();
  }

  _clearWorldBtn(){
    if (this.worldBtn) { this.worldBtn.destroy(); this.worldBtn = null; }
    if (this.worldBtnTimer) { this.worldBtnTimer.remove(); this.worldBtnTimer = null; }
  }

  _clearLevel3Idle(){
    if (this._level3IdleTimer) { this._level3IdleTimer.remove(); this._level3IdleTimer = null; }
  }

  _spawnCubes(){
    this._clearCubes();
    for (let i = 0; i < this.cubeTotal; i++) {
      const x = this.PANEL + this.s(60) + Math.random() * (this.W - this.PANEL - this.s(120));
      const y = this.s(80) + Math.random() * this.s(60);
      this.cubes.push(new ResourceCube(this, x, y, this.districts));
    }
  }

  _clearCubes(){
    this.cubes.forEach(c => c.destroy && c.destroy());
    this.cubes = [];
  }

  _clearSiteMarkers(){
    this.siteMarkers.forEach(m => m.destroy && m.destroy());
    this.siteMarkers = [];
  }

  // ─── update ────────────────────────────────────────────────────────────────────────────────
  update(time, delta){
    const night = this.ambient ? this.ambient.update(time, delta) : false;
    this.weather && this.weather.update(time, delta);
    this.roads && this.roads.update(time, delta);
    this.districts.forEach(d => d.update && d.update(time, delta, night));
  }
}
