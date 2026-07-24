// WealthSim Scoring Engine
// Each trait scored 0-100
// Starting questions: 20% weight
// In-game behavior: 80% weight

const ScoringEngine = {

  decisions: [],
  startingAnswers: [],
  decisionTimes: [],
  levelStartTime: null,

  reset() {
    this.decisions = [];
    this.startingAnswers = [];
    this.decisionTimes = [];
    this.levelStartTime = null;
  },

  startTimer() {
    this.levelStartTime = Date.now();
  },

  recordDecision(level, value, extra = {}) {
    const elapsed = this.levelStartTime ? Date.now() - this.levelStartTime : null;
    this.decisions.push({ level, value, elapsed, ...extra });
  },

  recordStartingAnswer(questionIndex, value) {
    this.startingAnswers[questionIndex] = value;
  },

  scoreRiskPreference() {
    const d = this.decisions.find(d => d.level === 1);
    if (!d) return 50;
    const gameScore = { safe: 20, balanced: 50, aggressive: 85 }[d.value] ?? 50;
    const startScore = { safe: 20, balanced: 50, aggressive: 85 }[this.startingAnswers[0]] ?? 50;
    return Math.round(gameScore * 0.8 + startScore * 0.2);
  },

  scoreLossAversion() {
    const d = this.decisions.find(d => d.level === 2);
    if (!d) return 50;
    const gameScore = { cancel: 90, wait: 70, continue: 30, invest_more: 10 }[d.value] ?? 50;
    const startScore = { stop: 90, wait: 60, research: 30 }[this.startingAnswers[2]] ?? 50;
    return Math.round(gameScore * 0.8 + startScore * 0.2);
  },

  scoreDiversification(allocation) {
    if (!allocation) return 50;
    const values = Object.values(allocation).filter(v => v > 0);
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return 50;
    const shares = values.map(v => v / total);
    const hhi = shares.reduce((sum, s) => sum + s * s, 0);
    const score = Math.round((1 - hhi) / 0.75 * 100);
    return Math.min(100, Math.max(0, score));
  },

  scorePatience() {
    const d = this.decisions.find(d => d.level === 4);
    if (!d) return 50;
    const gameScore = { festival: 20, university: 85 }[d.value] ?? 50;
    const startScore = { impatient: 20, moderate: 55, patient: 85 }[this.startingAnswers[1]] ?? 50;
    return Math.round(gameScore * 0.8 + startScore * 0.2);
  },

  scoreGreedFomo() {
    const d = this.decisions.find(d => d.level === 5);
    if (!d) return 50;
    return { all_in: 95, increase: 65, hold: 25, reduce: 10 }[d.value] ?? 50;
  },

  scoreLearningAdaptability() {
    const d = this.decisions.find(d => d.level === 6);
    if (!d) return 50;
    const baseScore = { research: 85, accept: 65, independent: 55, decline: 40 }[d.value] ?? 50;
    const lossAversion = this.scoreLossAversion();
    const changeBehavior = lossAversion > 60 && d.value === 'research' ? 10 : 0;
    return Math.min(100, Math.round(baseScore + changeBehavior));
  },

  scoreReactionToNoise() {
    const d = this.decisions.find(d => d.level === 7);
    if (!d) return 50;
    const gameScore = { sell: 90, reduce: 55, hold: 25, research: 10 }[d.value] ?? 50;
    const speedPenalty = d.elapsed && d.elapsed < 4000 ? 10 : 0;
    return Math.min(100, Math.round(gameScore * 0.8 + speedPenalty));
  },

  scoreEmotionalResilience() {
    const d = this.decisions.find(d => d.level === 8);
    if (!d) return 50;
    return { hold: 90, rebalance: 85, opportunistic: 75, safe_haven: 45, sell_all: 15 }[d.value] ?? 50;
  },

  consistencyScore() {
    let matches = 0;
    let total = 0;
    const l1 = this.decisions.find(d => d.level === 1);
    if (l1 && this.startingAnswers[0]) {
      if (l1.value === this.startingAnswers[0]) matches++;
      total++;
    }
    const l4 = this.decisions.find(d => d.level === 4);
    if (l4 && this.startingAnswers[1]) {
      const patientChose = l4.value === 'university';
      const saidPatient = ['moderate', 'patient'].includes(this.startingAnswers[1]);
      if (patientChose === saidPatient) matches++;
      total++;
    }
    const l2 = this.decisions.find(d => d.level === 2);
    if (l2 && this.startingAnswers[2]) {
      const actedCalm = ['continue', 'invest_more'].includes(l2.value);
      const saidCalm = ['wait', 'research'].includes(this.startingAnswers[2]);
      if (actedCalm === saidCalm) matches++;
      total++;
    }
    return total > 0 ? Math.round((matches / total) * 100) : 50;
  },

  computeAllScores(allocation) {
    return {
      riskPreference: this.scoreRiskPreference(),
      lossAversion: this.scoreLossAversion(),
      diversification: this.scoreDiversification(allocation),
      patience: this.scorePatience(),
      greedFomo: this.scoreGreedFomo(),
      learningAdaptability: this.scoreLearningAdaptability(),
      reactionToNoise: this.scoreReactionToNoise(),
      emotionalResilience: this.scoreEmotionalResilience(),
      consistency: this.consistencyScore()
    };
  },

  assignPersona(scores) {
    const { riskPreference, lossAversion, patience, greedFomo, reactionToNoise, emotionalResilience, consistency } = scores;
    if (consistency < 40 && reactionToNoise > 70) return 'reactor';
    if (patience < 35 && greedFomo > 65) return 'sprinter';
    if (riskPreference < 35 && lossAversion > 65) return 'guardian';
    if (riskPreference > 70 && lossAversion < 40 && greedFomo > 60) return 'challenger';
    if (patience > 65 && reactionToNoise < 40 && emotionalResilience > 65) return 'strategist';
    return 'explorer';
  },

  getLabel(score) {
    if (currentLang === 'de') {
      if (score >= 80) return 'Sehr hoch';
      if (score >= 65) return 'Hoch';
      if (score >= 45) return 'Moderat';
      if (score >= 30) return 'Niedrig';
      return 'Sehr niedrig';
    }
    if (score >= 80) return 'Very high';
    if (score >= 65) return 'High';
    if (score >= 45) return 'Moderate';
    if (score >= 30) return 'Low';
    return 'Very low';
  },

  getDebriefText(saule, years) {
    const sauleKey = saule || 'unsure';
    let yearsKey = 'y30plus';
    if (years === 'under15') yearsKey = 'under15';
    else if (years === '15-30') yearsKey = 'y1530';
    const debrief = TRANSLATIONS[currentLang].debrief;
    return debrief[sauleKey]?.[yearsKey] ?? debrief.unsure.y30plus;
  }
};
