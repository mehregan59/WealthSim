class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.isCompact = this.W < 700;
    this.currentLevel = 1;
    this.totalLevels = 10;
    this._decisions = [];
    this._lastDecisionPanel = null;
    this._choicesMade = [];
    this._consequencePending = false;
    this._tutorialShown = new Set();
    this._levelTitleShown = new Set();
    this._sceneReady = false;
    this._buildPhase = true;
    this.ambient = null;
    this.weather = null;
    this._pendingLevelTransition = false;
    this._retryCount = 0;
    const bg = this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0xa7d8de).setDepth(0);
    this.cityscape = new CityScape(this, this.W, this.H);
    this.hud = new HUD(this, this.W, this.H);
    this.statsPanel = new StatsPanel(this, this.W, this.H);
    this.tooltip = new TooltipManager(this, this.W, this.H);
    this.tutorial = new Tutorial(this, this.W, this.H);
    this.ambient = new AmbientSystem(this, this.W, this.H);
    this.weather = new WeatherSystem(this, this.W, this.H);
    this.scale.on('resize', (gameSize) => {
      this.W = gameSize.width; this.H = gameSize.height;
      this.isCompact = this.W < 700;
      bg.setPosition(this.W/2, this.H/2).setSize(this.W, this.H);
      if (this.cityscape) this.cityscape.resize(this.W, this.H);
      if (this.hud) this.hud.resize(this.W, this.H);
      if (this.statsPanel) this.statsPanel.resize(this.W, this.H);
      if (this.tooltip) this.tooltip.resize(this.W, this.H);
      if (this.tutorial) this.tutorial.resize(this.W, this.H);
      if (this.ambient) this.ambient.resize(this.W, this.H);
      if (this.weather) this.weather.resize(this.W, this.H);
    });
    this._startLevel(1);
    this._sceneReady = true;
  }

  _levelData(n) {
    if (typeof LEVEL_DATA !== 'undefined' && LEVEL_DATA[n]) return LEVEL_DATA[n];
    return null;
  }

  _startLevel(n, isRetry) {
    this._pendingLevelTransition = false;
    this.currentLevel = n;
    this.hud.setLevel(n, this._levelName(n));
    if(this.ambient)this.ambient.setSimulationLevel(n);
    const run = () => this.time.delayedCall(460, fn.bind(this));
    const proceed = () => {
      // The very first time Level 1 starts, point the player at the side
      // panel and explain what it tracks before anything is shown.
      const titleAlreadyShown = this._levelTitleShown.has(n);
      this._levelTitleShown.add(n);
      if (!titleAlreadyShown) {
        this._showLevelTitle(n, () => {
          this.tutorial.show(n, proceed);
        });
        return;
      }
      this.tutorial.show(n, () => {
        this._showDecisionPanel(n);
      });
    };
    const fn = () => {
      proceed();
    };
    if (isRetry) {
      this.time.delayedCall(200, fn.bind(this));
    } else {
      this.time.delayedCall(460, fn.bind(this));
    }
  }

  _showLevelTitle(n, cb) {
    const name = this._levelName(n);
    this.hud.showLevelTitle(n, name, cb);
    this.hud.setLevel(n, this._levelName(n));
    this.time.delayedCall(titleAlreadyShown?228:911, ()=> this.tutorial.show(n, proceed));
  }

  _retryLevel() {
    const n = this.currentLevel;
    this._clearDecisionPanel();
    this._clearConsequence();
    this._clearWorldBtn();
    this._retryCount++;
    this._startLevel(n, true);
  }

  _levelName(){const lvl=this.currentLevel;const tr=typeof TRANSLATIONS!=='undefined'&&TRANSLATIONS[typeof currentLang!=='undefined'?currentLang:'en'];return (tr&&tr.levels&&tr.levels[lvl-1]&&tr.levels[lvl-1].title)||{1:'The First Opportunity',2:'The Unexpected Setback',3:'The Regulatory Shift',4:'Community Investment',5:'The Boom',6:'The New Competitor',7:'Market Turbulence',8:'The Crash',9:'The Recovery',10:'The Harvest'}[lvl]||'Level '+lvl}

  _nextLevel(){
    this._clearConsequence(); this._clearWorldBtn();
    const next = this.currentLevel + 1;
    if (next > this.totalLevels) {
      this._endGame();
    } else {
      this.currentLevel = next;
      this.cityscape.growCity(next);
      this.time.delayedCall(600, () => this._startLevel(next));
    }
  }

  _endGame() {
    if (typeof window !== 'undefined' && window.WS_game) {
      const decisions = this._decisions.slice();
      this.scene.start('ProfileScene', { decisions });
    }
  }

  _showDecisionPanel(n) {
    this._clearDecisionPanel();
    const ld = this._levelData(n);
    if (!ld) { this._nextLevel(); return; }
    this._lastDecisionPanel = new DecisionPanel(this, this.W, this.H, ld, (choice) => {
      this._recordDecision(n, choice);
      this._showConsequence(n, choice);
    });
  }

  _recordDecision(level, choice) {
    this._decisions.push({ level, choice });
    this._choicesMade.push({ level, choice });
    if (typeof scoreDecision === 'function') {
      scoreDecision(level, choice, this._decisions);
    }
  }

  _showConsequence(n, choice) {
    this._clearDecisionPanel();
    const ld = this._levelData(n);
    if (!ld) { this._nextLevel(); return; }
    const consequence = ld.consequences && ld.consequences[choice];
    if (!consequence) { this._nextLevel(); return; }
    this._consequencePending = true;
    this.hud.showConsequence(consequence, () => {
      this._consequencePending = false;
      this._nextLevel();
    });
  }

  _clearDecisionPanel() {
    if (this._lastDecisionPanel) {
      this._lastDecisionPanel.destroy();
      this._lastDecisionPanel = null;
    }
  }

  _clearConsequence() {
    this.hud.clearConsequence && this.hud.clearConsequence();
    this._consequencePending = false;
  }

  _clearWorldBtn() {
    if (this._worldBtn) { this._worldBtn.destroy(); this._worldBtn = null; }
  }
}
