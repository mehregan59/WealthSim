class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.S = Math.max(0.85, Math.min(1.9, this.H / 720));
    this.PANEL = Math.round(Math.min(260, Math.max(190, this.W * 0.155)));
    this.cityName = (window.cityName && String(window.cityName).trim()) ||
      ((typeof currentLang!=='undefined'&&currentLang==='de') ? 'Meine Stadt' : 'My City');

    const groundY = this.s(352);
    this.groundY = groundY;
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x18351c,1); ground.fillRect(0,groundY,this.W,this.H-groundY);
    ground.fillStyle(0x122a15,1); ground.fillRect(0,groundY+this.s(10),this.W,this.s(14));

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
    this.roads = new RoadNetwork(this);

    this._buildDistricts();
    this._buildStats();

    this.cameras.main.setBackgroundColor('#0d1f12');

    this.tutorial.show('intro', () => {
      this._startLevel(1);
    });
  }

  // ─── helpers ──────────────────────────────────────────────────────────────
  s(n){ return Math.round(n * this.S); }
  de(){ return typeof currentLang!=='undefined' && currentLang==='de'; }

  _buildDistricts(){
    const W=this.W, H=this.H, s=n=>this.s(n);
    const groundY=this.groundY;
    const defs=[
      { id:'housing',   name:this.de()?'Wohnen':'Housing',    x:s(260), y:groundY-s(60),  color:0x4aaa5c, health:45 },
      { id:'transport', name:this.de()?'Verkehr':'Transport',  x:s(510), y:groundY-s(50),  color:0x4a9edb, health:45 },
      { id:'technology',name:this.de()?'Technik':'Technology', x:s(780), y:groundY-s(80),  color:0x9966cc, health:45 },
      { id:'energy',    name:this.de()?'Energie':'Energy',     x:s(1020),y:groundY-s(55),  color:0xe2a840, health:45 },
    ];
    this.districts = defs.map(d => new District(this, d));
    this.roads.init && this.roads.init(this.districts);
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

  // ─── level routing ────────────────────────────────────────────────────────
  _startLevel(n, isRetry){
    this.currentLevel = n;
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

  // ─── economy bridge ───────────────────────────────────────────────────────
  _econ(fn, ...args){
    if (!this.sim || !window.WS || !WS.Economy) return null;
    try { return WS.Economy[fn](this.sim, ...args); } catch(e) { console.error('[_econ]', fn, e); return null; }
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

  // ─── Chapter 1: contract ladder ───────────────────────────────────────────
  _level1(){
    this._ch1PairIdx = 0;
    this._ch1Choices = [];
    this._ch1ShowPair();
  }

  _ch1ShowPair(){
    const Ch = window.WS && WS.Chapters;
    const pairs = Ch ? WS.Chapters.CH1_PAIRS : [];
    if (this._ch1PairIdx >= pairs.length) {
      // All pairs done — route to district
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
      { icon: '🔒', label: 'Contract A', desc: fmtContract(pair.narrow) + '\nMore predictable outcomes.', value: 'narrow', color: 0x4aaa5c },
      { icon: '🎲', label: 'Contract B', desc: fmtContract(pair.wide)   + '\nHigher potential, higher variance.', value: 'wide',   color: 0x9966cc },
    ], (c) => {
      this._ch1Choices.push(c);
      if (typeof ScoringEngine !== 'undefined')
        ScoringEngine.recordDecision(1, c, { trialId: pair.trialId, pHigh: pair.pHigh, pairIdx: this._ch1PairIdx });
      this._ch1PairIdx++;
      const msg = c === 'wide'
        ? 'Contract B chosen — higher potential, higher variance.'
        : 'Contract A chosen — more stable outcomes.';
      this._updateStats(0, 3, 0);
      this._showConsequence(msg, () => this._ch1ShowPair(), { auto: true, autoDelay: 1400 });
    });
  }

  // ─── Chapter 2: setback ───────────────────────────────────────────────────
  _level2(){
    this._workersLeave();
    const techDistrict = this.districts.find(x => x.id === 'technology');
    if (techDistrict) techDistrict.takeDamage && techDistrict.takeDamage(28);
    this._l2event = this._econ('level2Start');
    this._updateStats(-5, -8, 0);
    // Collect forecast f1 before presenting the decision
    this._collectForecast('f1', () => {
      this.time.delayedCall(800, () => this._level2Decide(false));
    });
  }

  _level2Decide(hadResearch){
    const de = this.de();
    const opts = [
      { icon:'❌', label: de?'Abbrechen':'Cancel',       desc: de?'Projekt stoppen.':'Stop the project.',                               value:'cancel',       color:0xe74c3c },
      { icon:'⏸', label: de?'Abwarten':'Wait',          desc: de?'Weitere Infos abwarten.':'Wait for more information.',               value:'wait',         color:0xe2a840 },
      { icon:'▶', label: de?'Weitermachen':'Continue',  desc: de?'Trotzdem weiterführen.':'Continue despite the setback.',             value:'continue',     color:0x4aaa5c },
      { icon:'💰',label: de?'Mehr investieren':'Invest more', desc: de?'Mehr einsetzen.':'Commit additional resources.',               value:'invest_more',  color:0x9966cc },
    ];
    if (!hadResearch)
      opts.push({ icon:'🔍', label: de?'Untersuchen':'Investigate', desc: de?'Experten befragen.':'Consult experts before deciding.', value:'research',     color:0x5c8ab0 });

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
    // Visual: dim the tech district briefly
    const d = this.districts.find(x => x.id === 'technology');
    if (d && d.setStorm) d.setStorm(true);
    this.time.delayedCall(1200, () => { if (d && d.setStorm) d.setStorm(false); });
  }

  // ─── Chapter 3: allocation ────────────────────────────────────────────────
  _level3(){
    this.cubeTotal = 6; this.cubeDropped = 0;
    this._clearCubes();
    this._showPersistentMessage(
      this.de() ? '6 Würfel verteilen — dann auf OK klicken.' : 'Distribute 6 cubes across districts — then press OK.'
    );
    this._spawnCubes();
    this._buildWorldBtn(this.de() ? 'OK' : 'OK', () => {
      if (this.cubeDropped < this.cubeTotal) return;
      this._clearPersistentMessage();
      this._clearSiteMarkers();
      this._finishLevel3();
    });
    // Idle hint after 12 s
    this._level3IdleTimer = this.time.delayedCall(12000, () => {
      this._showPersistentMessage(
        this.de() ? 'Alle Würfel platzieren, dann OK drücken.' : 'Place all cubes, then press OK.'
      );
    });
  }

  _onResourceDropped(district){
    if (!district) return;
    this.cubeDropped++;
    if (typeof ScoringEngine !== 'undefined')
      ScoringEngine.recordDecision(3, district.id, { cubeIndex: this.cubeDropped, scenarioId:'ch3:allocate' });
    this._econ('level3Cube', district.id);
    district.receiveResource && district.receiveResource(1);
    this._updateStats(1, 3, 0);
    if (this.cubeDropped >= this.cubeTotal) this._worldBtnFlash && this._worldBtnFlash();
  }

  _finishLevel3(){
    const ec = this._econ('level3End');
    const counts = {};
    this.districts.forEach(d => { counts[d.id] = 0; });
    if (typeof ScoringEngine !== 'undefined') {
      ScoringEngine.decisions
        .filter(d => d.level === 3)
        .forEach(d => { if (counts[d.value] !== undefined) counts[d.value]++; });
    }
    const max = Math.max(...Object.values(counts));
    const topId = Object.keys(counts).find(k => counts[k] === max);
    const top = this.districts.find(x => x.id === topId);
    // Trigger one district shock: top district underperforms, another does well
    const shock = this.districts.find(x => x.id !== topId);
    if (shock && shock.celebrate) shock.celebrate();
    const msg = 'The ' + (top ? top.name : topId) + ' district received the most resources. ' +
      'Another district outperformed expectations.' + this._fundsLine(ec);
    this._showConsequence(msg, () => this._nextLevel());
  }

  _spawnCubes(){
    // Visual stubs — in production, draggable cubes spawn here
    for (let i = 0; i < this.cubeTotal; i++) {
      this.cubes.push(new ResourceCube(this, { index: i }));
    }
  }

  _clearCubes(){
    this.cubes.forEach(c => c.destroy && c.destroy());
    this.cubes = [];
  }

  // ─── Chapter 4: timing ────────────────────────────────────────────────────
  _level4(){
    const de = this.de();
    const urgentRepair = Math.random() < 0.4; // ~40% of sessions see the forced-repair variant
    if (urgentRepair) {
      // Forced-repair variant: liquidity choice must not reduce patience score
      this._showDecisionPanel([
        { icon:'🔧', label: de?'Reparatur':'Repair now',   desc: de?'Kritische Infrastruktur sofort reparieren.':'Repair critical infrastructure immediately — required.', value:'repair',      color:0xe74c3c, excludeFromPattern:true },
        { icon:'🎓', label: de?'Universität':'University', desc: de?'Langfristige Bildungsinvestition.':'Long-term education investment.', value:'university', color:0x4a9edb },
      ], (c) => {
        ScoringEngine && ScoringEngine.recordDecision(4, c, { scenarioId:'ch4:timing', variant:'repair', excludeFromPattern: c==='repair' });
        const ec = this._econ('level4', c);
        const msg = c === 'repair'
          ? (de ? 'Infrastruktur gesichert. Notwendige Ausgabe.' : 'Infrastructure secured. Necessary expenditure.')
          : (de ? 'Universität im Bau.' : 'University under construction.');
        if (c === 'university') this.hasUniversity = true;
        this._updateStats(c==='repair'?2:-2, c==='university'?5:0, 0);
        this._showConsequence(msg + this._yearLine(ec),
          () => this._collectForecast('f2', () => this._nextLevel()));
      });
      return;
    }
    this._showDecisionPanel([
      { icon:'🎉', label: de?'Festival':'Festival',    desc: de?'Sofortiger Glücklichkeitsschub.':'Immediate happiness boost for citizens.',              value:'festival',    color:0xe2a840 },
      { icon:'🎓', label: de?'Universität':'University', desc: de?'Langfristige Bildung und Einkommen.':'Long-term education and income increase.', value:'university', color:0x4a9edb },
    ], (c) => {
      ScoringEngine && ScoringEngine.recordDecision(4, c, { scenarioId:'ch4:timing', variant:'standard' });
      const ec = this._econ('level4', c);
      const msg = c === 'festival'
        ? (de ? 'Das Fest begeistert alle! Kurzzeitig erhöhte Zufriedenheit.' : 'The festival delights everyone! Brief happiness spike.')
        : (de ? 'Die Universität wird gebaut. Vorteile kommen in Jahren.' : 'The university is under construction. Benefits arrive in years.');
      if (c === 'university') this.hasUniversity = true;
      this._updateStats(c==='festival'?8:-2, c==='university'?5:2, 0);
      this._showConsequence(msg + this._yearLine(ec),
        () => this._collectForecast('f2', () => this._nextLevel()));
    });
  }

  // ─── Chapter 5: boom ──────────────────────────────────────────────────────
  _level5(){
    const de = this.de();
    this._showTicker('Innovation District +47% this quarter. Analysts see continued growth.');
    this._econ('level5Start');
    this._showDecisionPanel([
      { icon:'🚀', label: de?'Alles rein':'All in',        desc: de?'Gesamte Ressourcen in Technologie.':'Move all resources into technology.',   value:'all_in',      color:0xe74c3c },
      { icon:'➕', label: de?'Etwas mehr':'Invest more',   desc: de?'Etwas mehr hinzufügen.':'Add a moderate extra allocation.',                 value:'invest_more', color:0xe2a840 },
      { icon:'⚖', label: de?'Diversifiziert':'Stay div.',  desc: de?'Aktuelle Verteilung beibehalten.':'Keep existing allocation unchanged.',    value:'hold',        color:0x4aaa5c },
      { icon:'💵', label: de?'Gewinne nehmen':'Take profits', desc: de?'Technologie reduzieren, sichern.':'Reduce technology exposure, secure gains.', value:'reduce',   color:0x5c8ab0 },
      { icon:'🔍', label: de?'Recherchieren':'Research',   desc: de?'Mehr Informationen einholen.':'Seek more information before deciding.',      value:'research',    color:0x9966cc },
    ], (c) => {
      if (c === 'research') {
        ScoringEngine && ScoringEngine.recordDecision(5, 'research', { scenarioId:'ch5:boom', phase:'baseline' });
        this._showConsequence(
          'Analysts are split. Some cite fundamentals; others warn of momentum investing.',
          () => {
            this._showDecisionPanel([
              { icon:'🚀', label:'All in',     value:'all_in',      color:0xe74c3c },
              { icon:'➕', label:'Invest more', value:'invest_more', color:0xe2a840 },
              { icon:'⚖', label:'Stay div.',   value:'hold',        color:0x4aaa5c },
              { icon:'💵', label:'Take profits',value:'reduce',      color:0x5c8ab0 },
            ], (c2) => this._level5Commit(c2, true));
          }
        );
        return;
      }
      this._level5Commit(c, false);
    });
  }

  _level5Commit(c, hadResearch){
    const ec = this._econ('level5', c);
    const m = {
      all_in:      'All resources moved into technology.',
      invest_more: 'Additional resources allocated to technology.',
      hold:        'Allocation unchanged.',
      reduce:      'Technology exposure reduced; gains secured.',
    };
    ScoringEngine && ScoringEngine.recordDecision(5, c, {
      hadResearch,
      scenarioId: 'ch5:boom',
      phase: 'baseline',
      trialId: 'l5main',
    });
    if (c === 'all_in') {
      const tech = this.districts.find(x => x.id === 'technology');
      if (tech) { tech.receiveResource && tech.receiveResource(3); }
    }
    this._updateStats(c==='all_in'?-3:c==='reduce'?1:2, c==='all_in'?8:c==='hold'?2:4, 0);
    this._showConsequence((m[c] || m.hold) + this._yearLine(ec), () => this._nextLevel());
  }

  // ─── Chapter 6: outside offer ────────────────────────────────────────────
  _level6(){
    const de = this.de();
    this._showPersistentMessage(
      de ? 'Ein externer Berater unterbreitet ein Angebot.' : 'An external consultant makes an offer.'
    );
    this._showDecisionPanel([
      { icon:'✅', label: de?'Annehmen':'Accept',          desc: de?'Angebot annehmen.':'Accept the offer.',                     value:'accept',    color:0x4aaa5c },
      { icon:'🏗', label: de?'Selbst bauen':'Build own',   desc: de?'Selbst entwickeln.':'Develop independently.',               value:'build',     color:0xe2a840 },
      { icon:'❌', label: de?'Ablehnen':'Decline',         desc: de?'Ablehnen.':'Decline the offer.',                            value:'decline',   color:0xe74c3c },
      { icon:'🔍', label: de?'Untersuchen':'Investigate',  desc: de?'Mehr über das Angebot erfahren.':'Learn more about the offer.', value:'research',  color:0x5c8ab0 },
    ], (c) => {
      const hadResearch = false;
      if (c === 'research') {
        ScoringEngine && ScoringEngine.recordDecision(6, 'research_access', { scenarioId:'ch6:delegation', trialId:'l6main' });
        this._showConsequence(
          'Report: The offer depends on a third-party supplier with moderate reliability. Alternatives exist.',
          () => this._level6Decide(true)
        );
        return;
      }
      this._level6Decide(false, c);
    });
  }

  _level6Decide(hadResearch, preChoice){
    const de = this.de();
    if (!hadResearch && preChoice) {
      this._level6Commit(preChoice, false);
      return;
    }
    this._showDecisionPanel([
      { icon:'✅', label: de?'Annehmen':'Accept',        value:'accept',  color:0x4aaa5c },
      { icon:'🏗', label: de?'Selbst bauen':'Build own', value:'build',   color:0xe2a840 },
      { icon:'❌', label: de?'Ablehnen':'Decline',       value:'decline', color:0xe74c3c },
    ], (c) => this._level6Commit(c, hadResearch));
  }

  _level6Commit(c, hadResearch){
    const ec = this._econ('level6', c);
    ScoringEngine && ScoringEngine.recordDecision(6, c, {
      hadResearch,
      finalAction: c,
      scenarioId: 'ch6:delegation',
      trialId: 'l6main',
      phase: 'baseline',
    });
    const m = {
      accept:  'Offer accepted. Development proceeds via the consultant.',
      build:   'Independent development started. Slower but under full control.',
      decline: 'Offer declined. Resources retained.',
    };
    this._updateStats(c==='accept'?3:c==='build'?1:-1, c==='accept'?6:c==='build'?4:0, 0);
    this._clearPersistentMessage();
    this._showConsequence(
      (m[c] || m.decline) + this._yearLine(ec),
      () => this._collectForecast('f3', () => this._nextLevel())
    );
  }

  // ─── Chapter 7: headlines ────────────────────────────────────────────────
  _level7(){
    const de = this.de();
    this._showTicker(de
      ? 'Gerüchte: Technologiesektor könnte einbrechen. [Schlecht gestützt]'
      : 'Rumour: Tech sector may collapse. [Poorly supported]');
    this._econ('level7Start') || null;
    this._showDecisionPanel([
      { icon:'💰', label: de?'Alles verkaufen':'Sell all',        desc: de?'Alles liquidieren.':'Liquidate all holdings.',              value:'sell',          color:0xe74c3c },
      { icon:'📉', label: de?'Reduzieren':'Reduce',               desc: de?'Teilweise aussteigen.':'Reduce exposure partially.',         value:'reduce',        color:0xe2a840 },
      { icon:'⚖', label: de?'Halten':'Hold',                     desc: de?'Keine Änderung.':'No change in allocation.',                value:'hold',          color:0x4aaa5c },
      { icon:'📈', label: de?'Mehr investieren':'Invest more',    desc: de?'Bei günstigerem Kurs nachkaufen.':'Buy more at lower prices.', value:'invest_more', color:0x9966cc },
      { icon:'🔍', label: de?'Recherchieren':'Research',          desc: de?'Hintergrundinfos suchen.':'Seek background information.',    value:'research',      color:0x5c8ab0 },
    ], (c) => {
      if (c === 'research') {
        ScoringEngine && ScoringEngine.recordDecision(7, 'research', { scenarioId:'ch7:headlines', phase:'baseline' });
        this._showConsequence(
          'Credible update: The sector has genuine structural challenges, not just sentiment.',
          () => this._level7Decide(true)
        );
        return;
      }
      this._level7Decide(false, c);
    });
  }

  _level7Decide(hadResearch, preChoice){
    const de = this.de();
    if (!hadResearch && preChoice) { this._level7Commit(preChoice, false); return; }
    this._showDecisionPanel([
      { icon:'💰', label: de?'Alles verkaufen':'Sell all',        value:'sell',          color:0xe74c3c },
      { icon:'📉', label: de?'Reduzieren':'Reduce',               value:'reduce',        color:0xe2a840 },
      { icon:'⚖', label: de?'Halten':'Hold',                     value:'hold',          color:0x4aaa5c },
      { icon:'📈', label: de?'Mehr investieren':'Invest more',    value:'invest_more',   color:0x9966cc },
    ], (c) => this._level7Commit(c, hadResearch));
  }

  _level7Commit(c, hadResearch){
    const ec = this._econ('level7', c);
    ScoringEngine && ScoringEngine.recordDecision(7, c, {
      hadResearch,
      finalAction: c,
      scenarioId: 'ch7:headlines',
      trialId: 'l7main',
      phase: 'baseline',
    });
    const m = {
      sell:        'All holdings liquidated.',
      reduce:      'Exposure reduced.',
      hold:        'Allocation unchanged.',
      invest_more: 'Additional resources invested.',
    };
    const dh = c==='sell'?-4:c==='invest_more'?3:1;
    const dd = c==='invest_more'?6:c==='reduce'?-2:c==='sell'?-5:0;
    this._updateStats(dh, dd, 0);
    this._showConsequence(
      (m[c] || m.hold) + this._yearLine(ec),
      () => this._collectForecast('f4', () => this._nextLevel())
    );
  }

  // ─── Chapter 8: storm ────────────────────────────────────────────────────
  _level8(){
    const de = this.de();
    this._econ('level8Storm');
    this.districts.forEach(d => d.setStorm && d.setStorm(true));
    this.weather.startStorm(() => {
      this._showDecisionPanel([
        { icon:'💸', label: de?'Alles verkaufen':'Sell all',       desc: de?'Alles liquidieren.':'Liquidate all holdings.',           value:'sell_all',    color:0xe74c3c },
        { icon:'🛡', label: de?'Wesentl. schützen':'Protect ess.', desc: de?'Kern schützen.':'Protect essential services only.',       value:'protect',     color:0xe2a840 },
        { icon:'⚖', label: de?'Umschichten':'Rebalance',          desc: de?'Portfolio neu ausrichten.':'Rebalance the portfolio.',     value:'rebalance',   color:0x4aaa5c },
        { icon:'▶', label: de?'Weitermachen':'Continue',          desc: de?'Plan beibehalten.':'Stay the course.',                    value:'hold',        color:0x5c8ab0 },
        { icon:'📈', label: de?'Günstig kaufen':'Buy low',        desc: de?'Günstig nachkaufen.':'Invest while prices are lower.',    value:'invest_low',  color:0x9966cc },
      ], (c) => {
        const ec = this._econ('level8', c);
        ScoringEngine && ScoringEngine.recordDecision(8, c, {
          scenarioId: 'ch8:storm',
          trialId: 'l8main',
          phase: 'baseline',
        });
        const m = {
          sell_all:   'Everything sold. Resources secured but growth potential reduced.',
          protect:    'Essential services protected. Selective holdings maintained.',
          rebalance:  'Portfolio rebalanced across districts.',
          hold:       'Plan maintained through the storm.',
          invest_low: 'Additional investments made at lower prices.',
        };
        this.weather.startRecovery(() => {
          this.districts.forEach(d => { d.setStorm && d.setStorm(false); if(d.celebrate) d.celebrate(); });
          if (c !== 'sell_all' && this.hasUniversity) this._econ('level8University');
          this._updateStats(
            c==='sell_all'?-5:c==='hold'?3:c==='invest_low'?4:1,
            c==='invest_low'?8:c==='rebalance'?4:c==='hold'?3:c==='protect'?1:-3,
            0
          );
        });
        this._showConsequence(
          (m[c] || m.hold) + this._yearLine(ec),
          () => this._collectForecast('f4', () => this._nextLevel())
        );
      });
    });
  }

  // ─── Chapter 9: project review ───────────────────────────────────────────
  _level9(){
    const Ch = window.WS && WS.Chapters;
    if (!Ch) { this._nextLevel(); return; }
    this._ch9Trials = WS.Chapters.ch9Trials(this.seed);
    this._ch9TrialIdx = 0;
    this.time.delayedCall(1200, () => this._ch9ShowTrial());
  }

  _ch9ShowTrial(){
    const de = this.de();
    if (this._ch9TrialIdx >= this._ch9Trials.length) { this._ch9Finish(); return; }
    const trial = this._ch9Trials[this._ch9TrialIdx];
    const opts = trial.projects.map(p => {
      const gain = p.current - p.purchase;
      const sign = gain >= 0 ? '+' : '';
      const gainStr = sign + gain + ' cr. from purchase';
      const fwd = 'Forward outlook: ' + (p.forwardPct > 0 ? '+' : '') + Math.round(p.forwardPct * 100) + '%';
      return {
        icon: gain >= 0 ? '📈' : '📉',
        label: p.name,
        desc: gainStr + '\nCurrent: ' + p.current + ' cr.\n' + fwd,
        value: p.id,
        color: gain >= 0 ? 0xe2a840 : 0x5c8ab0,
      };
    });
    this._showDecisionPanel(opts, (soldId) => {
      const ev = WS.Chapters.resolveCh9(trial, soldId);
      ScoringEngine && ScoringEngine.recordDecision(9, ev.action, {
        trialId: trial.trialId,
        scenarioId: ev.scenarioId,
        soldId,
        keptId: ev.keptId,
        phase: 'baseline',
      });
      const soldP = trial.projects.find(x => x.id === soldId);
      const consequence = 'You sold ' + (soldP ? soldP.name : soldId) + '. ' +
        (ev.action === 'sell_winner' ? 'The gain was realised.' :
         ev.action === 'sell_loser'  ? 'The loss was crystallised.' :
         ev.action === 'sell_stronger' ? 'You chose the project with better forward prospects.' :
         'You chose the project with weaker forward prospects.');
      this._ch9TrialIdx++;
      if (this._ch9TrialIdx < this._ch9Trials.length) {
        this._showConsequence(consequence, () => this._ch9ShowTrial(), { auto: true, autoDelay: 1600 });
      } else {
        this._showConsequence(consequence, () => this._ch9Finish());
      }
    });
  }

  _ch9Finish(){
    const de = this.de();
    const decisions = typeof ScoringEngine !== 'undefined'
      ? ScoringEngine.decisions.filter(d => d.level === 9) : [];
    const winners = decisions.filter(d => d.value === 'sell_winner').length;
    const losers  = decisions.filter(d => d.value === 'sell_loser').length;
    const msg = de
      ? `Projekt-Überprüfung abgeschlossen. Gewinner verkauft: ${winners}. Verlierer verkauft: ${losers}.`
      : `Project review complete. Winners sold: ${winners}. Losers sold: ${losers}.`;
    this._showConsequence(msg, () => this._nextLevel());
  }

  // ─── Chapter 10: forecasts & practice ────────────────────────────────────
  _level10(){
    const de = this.de();
    const forecasts = this._forecastEvents;
    const resolved  = forecasts.filter(f => typeof f.outcome === 'number');
    const brier = resolved.length > 0
      ? resolved.reduce((s, f) => s + Math.pow((f.p || 0.5) - f.outcome, 2), 0) / resolved.length
      : null;
    const brierStr = brier !== null
      ? (de ? 'Vorhersage-Genauigkeit (Brier): ' : 'Forecast accuracy (Brier): ') +
        brier.toFixed(3) + ' (' + (de ? 'niedriger = besser' : 'lower = better') + ')'
      : (de ? 'Keine aufgelösten Vorhersagen.' : 'No resolved forecasts.');
    const forecastLines = forecasts.map((f, i) =>
      'Forecast ' + (i + 1) + ': ' + Math.round((f.p || 0.5) * 100) + '% probability assigned.'
    ).join('\n');
    this._showConsequence(
      (de ? 'Kapitel 10: Deine Vorhersagen\n' : 'Chapter 10: Your Forecasts\n') +
      (forecastLines || (de ? '(Keine Vorhersagen gesammelt)' : '(No forecasts collected)')) +
      '\n\n' + brierStr,
      () => this._level10Practice()
    );
  }

  _level10Practice(){
    const de = this.de();
    const Ch = window.WS && WS.Chapters;
    // Determine which practice to offer based on session observations
    const decisions = typeof ScoringEngine !== 'undefined' ? ScoringEngine.decisions : [];
    const ch1Choices = decisions.filter(d => d.level === 1 && (d.value==='narrow'||d.value==='wide'));
    // Default to contract practice; allocation if ch3 was concentrated
    const ch3Cubes = decisions.filter(d => d.level === 3);
    const ch3Concentrated = ch3Cubes.length >= 4 &&
      ch3Cubes.filter(d => d.value === ch3Cubes[0].value).length >= 5;
    if (ch3Concentrated) {
      // Allocation practice
      this._showDecisionPanel([
        { icon:'🏠', label: de?'Wohnen':'Housing',     value:'housing',    color:0x4aaa5c },
        { icon:'🚌', label: de?'Verkehr':'Transport',  value:'transport',  color:0x4a9edb },
        { icon:'💡', label: de?'Technik':'Technology', value:'technology', color:0x9966cc },
        { icon:'⚡', label: de?'Energie':'Energy',     value:'energy',     color:0xe2a840 },
      ], (distId) => {
        ScoringEngine && ScoringEngine.recordDecision('practice', distId, {
          kind: 'allocation',
          scenarioId: 'ch3:allocate',
          phase: 'practice',
          trialId: 'practice-alloc',
        });
        this._showConsequence(
          (de ? 'Praxis-Entscheidung erfasst. Kein Einfluss auf dein Profil.' :
                'Practice decision recorded. Not included in your session profile.'),
          () => this._finish()
        );
      });
    } else {
      // Contract practice — pair2 (50/50)
      const pairSpec = (Ch && WS.Chapters.CH1_PAIRS && WS.Chapters.CH1_PAIRS[1]) || { pHigh: 0.5 };
      this._showDecisionPanel([
        { icon:'🔒', label: 'Contract A', desc: '50% chance of 100 cr. / 50% chance of 100 cr.',  value:'narrow', color:0x4aaa5c },
        { icon:'🎲', label: 'Contract B', desc: '50% chance of 150 cr. / 50% chance of 50 cr.',   value:'wide',   color:0x9966cc },
      ], (c) => {
        ScoringEngine && ScoringEngine.recordDecision('practice', c, {
          kind: 'contract',
          scenarioId: 'ch1:pair',
          phase: 'practice',
          trialId: 'pair2',
        });
        this._showConsequence(
          (de ? 'Praxis-Entscheidung erfasst. Kein Einfluss auf dein Profil.' :
                'Practice decision recorded. Not included in your session profile.'),
          () => this._finish()
        );
      });
    }
  }

  // ─── Forecast collection ─────────────────────────────────────────────────
  _collectForecast(forecastId, cb){
    const Ch = window.WS && WS.Chapters;
    if (!Ch || !WS.Chapters.FORECASTS) { if (cb) cb(); return; }
    const fspec = WS.Chapters.FORECASTS.find(f => f.id === forecastId);
    if (!fspec) { if (cb) cb(); return; }
    const de = this.de();
    const question = de ? fspec.questionDe : fspec.questionEn;
    this._showDecisionPanel([
      { icon:'📉', label:'10%', value:0.1, color:0xe74c3c },
      { icon:'📊', label:'30%', value:0.3, color:0xe2a840 },
      { icon:'🔀', label:'50%', value:0.5, color:0x5c8ab0 },
      { icon:'📈', label:'70%', value:0.7, color:0x4aaa5c },
      { icon:'🚀', label:'90%', value:0.9, color:0x4ecdc4 },
    ], (p) => {
      const ev = WS.Chapters.forecastEvent(fspec, p, null);
      ev.forecastId = forecastId;
      this._forecastEvents.push(ev);
      ScoringEngine && ScoringEngine.recordDecision('forecast', p, { forecastId, modelP: fspec.modelP });
      if (cb) cb();
    });
  }

  // ─── Finish & handoff ────────────────────────────────────────────────────
  _finish(){
    this._clearConsequence(); this._clearWorldBtn();
    this.statsPanel.recordSnapshot(
      this.cityStats.happiness, this.cityStats.development,
      this.cityStats.resources, this.currentLevel);
    if (this.sim) this.statsPanel.setFundsCredits(this.sim.total());
    this.cameras.main.fade(1200, 0, 0, 0, false, (cam, progress) => {
      if (progress >= 1) this._toProfile();
    });
  }

  _toProfile(){
    const profile = (window.WS && WS.Summary && WS.Adapter)
      ? WS.Summary.build(WS.Adapter.toEvents(ScoringEngine.decisions), {}, { lang: this.de()?'de':'en' })
      : {};
    this.scene.start('ProfileScene', {
      profile,
      simTotal: this.sim ? this.sim.total() : null,
      seed: this.seed,
      forecastBrier: (() => {
        const resolved = this._forecastEvents.filter(f => typeof f.outcome === 'number');
        if (!resolved.length) return null;
        return resolved.reduce((s,f) => s + Math.pow((f.p||0.5) - f.outcome, 2), 0) / resolved.length;
      })(),
    });
  }

  // ─── UI helpers ──────────────────────────────────────────────────────────
  _showDecisionPanel(opts, cb){
    this._clearDecisionPanel();
    const de = this.de();
    const panelW = this.PANEL;
    const panelH = opts.length * this.s(70) + this.s(20);
    const x = this.s(16), y = (this.H - panelH) / 2;
    const bg = this.add.graphics().setDepth(20);
    bg.fillStyle(0x1a2e20, 0.97); bg.fillRoundedRect(x, y, panelW, panelH, this.s(10));
    bg.lineStyle(1.5, 0x4aaa5c, 0.5); bg.strokeRoundedRect(x, y, panelW, panelH, this.s(10));
    const buttons = opts.map((opt, i) => {
      const by = y + this.s(10) + i * this.s(70);
      const btn = this.add.graphics().setDepth(21).setInteractive(
        new Phaser.Geom.Rectangle(x, by, panelW, this.s(64)), Phaser.Geom.Rectangle.Contains
      );
      btn.fillStyle(opt.color || 0x2a6e3c, 0.9); btn.fillRoundedRect(x+2, by+2, panelW-4, this.s(60), this.s(6));
      this.add.text(x + this.s(8), by + this.s(8), (opt.icon||'') + ' ' + opt.label, {
        fontSize: this.s(14)+'px', color:'#fff', fontFamily:'Arial', fontStyle:'bold',
      }).setDepth(22);
      if (opt.desc) this.add.text(x + this.s(8), by + this.s(28), opt.desc, {
        fontSize: this.s(11)+'px', color:'#ccc', fontFamily:'Arial', wordWrap:{ width: panelW - this.s(16) },
      }).setDepth(22);
      btn.on('pointerup', () => {
        this._clearDecisionPanel();
        cb(opt.value);
      });
      btn.on('pointerover', () => { btn.clear(); btn.fillStyle(0xffffff,0.15); btn.fillRoundedRect(x+2,by+2,panelW-4,this.s(60),this.s(6)); });
      btn.on('pointerout',  () => { btn.clear(); btn.fillStyle(opt.color||0x2a6e3c,0.9); btn.fillRoundedRect(x+2,by+2,panelW-4,this.s(60),this.s(6)); });
      return btn;
    });
    this.decisionPanel = { bg, buttons, objects: [bg, ...buttons] };
    if (!this._panelIntroShown) {
      this._panelIntroShown = true;
      this.statsPanel.introHighlight && this.statsPanel.introHighlight(() => {});
    }
  }

  _clearDecisionPanel(){
    if (!this.decisionPanel) return;
    this.decisionPanel.objects.forEach(o => o && o.destroy && o.destroy());
    this.decisionPanel = null;
  }

  _showConsequence(text, cont, opts){
    this._clearConsequence();
    const auto = opts && opts.auto;
    const delay = (opts && opts.autoDelay) || 2000;
    const panelW = this.W - this.PANEL - this.s(32);
    const x = this.PANEL + this.s(16);
    const bg = this.add.graphics().setDepth(15);
    bg.fillStyle(0x111d14, 0.93); bg.fillRoundedRect(x, this.s(460), panelW, this.s(200), this.s(10));
    const lines = text.split('\n');
    const textObjs = lines.map((line, i) =>
      this.add.text(x + this.s(16), this.s(478) + i * this.s(26), line, {
        fontSize: this.s(14) + 'px', color: '#d4f0d4', fontFamily: 'Arial',
        wordWrap: { width: panelW - this.s(32) },
      }).setDepth(16)
    );
    const objects = [bg, ...textObjs];
    if (!auto) {
      const btn = this.add.text(x + panelW - this.s(80), this.s(630),
        this.de() ? '▶ Weiter' : '▶ Next', {
          fontSize: this.s(14)+'px', color:'#6af0a0', fontFamily:'Arial',
          backgroundColor: '#1a4e2a', padding:{ x:this.s(8), y:this.s(4) },
        }).setDepth(17).setInteractive().on('pointerup', () => {
          this._clearConsequence();
          if (cont) cont();
        });
      objects.push(btn);
    } else {
      this.time.delayedCall(delay, () => { this._clearConsequence(); if (cont) cont(); });
    }
    this.consequencePanel = { objects };
  }

  _clearConsequence(){
    if (!this.consequencePanel) return;
    this.consequencePanel.objects.forEach(o => o && o.destroy && o.destroy());
    this.consequencePanel = null;
  }

  _buildWorldBtn(label, cb){
    this._clearWorldBtn();
    const x = this.W - this.s(130), y = this.H - this.s(70);
    const btn = this.add.text(x, y, label, {
      fontSize: this.s(18) + 'px', color:'#fff', fontFamily:'Arial', fontStyle:'bold',
      backgroundColor:'#2a6e3c', padding:{ x:this.s(12), y:this.s(8) },
    }).setDepth(18).setInteractive().on('pointerup', () => cb && cb());
    this.worldBtn = { btn };
  }

  _worldBtnFlash(){
    if (!this.worldBtn) return;
    this.tweens.add({ targets: this.worldBtn.btn, alpha: { from:1, to:0.5 }, yoyo:true, repeat:2, duration:180 });
  }

  _clearWorldBtn(){
    if (!this.worldBtn) return;
    if (this.worldBtnTimer) { this.worldBtnTimer.remove && this.worldBtnTimer.remove(); this.worldBtnTimer = null; }
    this.worldBtn.btn && this.worldBtn.btn.destroy && this.worldBtn.btn.destroy();
    this.worldBtn = null;
  }

  _showPersistentMessage(text){
    this._clearPersistentMessage();
    this.persistentMsg = this.add.text(this.PANEL + this.s(16), this.s(16), text, {
      fontSize: this.s(13) + 'px', color:'#a0d0a0', fontFamily:'Arial',
      wordWrap:{ width: this.W - this.PANEL - this.s(32) },
    }).setDepth(14);
  }

  _clearPersistentMessage(){
    if (!this.persistentMsg) return;
    this.persistentMsg.destroy && this.persistentMsg.destroy();
    this.persistentMsg = null;
  }

  _clearSiteMarkers(){
    this.siteMarkers.forEach(m => m && m.destroy && m.destroy());
    this.siteMarkers = [];
  }

  _clearLevel3Idle(){
    if (this._level3IdleTimer) {
      this._level3IdleTimer.remove && this._level3IdleTimer.remove();
      this._level3IdleTimer = null;
    }
  }

  _showTicker(msg){
    if (this.tickerActive) return;
    this.tickerActive = true;
    const x = this.W / 2 - this.s(200);
    const ticker = this.add.text(x, this.s(12), '📰 ' + msg, {
      fontSize: this.s(13)+'px', color:'#ffe980', fontFamily:'Arial',
      backgroundColor:'#1a2e20', padding:{ x:this.s(8), y:this.s(4) },
    }).setDepth(25);
    this.time.delayedCall(5000, () => {
      ticker.destroy && ticker.destroy();
      this.tickerActive = false;
    });
  }

  _reportModal(title, body, cb){
    const bg = this.add.graphics().setDepth(30);
    const rw = this.s(480), rh = this.s(320);
    const rx = (this.W - rw) / 2, ry = (this.H - rh) / 2;
    bg.fillStyle(0x111d14, 0.98); bg.fillRoundedRect(rx, ry, rw, rh, this.s(12));
    bg.lineStyle(1.5, 0x4aaa5c, 0.6); bg.strokeRoundedRect(rx, ry, rw, rh, this.s(12));
    this.add.text(rx + this.s(16), ry + this.s(16), title, {
      fontSize: this.s(16)+'px', color:'#6af0a0', fontFamily:'Arial', fontStyle:'bold',
    }).setDepth(31);
    this.add.text(rx + this.s(16), ry + this.s(50), body, {
      fontSize: this.s(13)+'px', color:'#d4f0d4', fontFamily:'Arial', wordWrap:{ width: rw - this.s(32) },
    }).setDepth(31);
    const closeBtn = this.add.text(rx + rw - this.s(90), ry + rh - this.s(40),
      this.de() ? '✕ Schließen' : '✕ Close', {
        fontSize: this.s(13)+'px', color:'#6af0a0', fontFamily:'Arial',
        backgroundColor:'#1a4e2a', padding:{ x:this.s(8), y:this.s(4) },
      }).setDepth(31).setInteractive().on('pointerup', () => {
        bg.destroy(); closeBtn.destroy();
        if (cb) cb();
      });
  }

  update(time, delta){
    if (this.ambient) this.ambient.update(time, delta);
    if (this.weather) this.weather.update && this.weather.update(time, delta);
    if (this.roads)   this.roads.update && this.roads.update(time, delta);
    const night = this.ambient ? this.ambient.isNightTime() : false;
    this.districts.forEach(d => d.update && d.update(time, delta, night));
  }
}
