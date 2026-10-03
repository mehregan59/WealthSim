class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.currentLevel = 1;
    this.score = { happiness: 50, development: 50, resources: 100, year: 2024 };
    this._decisions = [];
    this._persistent = [];
    this._panel = null;
    this._panelOpen = false;
    this._levelStarted = false;

    // Read lang
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
    const de = lang === 'de';

    this._buildCity();
    this._buildHUD();
    this._startTutorial();
  }

  _buildCity() {
    this._districts = [];
    const configs = [
      { id:'housing',  name:'Housing',   nameDE:'Wohnviertel',  x:0.22, y:0.42, color:0x5c8a5c },
      { id:'finance',  name:'Finance',   nameDE:'Finanzen',     x:0.50, y:0.35, color:0x4a7a9b },
      { id:'industry', name:'Industry',  nameDE:'Industrie',    x:0.78, y:0.42, color:0x8a6a4a },
      { id:'park',     name:'Park',      nameDE:'Park',         x:0.35, y:0.65, color:0x3a8a3a },
      { id:'port',     name:'Port',      nameDE:'Hafen',        x:0.65, y:0.65, color:0x3a6a8a },
    ];
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    configs.forEach(cfg => {
      const d = new District(this, {
        id: cfg.id,
        name: de ? cfg.nameDE : cfg.name,
        x: cfg.x * this.W,
        y: cfg.y * this.H,
        color: cfg.color,
        health: 50
      });
      this._districts.push(d);
    });
  }

  _buildHUD() {
    this.hud = new HUD(this);
    this.hud.setLevel(1, this._levelName());
    this.hud.update(this.score);
  }

  _startTutorial() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    if (window.Tutorial) {
      this._tutorial = new Tutorial(this, de);
      this._tutorial.onDone(() => this._startLevel(1));
      this._tutorial.start();
    } else {
      this._startLevel(1);
    }
  }

  _startLevel(n) {
    this.currentLevel = n;
    this._levelStarted = true;
    const titleAlreadyShown = false;
    this.hud.setLevel(n,this._levelName(n));
      if(!titleAlreadyShown)this.hud.showLevelTitle(n,this._levelName(n));
    this[`_level${n}`] && this[`_level${n}`]();
  }

  _levelName(){const lvl=this.currentLevel;const tr=typeof TRANSLATIONS!=='undefined'&&TRANSLATIONS[typeof currentLang!=='undefined'?currentLang:'en'];return (tr&&tr.levels&&tr.levels[lvl-1]&&tr.levels[lvl-1].title)||{1:'The First Opportunity',2:'The Unexpected Setback',3:'The Regulatory Shift',4:'Community Investment',5:'The Boom',6:'The New Competitor',7:'Market Turbulence',8:'The Crash',9:'The Recovery',10:'The Harvest'}[lvl]||'Level '+lvl}

  _tr(levelIdx, field, fallback) {
    try {
      const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
      const tr = typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS[lang] : null;
      if (tr && tr.levels && tr.levels[levelIdx]) {
        return tr.levels[levelIdx][field] || fallback;
      }
    } catch(e) {}
    return fallback;
  }

  _trOpt(levelIdx, optIdx, field, fallback) {
    try {
      const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
      const tr = typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS[lang] : null;
      if (tr && tr.levels && tr.levels[levelIdx] && tr.levels[levelIdx].options) {
        return tr.levels[levelIdx].options[optIdx][field] || fallback;
      }
    } catch(e) {}
    return fallback;
  }

  // ── Levels ────────────────────────────────────────────────────────────

  _level1() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(0, 'story', de
      ? 'Deine Stadt braucht frisches Kapital. Wie investierst du?'
      : 'Your city needs fresh capital. How do you invest?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'🏦', label: this._trOpt(0,0,'label', de?'Sicher & Stabil':'Safe & Stable'),    desc: this._trOpt(0,0,'description', de?'Niedrigere Renditen, stabiles Wachstum.':'Lower returns, stable growth.'),    value:'safe',           color:0x4a9b4a },
        { icon:'⚖️', label: this._trOpt(0,1,'label', de?'Ausgewogen':'Balanced'),              desc: this._trOpt(0,1,'description', de?'Mittleres Risiko, mittlere Rendite.':'Medium risk, medium return.'),          value:'balanced',       color:0x4a7a9b },
        { icon:'🚀', label: this._trOpt(0,2,'label', de?'Wachstum':'Growth'),                  desc: this._trOpt(0,2,'description', de?'Höheres Risiko, höheres Potenzial.':'Higher risk, higher potential.'),       value:'growth',         color:0x9b4a4a },
        { icon:'🏗️', label: this._trOpt(0,3,'label', de?'Infrastruktur':'Infrastructure'),     desc: this._trOpt(0,3,'description', de?'Investition in die Stadt selbst.':'Invest in the city itself.'),            value:'infrastructure',  color:0x8a6a2a },
      ], (choice) => {
        this._decisions.push({ level:1, choice });
        const effects = {
          safe:          { happiness:+5,  development:+3,  resources:-10 },
          balanced:      { happiness:+8,  development:+8,  resources:-15 },
          growth:        { happiness:+3,  development:+15, resources:-20 },
          infrastructure:{ happiness:+12, development:+5,  resources:-12 },
        };
        this._applyEffects(effects[choice] || {});
        this._startLevel(2);
      });
    });
  }

  _level2() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(1, 'story', de
      ? 'Ein unerwarteter Rückschlag erschüttert den Markt. Was tust du?'
      : 'An unexpected setback shakes the market. What do you do?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'❌', label: this._trOpt(1,0,'label', de?'Stopp-Loss':'Cancel'),   desc: this._trOpt(1,0,'description', de?'Verluste begrenzen.':'Limit losses.'),              value:'cancel',     color:0x9b4a4a },
        { icon:'⏳', label: this._trOpt(1,1,'label', de?'Abwarten':'Wait'),       desc: this._trOpt(1,1,'description', de?'Den Sturm aussitzen.':'Wait out the storm.'),       value:'push',       color:0x4a7a9b },
        { icon:'💰', label: this._trOpt(1,2,'label', de?'Mehr investieren':'Invest More'), desc: this._trOpt(1,2,'description', de?'Günstiger Einstieg.':'Buy the dip.'),         value:'invest_more', color:0x4a9b4a },
        { icon:'⏸️', label: this._trOpt(1,3,'label', de?'Pausieren':'Pause'),      desc: this._trOpt(1,3,'description', de?'Strategie überdenken.':'Rethink strategy.'),      value:'pause',      color:0x8a8a4a },
      ], (choice) => {
        this._decisions.push({ level:2, choice });
        const effects = {
          cancel:      { happiness:-5,  development:-5,  resources:+10 },
          push:        { happiness:+2,  development:+2,  resources:-5  },
          invest_more: { happiness:+5,  development:+10, resources:-20 },
          pause:       { happiness:0,   development:0,   resources:0   },
        };
        this._applyEffects(effects[choice] || {});
        this._startLevel(3);
      });
    });
  }

  _level3() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(2, 'story', de
      ? 'Neue Vorschriften treffen deine Branche. Wie reagierst du?'
      : 'New regulations hit your sector. How do you respond?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'✅', label: this._trOpt(2,0,'label', de?'Einhalten':'Comply'),         desc: this._trOpt(2,0,'description', de?'Regelkonform bleiben.':'Stay compliant.'),           value:'confirm',    color:0x4a9b4a },
        { icon:'🏗️', label: this._trOpt(2,1,'label', de?'Anpassen':'Adapt'),           desc: this._trOpt(2,1,'description', de?'Geschäftsmodell anpassen.':'Adapt business model.'),  value:'adapt',      color:0x4a7a9b },
        { icon:'⚖️', label: this._trOpt(2,2,'label', de?'Anfechten':'Challenge'),      desc: this._trOpt(2,2,'description', de?'Rechtlichen Weg gehen.':'Take legal route.'),        value:'challenge',  color:0x9b8a4a },
        { icon:'🚪', label: this._trOpt(2,3,'label', de?'Aussteigen':'Exit'),           desc: this._trOpt(2,3,'description', de?'Aus diesem Sektor aussteigen.':'Exit this sector.'), value:'exit',       color:0x9b4a4a },
      ], (choice) => {
        this._decisions.push({ level:3, choice });
        const effects = {
          confirm:   { happiness:+5,  development:+3,  resources:-8  },
          adapt:     { happiness:+8,  development:+8,  resources:-15 },
          challenge: { happiness:-3,  development:+5,  resources:-12 },
          exit:      { happiness:-5,  development:-8,  resources:+15 },
        };
        this._applyEffects(effects[choice] || {});
        this._startLevel(4);
      });
    });
  }

  _level4() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(3, 'story', de
      ? 'Die Gemeinschaft braucht Unterstützung. Wo investierst du?'
      : 'The community needs support. Where do you invest?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'🎪', label: this._trOpt(3,0,'label', de?'Festival':'Festival'),         desc: this._trOpt(3,0,'description', de?'Kulturelles Event für alle.':'Cultural event for all.'),       value:'festival',    color:0x9b6a4a },
        { icon:'🎓', label: this._trOpt(3,1,'label', de?'Universität':'University'),    desc: this._trOpt(3,1,'description', de?'Langfristige Bildung.':'Long-term education.'),            value:'university',  color:0x4a7a9b },
        { icon:'🏥', label: this._trOpt(3,2,'label', de?'Gesundheit':'Health'),         desc: this._trOpt(3,2,'description', de?'Medizinische Einrichtungen.':'Medical facilities.'),        value:'health',      color:0x4a9b6a },
        { icon:'🌿', label: this._trOpt(3,3,'label', de?'Natur':'Nature'),              desc: this._trOpt(3,3,'description', de?'Grünflächen und Parks.':'Green spaces and parks.'),         value:'nature',      color:0x3a8a3a },
      ], (choice) => {
        this._decisions.push({ level:4, choice });
        const effects = {
          festival:   { happiness:+15, development:+2,  resources:-10 },
          university: { happiness:+5,  development:+15, resources:-18 },
          health:     { happiness:+12, development:+5,  resources:-14 },
          nature:     { happiness:+10, development:+3,  resources:-8  },
        };
        this._applyEffects(effects[choice] || {});
        this._startLevel(5);
      });
    });
  }

  _level5() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(4, 'story', de
      ? 'Ein Boom! Märkte explodieren. Was ist deine Strategie?'
      : 'A boom! Markets are surging. What\'s your strategy?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'💎', label: this._trOpt(4,0,'label', de?'Alles rein':'All-in'),          desc: this._trOpt(4,0,'description', de?'Maximales Risiko, maximale Chance.':'Maximum risk, maximum reward.'),  value:'allin',        color:0x9b4a4a },
        { icon:'📈', label: this._trOpt(4,1,'label', de?'Mehr investieren':'Invest More'),desc: this._trOpt(4,1,'description', de?'Moderates Wachstum.':'Moderate growth.'),                              value:'invest_more',  color:0x4a9b4a },
        { icon:'⚖️', label: this._trOpt(4,2,'label', de?'Diversifizieren':'Diversify'),  desc: this._trOpt(4,2,'description', de?'Risiko streuen.':'Spread the risk.'),                                   value:'diversify',    color:0x4a7a9b },
        { icon:'💰', label: this._trOpt(4,3,'label', de?'Gewinne mitnehmen':'Take Profits'),desc: this._trOpt(4,3,'description', de?'Jetzt Gewinne realisieren.':'Lock in gains now.'),                  value:'take_profits', color:0x8a8a4a },
      ], (choice) => {
        this._decisions.push({ level:5, choice });
        const effects = {
          allin:        { happiness:+5,  development:+20, resources:-25 },
          invest_more:  { happiness:+8,  development:+12, resources:-18 },
          diversify:    { happiness:+10, development:+8,  resources:-12 },
          take_profits: { happiness:+12, development:+3,  resources:+15 },
        };
        this._applyEffects(effects[choice] || {});
        this._startLevel(6);
      });
    });
  }

  _level6() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(5, 'story', de
      ? 'Ein Wettbewerber betritt den Markt. Wie reagierst du?'
      : 'A competitor enters the market. How do you respond?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'🤝', label: this._trOpt(5,0,'label', de?'Akzeptieren':'Accept'),          desc: this._trOpt(5,0,'description', de?'Marktbegleiter willkommen heißen.':'Welcome the market companion.'), value:'accept',     color:0x4a9b4a },
        { icon:'🏗️', label: this._trOpt(5,1,'label', de?'Eigenes bauen':'Build Own'),    desc: this._trOpt(5,1,'description', de?'Eigene Alternative entwickeln.':'Develop own alternative.'),     value:'build_own',  color:0x4a7a9b },
        { icon:'❌', label: this._trOpt(5,2,'label', de?'Ablehnen':'Decline'),            desc: this._trOpt(5,2,'description', de?'Marktanteile schützen.':'Protect market share.'),                 value:'decline',    color:0x9b4a4a },
        { icon:'🔍', label: this._trOpt(5,3,'label', de?'Analysieren':'Research'),        desc: this._trOpt(5,3,'description', de?'Daten sammeln, bevor man handelt.':'Gather data before acting.'), value:'research',   color:0x8a6a4a },
      ], (choice) => {
        this._decisions.push({ level:6, choice });
        const effects = {
          accept:    { happiness:+8,  development:+5,  resources:-5  },
          build_own: { happiness:+5,  development:+12, resources:-20 },
          decline:   { happiness:-3,  development:+3,  resources:+5  },
          research:  { happiness:+3,  development:+8,  resources:-8  },
        };
        this._applyEffects(effects[choice] || {});
        this._startLevel(7);
      });
    });
  }

  _level7() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(6, 'story', de
      ? 'Marktturbulenzen erschüttern dein Portfolio. Was tust du?'
      : 'Market turbulence shakes your portfolio. What do you do?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'🚨', label: this._trOpt(6,0,'label', de?'Verkaufen':'Sell'),              desc: this._trOpt(6,0,'description', de?'Verluste begrenzen.':'Cut losses.'),                value:'sell',        color:0x9b4a4a },
        { icon:'⬇️', label: this._trOpt(6,1,'label', de?'Reduzieren':'Reduce'),          desc: this._trOpt(6,1,'description', de?'Teilweise aussteigen.':'Partially exit.'),        value:'reduce',      color:0x9b7a4a },
        { icon:'⏳', label: this._trOpt(6,2,'label', de?'Halten':'Hold'),                 desc: this._trOpt(6,2,'description', de?'Ruhig bleiben.':'Stay calm.'),                     value:'hold',        color:0x4a7a9b },
        { icon:'💰', label: this._trOpt(6,3,'label', de?'Mehr kaufen':'Invest More'),     desc: this._trOpt(6,3,'description', de?'Tiefkauf nutzen.':'Use the dip.'),                value:'invest_more', color:0x4a9b4a },
      ], (choice) => {
        this._decisions.push({ level:7, choice });
        const effects = {
          sell:        { happiness:-5,  development:-8,  resources:+12 },
          reduce:      { happiness:-2,  development:-3,  resources:+6  },
          hold:        { happiness:+3,  development:+2,  resources:-2  },
          invest_more: { happiness:+5,  development:+10, resources:-18 },
        };
        this._applyEffects(effects[choice] || {});
        this._startLevel(8);
      });
    });
  }

  _level8() {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const story = this._tr(7, 'story', de
      ? 'Der große Crash. Märkte brechen ein. Wie hältst du durch?'
      : 'The big crash. Markets collapse. How do you endure?');
    this._showStory(story, () => {
      this._showDecisionPanel([
        { icon:'🚨', label: this._trOpt(7,0,'label', de?'Alles verkaufen':'Sell All'),    desc: this._trOpt(7,0,'description', de?'Kapital sichern.':'Secure capital.'),             value:'sell_all',   color:0x9b4a4a },
        { icon:'⏳', label: this._trOpt(7,1,'label', de?'Halten':'Hold'),                 desc: this._trOpt(7,1,'description', de?'Ausharren und warten.':'Stay and wait.'),         value:'hold',       color:0x4a7a9b },
        { icon:'⚖️', label: this._trOpt(7,2,'label', de?'Umschichten':'Rebalance'),       desc: this._trOpt(7,2,'description', de?'Portfolio neu ausrichten.':'Rebalance portfolio.'),value:'rebalance',  color:0x4a9b6a },
        { icon:'💰', label: this._trOpt(7,3,'label', de?'Nachkaufen':'Buy Dip'),          desc: this._trOpt(7,3,'description', de?'Langfristig denken.':'Think long-term.'),          value:'buy_dip',    color:0x4a9b4a },
      ], (choice) => {
        this._decisions.push({ level:8, choice });
        const effects = {
          sell_all:  { happiness:-10, development:-15, resources:+20 },
          hold:      { happiness:+2,  development:+2,  resources:-5  },
          rebalance: { happiness:+5,  development:+5,  resources:-10 },
          buy_dip:   { happiness:+3,  development:+15, resources:-22 },
        };
        this._applyEffects(effects[choice] || {});
        this._endGame();
      });
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────

  _showStory(text, cb) {
    const de = (typeof currentLang !== 'undefined' && currentLang === 'de');
    const cx = this.W / 2;
    const cy = this.H * 0.3;
    const panel = this.add.rectangle(cx, cy, this.W * 0.75, 120, 0x0d1f12, 0.92)
      .setStrokeStyle(1, 0x2e7d32);
    const txt = this.add.text(cx, cy, text, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '18px',
      color: '#e8f5e9',
      wordWrap: { width: this.W * 0.68 },
      align: 'center',
    }).setOrigin(0.5);
    const btnLabel = de ? 'Entscheiden →' : 'Decide →';
    const btn = this.add.text(cx, cy + 55, btnLabel, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '16px',
      color: '#66bb6a',
      backgroundColor: '#1b5e20',
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => btn.setStyle({ color: '#e8f5e9' }));
    btn.on('pointerout',   () => btn.setStyle({ color: '#66bb6a' }));
    btn.on('pointerdown',  () => {
      panel.destroy(); txt.destroy(); btn.destroy();
      if (cb) cb();
    });
  }

  _showDecisionPanel(options, cb) {
    const cx = this.W / 2;
    const startY = this.H * 0.48;
    const btnW = Math.min(520, this.W * 0.65);
    const btnH = 68;
    const gap = 12;
    const objs = [];

    options.forEach((opt, i) => {
      const by = startY + i * (btnH + gap);
      const bg = this.add.rectangle(cx, by, btnW, btnH, opt.color || 0x1b5e20, 0.85)
        .setStrokeStyle(1.5, 0x388e3c)
        .setInteractive({ useHandCursor: true });
      const iconTxt = this.add.text(cx - btnW/2 + 32, by, opt.icon || '', {
        fontSize: '22px',
      }).setOrigin(0.5);
      const labelTxt = this.add.text(cx - btnW/2 + 72, by - 10, opt.label, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#e8f5e9',
      }).setOrigin(0, 0.5);
      const descTxt = this.add.text(cx - btnW/2 + 72, by + 12, opt.desc, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
        color: '#a5d6a7',
        wordWrap: { width: btnW - 90 },
      }).setOrigin(0, 0.5);

      bg.on('pointerover',  () => { bg.setAlpha(1); labelTxt.setStyle({ color: '#ffffff' }); });
      bg.on('pointerout',   () => { bg.setAlpha(0.85); labelTxt.setStyle({ color: '#e8f5e9' }); });
      bg.on('pointerdown',  () => {
        objs.forEach(o => o.destroy());
        if (cb) cb(opt.value);
      });
      objs.push(bg, iconTxt, labelTxt, descTxt);
    });
  }

  _applyEffects(effects) {
    Object.keys(effects).forEach(k => {
      if (this.score[k] !== undefined) {
        this.score[k] = Math.max(0, Math.min(k === 'resources' ? 200 : 100, this.score[k] + effects[k]));
      }
    });
    this.score.year += 1;
    this.hud.update(this.score);
    this._districts.forEach(d => {
      d.setHealth(d.health + (effects.happiness || 0) * 0.3);
    });
  }

  _endGame() {
    this.cameras.main.fadeOut(600, 13, 31, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.registry.set('decisions', this._decisions);
      this.registry.set('score', this.score);
      this.scene.start('ProfileScene');
    });
  }

  shutdown() {
    // clean up
  }
}
