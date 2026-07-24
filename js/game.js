// WealthSim Game Engine

const Game = {

  state: {
    screen: 'opening',
    playerInfo: {},
    context: {},
    currentLevel: 0,
    currentQuestion: 0,
    cityStats: { happiness: 50, development: 50, resources: 100 },
    allocation: null,
    hasUniversity: false,
    universityRevealed: false,
    stormHit: false,
    boomChoice: null,
  },

  init() {
    this.bindOpeningButtons();
    this.bindInfoScreen();
    this.bindContextScreen();
    this.initCityVisual();
    this.renderCityStats();
    applyTranslations();
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) { el.classList.add('active'); el.scrollTop = 0; }
    this.state.screen = id;
  },

  bindOpeningButtons() {
    document.getElementById('btn-start').addEventListener('click', () => this.showScreen('info'));
  },

  bindInfoScreen() {
    const groups = ['age-options', 'employment-options', 'experience-options'];
    const keys = ['age', 'employment', 'experience'];
    const nextBtn = document.getElementById('btn-info-next');
    groups.forEach((groupId, i) => {
      document.getElementById(groupId).addEventListener('click', e => {
        const btn = e.target.closest('.option-btn');
        if (!btn) return;
        document.querySelectorAll(`#${groupId} .option-btn`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.state.playerInfo[keys[i]] = btn.dataset.value;
        this.checkInfoComplete(nextBtn);
      });
    });
    nextBtn.addEventListener('click', () => {
      if (nextBtn.classList.contains('btn-disabled')) return;
      this.showScreen('context');
      applyTranslations();
    });
  },

  checkInfoComplete(btn) {
    const { age, employment, experience } = this.state.playerInfo;
    if (age && employment && experience) btn.classList.remove('btn-disabled');
  },

  bindContextScreen() {
    const groups = ['saule-options', 'years-options', 'buildexp-options'];
    const keys = ['saule', 'years', 'buildexp'];
    const nextBtn = document.getElementById('btn-context-next');
    groups.forEach((groupId, i) => {
      document.getElementById(groupId).addEventListener('click', e => {
        const btn = e.target.closest('.option-btn');
        if (!btn) return;
        document.querySelectorAll(`#${groupId} .option-btn`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.state.context[keys[i]] = btn.dataset.value;
        this.checkContextComplete(nextBtn);
      });
    });
    nextBtn.addEventListener('click', () => {
      if (nextBtn.classList.contains('btn-disabled')) return;
      this.startQuestions();
    });
  },

  checkContextComplete(btn) {
    const { saule, years, buildexp } = this.state.context;
    if (saule && years && buildexp) btn.classList.remove('btn-disabled');
  },

  startQuestions() {
    this.state.currentQuestion = 0;
    this.showScreen('questions');
    this.renderQuestion();
  },

  renderQuestion() {
    const questions = t('questions.items');
    const q = questions[this.state.currentQuestion];
    document.getElementById('q-current').textContent = this.state.currentQuestion + 1;
    document.getElementById('q-total').textContent = questions.length;
    const textEl = document.getElementById('question-text');
    textEl.textContent = q.text;
    textEl.style.opacity = '0';
    setTimeout(() => { textEl.style.opacity = '1'; }, 50);
    const optContainer = document.getElementById('question-options');
    optContainer.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn wide';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        ScoringEngine.recordStartingAnswer(this.state.currentQuestion, opt.value);
        this.state.currentQuestion++;
        if (this.state.currentQuestion >= questions.length) this.startGame();
        else this.renderQuestion();
      });
      optContainer.appendChild(btn);
    });
  },

  startGame() {
    ScoringEngine.reset();
    this.state.currentLevel = 0;
    this.state.hasUniversity = false;
    this.state.allocation = null;
    this.state.boomChoice = null;
    this.state.cityStats = { happiness: 60, development: 40, resources: 80 };
    this.showScreen('game');
    this.initCityVisual();
    this.renderCityStats();
    setTimeout(() => this.loadLevel(), 300);
  },

  loadLevel() {
    const levels = t('levels');
    if (this.state.currentLevel >= levels.length) { this.showReveal(); return; }
    const level = levels[this.state.currentLevel];
    ScoringEngine.startTimer();
    document.getElementById('level-tag').textContent = level.tag;
    document.getElementById('level-title').textContent = level.title;
    if (level.isStorm) this.triggerStorm();
    else this.clearWeather();
    if (this.state.currentLevel === 7 && this.state.hasUniversity && !this.state.universityRevealed) {
      this.state.universityRevealed = true;
      this.showUniversityReveal(level);
      return;
    }
    this.renderLevelStory(level);
    this.renderLevelOptions(level);
    this.scrollGamePanel();
  },

  renderLevelStory(level) {
    let story = level.story;
    if (this.state.currentLevel === 5) {
      story = this.buildLevel6Summary() + '\n\n' + story;
    }
    const storyEl = document.getElementById('level-story');
    storyEl.innerHTML = '';
    if (level.news) {
      const banner = document.createElement('div');
      banner.className = 'news-banner';
      level.news.forEach(n => {
        const line = document.createElement('p');
        line.textContent = '📰 ' + n;
        banner.appendChild(line);
      });
      storyEl.appendChild(banner);
    }
    if (level.offer) {
      const offerBox = document.createElement('div');
      offerBox.className = 'offer-box';
      const h = document.createElement('h4');
      h.textContent = level.offer.title;
      offerBox.appendChild(h);
      const p = document.createElement('p');
      p.textContent = level.offer.description;
      offerBox.appendChild(p);
      const ul = document.createElement('ul');
      level.offer.details.forEach(d => {
        const li = document.createElement('li');
        li.textContent = d;
        ul.appendChild(li);
      });
      offerBox.appendChild(ul);
      storyEl.appendChild(offerBox);
    }
    const p = document.createElement('p');
    p.textContent = story;
    storyEl.appendChild(p);
  },

  buildLevel6Summary() {
    const div = this.scoreDiversification();
    const lang = currentLang;
    if (div > 60) {
      return lang === 'de'
        ? 'Der Stadtrat berichtet: Deine Ressourcen waren auf mehrere Stadtteile verteilt. Als einer zurückging, blieb die Stadt insgesamt relativ stabil.'
        : 'The city council reports: Your resources were distributed across several districts. When one declined, the city remained relatively stable overall.';
    }
    return lang === 'de'
      ? 'Der Stadtrat berichtet: Ein erheblicher Teil deiner Ressourcen war in einem Stadtteil konzentriert. Als dieser zurückging, war der Gesamteffekt größer.'
      : 'The city council reports: A significant portion of your resources was concentrated in one district. When it declined, the overall effect was larger.';
  },

  scoreDiversification() {
    const l3 = ScoringEngine.decisions.find(d => d.level === 3);
    return l3?.allocation ? ScoringEngine.scoreDiversification(l3.allocation) : 50;
  },

  renderLevelOptions(level) {
    document.getElementById('level-options').innerHTML = '';
    document.getElementById('level-options').classList.remove('hidden');
    document.getElementById('allocation-ui').classList.add('hidden');
    document.getElementById('consequence-panel').classList.add('hidden');
    if (level.type === 'allocation') this.renderAllocationUI(level);
    else this.renderStandardOptions(level);
  },

  renderStandardOptions(level) {
    const container = document.getElementById('level-options');
    container.innerHTML = '';
    level.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn wide level-option';
      const label = document.createElement('strong');
      label.textContent = opt.label;
      const desc = document.createElement('span');
      desc.className = 'option-desc';
      desc.textContent = opt.description;
      btn.appendChild(label);
      btn.appendChild(desc);
      if (opt.isReport) {
        btn.addEventListener('click', () => this.showReportModal(level.report, () => this.recordAndConsequence(level, opt)));
      } else {
        btn.addEventListener('click', () => this.recordAndConsequence(level, opt));
      }
      container.appendChild(btn);
    });
  },

  showReportModal(reportText, callback) {
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    const box = document.createElement('div');
    box.className = 'report-box';
    const title = document.createElement('h4');
    title.textContent = t('game.reportTitle');
    const text = document.createElement('p');
    text.textContent = reportText;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.textContent = t('common.continue');
    closeBtn.addEventListener('click', () => { modal.remove(); callback(); });
    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.getElementById('app').appendChild(modal);
  },

  renderAllocationUI(level) {
    document.getElementById('level-options').classList.add('hidden');
    const ui = document.getElementById('allocation-ui');
    ui.classList.remove('hidden');
    const alloc = {};
    level.districts.forEach(d => { alloc[d.id] = 0; });
    const container = document.getElementById('allocation-districts');
    container.innerHTML = '';
    const remainingEl = document.getElementById('remaining-credits');
    const confirmBtn = document.getElementById('btn-allocate');
    confirmBtn.classList.add('btn-disabled');
    remainingEl.textContent = level.totalCredits;
    level.districts.forEach(district => {
      const row = document.createElement('div');
      row.className = 'alloc-row';
      const info = document.createElement('div');
      info.className = 'alloc-info';
      const name = document.createElement('strong');
      name.textContent = district.label;
      const desc = document.createElement('span');
      desc.textContent = district.description;
      info.appendChild(name);
      info.appendChild(desc);
      const controls = document.createElement('div');
      controls.className = 'alloc-controls';
      const minus = document.createElement('button');
      minus.className = 'alloc-btn';
      minus.textContent = '−';
      const val = document.createElement('span');
      val.className = 'alloc-val';
      val.textContent = '0';
      const plus = document.createElement('button');
      plus.className = 'alloc-btn';
      plus.textContent = '+';
      const step = 50;
      plus.addEventListener('click', () => {
        const remaining = parseInt(remainingEl.textContent);
        if (remaining >= step) {
          alloc[district.id] += step;
          val.textContent = alloc[district.id];
          remainingEl.textContent = remaining - step;
          this.updateAllocConfirm(alloc, level.totalCredits, confirmBtn);
        }
      });
      minus.addEventListener('click', () => {
        if (alloc[district.id] >= step) {
          alloc[district.id] -= step;
          val.textContent = alloc[district.id];
          remainingEl.textContent = parseInt(remainingEl.textContent) + step;
          this.updateAllocConfirm(alloc, level.totalCredits, confirmBtn);
        }
      });
      controls.appendChild(minus);
      controls.appendChild(val);
      controls.appendChild(plus);
      row.appendChild(info);
      row.appendChild(controls);
      container.appendChild(row);
    });
    confirmBtn.addEventListener('click', () => {
      if (confirmBtn.classList.contains('btn-disabled')) return;
      this.state.allocation = alloc;
      ScoringEngine.recordDecision(3, 'allocated', { allocation: alloc });
      this.showConsequence(level.consequence, () => { this.updateCityFromLevel(3); this.nextLevel(); });
    });
  },

  updateAllocConfirm(alloc, total, btn) {
    const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
    if (spent === total) btn.classList.remove('btn-disabled');
    else btn.classList.add('btn-disabled');
  },

  recordAndConsequence(level, opt) {
    const levelNum = this.state.currentLevel + 1;
    ScoringEngine.recordDecision(levelNum, opt.value);
    if (levelNum === 4 && opt.value === 'university') this.state.hasUniversity = true;
    if (levelNum === 5) this.state.boomChoice = opt.value;
    this.showConsequence(opt.consequence, () => { this.updateCityFromLevel(levelNum); this.nextLevel(); });
  },

  showConsequence(text, callback) {
    document.getElementById('level-options').classList.add('hidden');
    document.getElementById('allocation-ui').classList.add('hidden');
    const panel = document.getElementById('consequence-panel');
    document.getElementById('consequence-text').textContent = text;
    panel.classList.remove('hidden');
    const btn = document.getElementById('btn-consequence-next');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.textContent = t('common.continue');
    newBtn.addEventListener('click', callback);
    this.scrollGamePanel();
  },

  showUniversityReveal(level) {
    const msg = currentLang === 'de'
      ? 'Die Forschungsuniversität öffnet ihre Türen. Absolventen gründen Unternehmen. Das Stadteinkommen steigt. Die Zufriedenheit verbessert sich. Deine Geduld trägt jetzt Früchte.'
      : 'The Research University opens its doors. Graduates begin creating companies. City income rises. Happiness improves. Your patience is paying off now.';
    document.getElementById('level-tag').textContent = level.tag;
    document.getElementById('level-title').textContent = level.title;
    document.getElementById('level-story').textContent = msg;
    document.getElementById('level-options').innerHTML = '';
    document.getElementById('allocation-ui').classList.add('hidden');
    document.getElementById('consequence-panel').classList.add('hidden');
    this.state.cityStats.happiness = Math.min(100, this.state.cityStats.happiness + 15);
    this.state.cityStats.development = Math.min(100, this.state.cityStats.development + 20);
    this.renderCityStats();
    setTimeout(() => { this.renderLevelOptions(level); this.scrollGamePanel(); }, 1800);
  },

  updateCityFromLevel(levelNum) {
    const s = this.state.cityStats;
    const d = ScoringEngine.decisions.find(d => d.level === levelNum);
    if (!d) return;
    switch (levelNum) {
      case 1:
        if (d.value === 'safe') { s.development += 8; s.happiness += 5; }
        if (d.value === 'balanced') { s.development += 14; s.resources -= 5; }
        if (d.value === 'aggressive') { s.development += 20; s.resources -= 12; s.happiness += 8; }
        break;
      case 2:
        if (d.value === 'cancel') { s.resources += 10; s.development -= 8; }
        if (d.value === 'continue') { s.development += 5; }
        if (d.value === 'invest_more') { s.development += 10; s.resources -= 15; }
        if (d.value === 'wait') { s.development -= 5; }
        break;
      case 3: s.development += 12; s.resources -= 10; break;
      case 4:
        if (d.value === 'festival') { s.happiness += 18; }
        if (d.value === 'university') { s.resources -= 8; }
        break;
      case 5:
        if (d.value === 'all_in') { s.development += 20; s.resources -= 10; }
        if (d.value === 'increase') { s.development += 12; }
        if (d.value === 'hold') { s.development += 5; }
        if (d.value === 'reduce') { s.resources += 8; s.development -= 3; }
        break;
      case 6:
        if (d.value === 'accept') { s.resources -= 8; s.happiness += 5; }
        if (d.value === 'independent') { s.resources -= 15; s.development += 8; }
        if (d.value === 'research') { s.happiness += 3; }
        break;
      case 7:
        if (d.value === 'sell') { s.resources += 10; s.development -= 10; }
        if (d.value === 'reduce') { s.resources += 5; }
        if (d.value === 'research') { s.happiness += 5; }
        break;
      case 8:
        if (d.value === 'sell_all') { s.resources += 15; s.development -= 15; s.happiness -= 10; }
        if (d.value === 'hold') { s.happiness += 5; }
        if (d.value === 'rebalance') { s.development += 8; s.happiness += 5; }
        if (d.value === 'opportunistic') { s.development += 12; s.resources -= 8; }
        if (d.value === 'safe_haven') { s.resources += 8; s.development -= 5; }
        break;
    }
    s.happiness = Math.max(10, Math.min(100, s.happiness));
    s.development = Math.max(10, Math.min(100, s.development));
    s.resources = Math.max(10, Math.min(100, s.resources));
    this.renderCityStats();
    this.updateCityVisual();
  },

  nextLevel() {
    this.state.currentLevel++;
    document.getElementById('consequence-panel').classList.add('hidden');
    setTimeout(() => this.loadLevel(), 400);
  },

  scrollGamePanel() {
    const panel = document.getElementById('game-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  initCityVisual() {
    const buildings = document.getElementById('cv-buildings');
    if (!buildings) return;
    buildings.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('div');
      b.className = 'building';
      b.style.left = (i * 11 + 2) + '%';
      b.style.height = (20 + Math.random() * 40) + '%';
      b.style.width = '8%';
      b.style.animationDelay = (Math.random() * 0.5) + 's';
      buildings.appendChild(b);
    }
  },

  updateCityVisual() {
    const { happiness, development } = this.state.cityStats;
    document.querySelectorAll('.building').forEach((b, i) => {
      b.style.height = Math.min(90, 20 + (development / 100) * 50 + (i % 3) * 5) + '%';
      b.style.opacity = 0.5 + (happiness / 100) * 0.5;
    });
  },

  triggerStorm() {
    document.getElementById('weather-overlay').classList.add('storm-active');
    document.getElementById('city-visual').classList.add('stormy');
    this.state.cityStats.development = Math.max(10, this.state.cityStats.development - 20);
    this.state.cityStats.happiness = Math.max(10, this.state.cityStats.happiness - 12);
    this.state.cityStats.resources = Math.max(10, this.state.cityStats.resources - 10);
    this.renderCityStats();
    this.updateCityVisual();
  },

  clearWeather() {
    document.getElementById('weather-overlay').classList.remove('storm-active');
    document.getElementById('city-visual').classList.remove('stormy');
  },

  renderCityStats() {
    const { happiness, development, resources } = this.state.cityStats;
    this.setBar('bar-happiness', happiness);
    this.setBar('bar-development', development);
    this.setBar('bar-resources', resources);
  },

  setBar(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.max(4, Math.min(100, value)) + '%';
  },

  showReveal() {
    this.clearWeather();
    this.showScreen('reveal');
    const rows = t('reveal.rows');
    const container = document.getElementById('reveal-rows');
    container.innerHTML = '';
    rows.forEach((row, i) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'reveal-row';
        div.innerHTML = `<span class="reveal-game">${row.game}</span><span class="reveal-arrow">→</span><span class="reveal-real">${row.real}</span>`;
        container.appendChild(div);
      }, i * 200);
    });
    document.getElementById('btn-reveal-next').addEventListener('click', () => this.showProfile());
  },

  showProfile() {
    this.showScreen('profile');
    const l3 = ScoringEngine.decisions.find(d => d.level === 3);
    const scores = ScoringEngine.computeAllScores(l3?.allocation ?? this.state.allocation);
    const persona = ScoringEngine.assignPersona(scores);
    const personaData = t('personas.' + persona);
    document.getElementById('persona-icon').textContent = personaData.icon;
    document.getElementById('persona-name').textContent = personaData.name;
    document.getElementById('persona-description').textContent = personaData.description;
    const traitKeys = ['riskPreference','lossAversion','diversification','patience','greedFomo','reactionToNoise','learningAdaptability','emotionalResilience'];
    const traitLabels = t('profile.traits');
    const table = document.getElementById('trait-table');
    table.innerHTML = '';
    traitKeys.forEach(key => {
      const row = document.createElement('div');
      row.className = 'trait-row';
      const label = document.createElement('span');
      label.className = 'trait-label';
      label.textContent = traitLabels[key];
      const score = scores[key];
      const bar = document.createElement('div');
      bar.className = 'trait-bar-wrap';
      const fill = document.createElement('div');
      fill.className = 'trait-bar-fill';
      fill.style.width = '0%';
      bar.appendChild(fill);
      const val = document.createElement('span');
      val.className = 'trait-val';
      val.textContent = ScoringEngine.getLabel(score);
      row.appendChild(label);
      row.appendChild(bar);
      row.appendChild(val);
      table.appendChild(row);
      setTimeout(() => { fill.style.width = score + '%'; }, 300);
    });
    document.getElementById('profile-explanation').textContent = personaData.explanation;
    document.getElementById('debrief-text').textContent = ScoringEngine.getDebriefText(this.state.context.saule, this.state.context.years);
    document.getElementById('edu-text').textContent = this.buildEduText(scores);
    document.getElementById('btn-replay').addEventListener('click', () => this.resetGame());
    document.getElementById('btn-learn').addEventListener('click', () => {
      alert(currentLang === 'de'
        ? 'Diese Funktion kommt bald mit dem Persönlichen KI-Ruhestandscoach.'
        : 'This feature is coming soon with the Personal AI Retirement Coach.');
    });
    applyTranslations();
  },

  buildEduText(scores) {
    const lang = currentLang;
    const lines = [];
    if (scores.lossAversion > 65) lines.push(lang === 'de' ? 'Deine Verlustaversion ist hoch. Überlege, wie normale Marktschwankungen von echtem langfristigem Risiko zu unterscheiden sind.' : 'Your loss aversion is high. Focus on distinguishing normal market fluctuations from genuine long-term risk.');
    if (scores.patience < 40) lines.push(lang === 'de' ? 'Geduld ist eine zentrale Fähigkeit beim langfristigen Vermögensaufbau. Überlege, wie ein Zeithorizont von 10–20 Jahren deine Entscheidungen verändern würde.' : 'Patience is a core skill in long-term wealth building. Consider how a 10–20 year horizon would change your decisions.');
    if (scores.greedFomo > 65) lines.push(lang === 'de' ? 'Deine Reaktion auf Markteuphorie deutet auf FOMO-Anfälligkeit hin. Das Festhalten an einem schriftlichen Plan während Boom-Phasen ist die wichtigste Schutzmaßnahme.' : 'Your reaction to market euphoria suggests FOMO susceptibility. Maintaining a written plan during boom periods is the most effective protection.');
    if (scores.reactionToNoise > 65) lines.push(lang === 'de' ? 'Du reagierst stark auf Schlagzeilen. Das Lesen der vollständigen Geschichte hinter Nachrichten ist eine Gewohnheit, die sich lohnt zu entwickeln.' : 'You react strongly to headlines. Reading the full story behind news is a habit worth developing.');
    if (scores.diversification < 40) lines.push(lang === 'de' ? 'Deine Ressourcen waren konzentriert. Erkundige dich, wie Diversifikation das Risiko über Zeit senken kann, ohne Rendite aufzugeben.' : 'Your resources were concentrated. Explore how diversification can reduce risk over time without sacrificing returns.');
    if (lines.length === 0) lines.push(lang === 'de' ? 'Dein Profil zeigt solide Grundlagen. Vertiefe dein Verständnis für Zinseszins und Inflation, um deine Stärken weiter auszubauen.' : 'Your profile shows solid foundations. Deepen your understanding of compound growth and inflation to build further on your strengths.');
    return lines.join(' ');
  },

  resetGame() {
    this.state = {
      screen: 'opening', playerInfo: {}, context: {},
      currentLevel: 0, currentQuestion: 0,
      cityStats: { happiness: 50, development: 50, resources: 100 },
      allocation: null, hasUniversity: false, universityRevealed: false,
      stormHit: false, boomChoice: null,
    };
    ScoringEngine.reset();
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('btn-info-next').classList.add('btn-disabled');
    document.getElementById('btn-context-next').classList.add('btn-disabled');
    this.showScreen('opening');
    applyTranslations();
  }
};

document.addEventListener('DOMContentLoaded', () => { Game.init(); });
