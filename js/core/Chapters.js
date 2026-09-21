/* WealthSim — scenario content for the Chapter 1 contracts, Chapter 9
 * (project review) and Chapter 10 (forecasts and practice).
 *
 * Every number here is declared data, validated by tests before play.
 * Probabilities belong to the fictional scenario. Nothing in this file
 * fits a psychological parameter; it produces events and factual counts.
 */
(function (root, Sim) {
  'use strict';

  // ── Chapter 1: paired contracts ──────────────────────────────────
  // Equal cost. The narrow contract never changes; the wide contract's
  // chance of its high outcome rises across the ladder. Neither option
  // dominates the other in any pair (tested).
  const COST = 100;
  const NARROW = { outcomes: [[0.6, 110], [0.4, 90]] };
  const CH1_PAIRS = [
    { trialId:'pair1', pHigh:0.3, narrow:NARROW, wide:{ outcomes:[[0.3,190],[0.7,20]] } },
    { trialId:'pair2', pHigh:0.5, narrow:NARROW, wide:{ outcomes:[[0.5,190],[0.5,20]] } },
    { trialId:'pair3', pHigh:0.7, narrow:NARROW, wide:{ outcomes:[[0.7,190],[0.3,20]] } }
  ];

  function expected(o) { return o.outcomes.reduce(function (s,x){ return s + x[0]*x[1]; }, 0); }
  function spread(o) {
    const m = expected(o);
    return Math.sqrt(o.outcomes.reduce(function (s,x){ return s + x[0]*Math.pow(x[1]-m,2); }, 0));
  }
  // First-order stochastic dominance: a >= b in P(value >= x) for every x,
  // strictly somewhere.
  function dominates(a, b) {
    const pts = a.outcomes.concat(b.outcomes).map(function (x){ return x[1]; });
    let strict = false;
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i];
      const pa = a.outcomes.filter(function (o){ return o[1] >= x; }).reduce(function (s,o){ return s+o[0]; }, 0);
      const pb = b.outcomes.filter(function (o){ return o[1] >= x; }).reduce(function (s,o){ return s+o[0]; }, 0);
      if (pa < pb - 1e-12) return false;
      if (pa > pb + 1e-12) strict = true;
    }
    return strict;
  }

  // Factual reading of the ladder — a switch point, not a coefficient.
  function riskPairs(events) {
    const picks = CH1_PAIRS.map(function (p) {
      const e = events.filter(function (x){ return x.scenarioId==='ch1:pair' && x.trialId===p.trialId && x.phase!=='practice'; }).pop();
      return e ? { trialId:p.trialId, pHigh:p.pHigh, choice:e.action } : null;
    }).filter(Boolean);
    if (!picks.length) return { available:false };
    const wideCount = picks.filter(function (p){ return p.choice==='wide'; }).length;
    // Monotonic = once the wide contract is chosen, it stays chosen as its odds improve
    let monotonic = true, seenWide = false, switchAt = null;
    picks.forEach(function (p) {
      if (p.choice === 'wide') { if (!seenWide) switchAt = p.pHigh; seenWide = true; }
      else if (seenWide) monotonic = false;
    });
    return { available:true, n:picks.length, wideCount:wideCount,
             monotonic:monotonic, switchAt: monotonic ? switchAt : null };
  }

  // ── Chapter 9: project review ────────────────────────────────────
  const NAMES = ['Harbour Market','North Depot','Hill Terraces','River Mill',
                 'Old Quarter','Canal Works','East Lights','Stone Bridge'];

  // Matched trials: both holdings have the SAME current value and the SAME
  // forward prospect. Only the purchase price differs, so a systematic
  // preference can only reflect past gain or loss.
  const MATCHED = [
    { current:200, forward:0.05, gainBuy:150, lossBuy:260, need:200 },
    { current:320, forward:0.03, gainBuy:240, lossBuy:410, need:320 },
    { current:150, forward:0.06, gainBuy:110, lossBuy:190, need:150 }
  ];
  // Prospects trial: forward prospects genuinely differ, and purchase
  // history points the OTHER way (weaker prospect stands at a gain).
  const PROSPECTS = { current:250, weakForward:-0.06, strongForward:0.08,
                      weakBuy:180, strongBuy:320, need:250 };

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length-1; i > 0; i--) {
      const j = Math.floor(rng()*(i+1)); const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function ch9Trials(seedStr) {
    const rng = Sim.makeRng(Sim.seedFromString(String(seedStr) + '|ch9'));
    const names = shuffle(NAMES, rng);
    let k = 0;
    const trials = MATCHED.map(function (m, i) {
      const gain = { id:'m'+i+'g', name:names[k++], purchase:m.gainBuy, current:m.current, forward:m.forward, fee:2 };
      const loss = { id:'m'+i+'l', name:names[k++], purchase:m.lossBuy, current:m.current, forward:m.forward, fee:2 };
      return { trialId:'review'+(i+1), type:'matched', need:m.need, projects: shuffle([gain, loss], rng) };
    });
    const weak   = { id:'pw', name:names[k++], purchase:PROSPECTS.weakBuy,   current:PROSPECTS.current, forward:PROSPECTS.weakForward,   fee:2 };
    const strong = { id:'ps', name:names[k++], purchase:PROSPECTS.strongBuy, current:PROSPECTS.current, forward:PROSPECTS.strongForward, fee:2 };
    trials.push({ trialId:'review4', type:'prospects', need:PROSPECTS.need, projects: shuffle([weak, strong], rng) });
    // Presentation order of trials is also rotated
    return shuffle(trials, rng);
  }

  function resolveCh9(trial, soldId, extra) {
    const sold  = trial.projects.filter(function (p){ return p.id===soldId; })[0];
    const other = trial.projects.filter(function (p){ return p.id!==soldId; })[0];
    if (!sold || !other) throw new Error('unknown project ' + soldId);
    const base = Object.assign({ trialId:trial.trialId, projectId:soldId,
      soldName:sold.name, phase:'baseline' }, extra || {});
    if (trial.type === 'matched') {
      return Object.assign(base, { scenarioId:'ch9:review',
        action: sold.purchase < sold.current ? 'sell_winner' : 'sell_loser' });
    }
    return Object.assign(base, { scenarioId:'ch9:prospects',
      action: sold.forward < other.forward ? 'sell_weaker' : 'sell_stronger' });
  }

  // Counts across matched trials only — the prospects trial is confounded
  // by design and never enters this count.
  function disposition(events) {
    const m = events.filter(function (e){ return e.scenarioId==='ch9:review' && e.phase!=='practice'; });
    if (!m.length) return { available:false };
    return { available:true, n:m.length,
      soldGain: m.filter(function (e){ return e.action==='sell_winner'; }).length,
      soldLoss: m.filter(function (e){ return e.action==='sell_loser'; }).length };
  }

  // ── Chapter 10: forecasts ────────────────────────────────────────
  // Resolved by the seeded simulation's next-year return for a district.
  // modelP is the probability implied by the declared model, reported
  // separately from accuracy.
  function normCdf(z) {
    const t = 1/(1+0.2316419*Math.abs(z));
    const d = 0.3989423*Math.exp(-z*z/2);
    const p = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
    return z > 0 ? 1-p : p;
  }
  function modelPUp(districtId) {
    const d = Sim.DISTRICTS[districtId];
    return normCdf(d.mean / d.sd);
  }
  const FORECASTS = [
    { id:'f1', district:'technology', at:'ch2' },
    { id:'f2', district:'housing',    at:'ch4' },
    { id:'f3', district:'energy',     at:'ch6' },
    { id:'f4', district:'transport',  at:'ch8' }
  ];
  function forecastText(f, lang) {
    const n = Sim.DISTRICTS[f.district].label;
    const de = { Housing:'Wohnen', Transport:'Verkehr', Technology:'Technologie', Energy:'Energie' }[n];
    return lang === 'de'
      ? 'Wie wahrscheinlich ist es, dass der Stadtteil ' + de + ' das nächste Jahr höher beendet, als er es beginnt?'
      : 'How likely is it that the ' + n + ' district ends next year higher than it starts?';
  }
  // p is clamped to [0,1] and rounded to the 10% steps the slider offers.
  function forecastEvent(f, p, yearReturns) {
    const pp = Math.round(Math.max(0, Math.min(1, p))*10)/10;
    const r = yearReturns ? yearReturns[f.district] : undefined;
    return { scenarioId:'ch10:forecast', trialId:f.id, action:'forecast', p:pp,
             outcome: (typeof r === 'number') ? (r > 0 ? 1 : 0) : undefined,
             modelP: Math.round(modelPUp(f.district)*1000)/1000, phase:'baseline' };
  }
  function modelGap(events) {
    const f = events.filter(function (e){ return e.action==='forecast' && typeof e.modelP==='number' && typeof e.p==='number'; });
    if (!f.length) return { available:false };
    const g = f.reduce(function (s,e){ return s + Math.abs(e.p - e.modelP); }, 0) / f.length;
    return { available:true, n:f.length, meanGap: Math.round(g*1000)/1000 };
  }

  // ── Post-feedback practice ───────────────────────────────────────
  // One new, equivalent decision chosen from a pattern that was actually
  // observed. Tagged phase:'practice' so it can never enter the profile.
  function practiceTrial(summary) {
    const c = summary && summary.concentration;
    if (c && c.available && c.largestShare >= 0.5) {
      return { kind:'allocation', scenarioId:'ch3:allocate', phase:'practice', units:6,
               baseline:{ largestShare:c.largestShare } };
    }
    const hasNews = summary && summary.patterns && summary.patterns.some(function (p){
      return p.dimension==='response_to_social_cues' && p.coverage!=='insufficient'; });
    if (hasNews) return { kind:'headline', scenarioId:'ch7:news', phase:'practice' };
    return { kind:'contract', scenarioId:'ch1:pair', phase:'practice', trialId:'pair2' };
  }

  // Did the explanation carry over to the new task? One attempt cannot
  // show durable change, and the result says so.
  function transfer(practice, practiceEvents) {
    if (practice.kind === 'allocation') {
      const placed = practiceEvents.filter(function (e){ return e.scenarioId==='ch3:allocate' && e.districtId; });
      if (!placed.length) return { available:false };
      const counts = {};
      placed.forEach(function (e){ counts[e.districtId]=(counts[e.districtId]||0)+1; });
      const largest = Math.max.apply(null, Object.keys(counts).map(function (k){ return counts[k]; })) / placed.length;
      return { available:true, kind:'allocation',
               before:practice.baseline.largestShare, after:largest,
               changed: Math.abs(largest - practice.baseline.largestShare) > 1e-9 };
    }
    const e = practiceEvents.filter(function (x){ return x.scenarioId===practice.scenarioId; }).pop();
    return e ? { available:true, kind:practice.kind, action:e.action } : { available:false };
  }

  root.Chapters = {
    COST:COST, CH1_PAIRS:CH1_PAIRS, expected:expected, spread:spread, dominates:dominates,
    riskPairs:riskPairs, MATCHED:MATCHED, PROSPECTS:PROSPECTS, ch9Trials:ch9Trials,
    resolveCh9:resolveCh9, disposition:disposition, FORECASTS:FORECASTS,
    forecastText:forecastText, forecastEvent:forecastEvent, modelPUp:modelPUp,
    modelGap:modelGap, practiceTrial:practiceTrial, transfer:transfer
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}),
   typeof module !== 'undefined' && module.exports ? require('./Sim.js').Sim : window.WS.Sim);
