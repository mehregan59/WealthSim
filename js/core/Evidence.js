/* WealthSim — evidence layer.
 *
 * Pure functions. No Phaser, no DOM. Takes an immutable list of decision
 * events and returns observations plus coverage labels.
 *
 * Three rules this module exists to enforce:
 *   1. An action that is offered must be explicitly declared here. Unknown
 *      actions become UNSUPPORTED evidence, never a neutral score.
 *   2. Absent data is 'insufficient', never a fabricated average.
 *   3. Accessing information is recorded separately from the decision that
 *      followed it. Opening a report is not itself learning.
 */
(function (root) {
  'use strict';

  // ── Dimensions ────────────────────────────────────────────────────
  // Descriptive names. No 'greed', no 'resilience' — those assert motives
  // the game does not measure.
  const DIM = {
    RISK:         'risk_choices',
    SETBACK:      'response_to_setbacks',
    CONCENTRATION:'allocation_concentration',
    TIMING:       'timing_choices',
    MOMENTUM:     'response_to_rising_prices',
    EVIDENCE:     'evidence_use',
    SOCIAL:       'response_to_social_cues',
    DOWNTURN:     'response_during_downturns',
    OFFER:        'response_to_outside_offers',
    REVIEW:       'response_to_past_gains_and_losses',
    PROSPECTS:    'use_of_forward_prospects'
  };
  // Note: EVIDENCE has no actions mapped to it. Evidence use is reported
  // only from report access, comprehension and revision (see evidenceUse),
  // never inferred from which option a player picked.

  // ── Action registry ───────────────────────────────────────────────
  // Every offered action in the game. `note` is the factual description
  // used in feedback. `defensible: true` means the action can be correct
  // in some context and must never be reported as an error.
  const ACTIONS = {
    'ch1:contract': {
      safe:        { dim:DIM.RISK, level:'lower_variance',  note:'chose the lower-variance contract', noteDE:'hast den Vertrag mit geringerer Schwankung gewählt' },
      balanced:    { dim:DIM.RISK, level:'middle_variance', note:'chose the middle-variance contract', noteDE:'hast den Vertrag mit mittlerer Schwankung gewählt' },
      aggressive:  { dim:DIM.RISK, level:'higher_variance', note:'chose the higher-variance contract', noteDE:'hast den Vertrag mit höherer Schwankung gewählt' }
    },
    // Chapter 1 contract ladder. Levels deliberately match the district
    // choice above so the same preference reads as one repeated pattern.
    'ch1:pair': {
      narrow: { dim:DIM.RISK, level:'lower_variance',  note:'chose the narrower-range contract', noteDE:'hast den Vertrag mit engerer Spanne gewählt' },
      wide:   { dim:DIM.RISK, level:'higher_variance', note:'chose the wider-range contract',   noteDE:'hast den Vertrag mit breiterer Spanne gewählt' }
    },
    'ch2:setback': {
      cancel:      { dim:DIM.SETBACK, level:'exited',      note:'ended the project after the fall', noteDE:'hast das Projekt nach dem Rückgang beendet' },
      continue:    { dim:DIM.SETBACK, level:'held',        note:'continued the project unchanged', noteDE:'hast das Projekt unverändert fortgesetzt' },
      invest_more: { dim:DIM.SETBACK, level:'added',       note:'committed further resources after the fall', noteDE:'hast nach dem Rückgang weitere Mittel eingesetzt' },
      wait:        { dim:DIM.SETBACK, level:'paused',      note:'paused work and deferred the decision', noteDE:'hast die Arbeit pausiert und die Entscheidung vertagt' }
    },
    'ch3:allocate': {
      allocate:    { dim:DIM.CONCENTRATION, level:'placed', note:'placed a unit of funding', noteDE:'hast eine Mitteleinheit platziert' }
    },
    'ch4:timing': {
      festival:    { dim:DIM.TIMING, level:'near_term', note:'took the near-term benefit', noteDE:'hast den kurzfristigen Nutzen gewählt' },
      university:  { dim:DIM.TIMING, level:'deferred',  note:'took the deferred benefit', noteDE:'hast den späteren Nutzen gewählt' },
      repair:      { dim:DIM.TIMING, level:'obligation',note:'funded a due obligation', noteDE:'hast eine fällige Verpflichtung finanziert',
                     excludeFromPattern:true,
                     why:'Meeting a required repair is a constraint, not a timing preference.', whyDE:'Eine notwendige Reparatur zu bezahlen ist eine Einschränkung, keine Zeitpräferenz.' }
    },
    'ch5:boom': {
      all_in:      { dim:DIM.MOMENTUM, level:'increased_max', note:'moved all holdings into the rising district', noteDE:'hast alle Mittel in den steigenden Stadtteil verlagert' },
      invest_more: { dim:DIM.MOMENTUM, level:'increased',     note:'increased exposure to the rising district', noteDE:'hast den Anteil am steigenden Stadtteil erhöht' },
      // 'increase' kept as alias so older recorded events still resolve
      increase:    { dim:DIM.MOMENTUM, level:'increased',     note:'increased exposure to the rising district', noteDE:'hast den Anteil am steigenden Stadtteil erhöht' },
      hold:        { dim:DIM.MOMENTUM, level:'unchanged',     note:'left the allocation unchanged', noteDE:'hast die Aufteilung unverändert gelassen' },
      reduce:      { dim:DIM.MOMENTUM, level:'decreased',     note:'reduced exposure to the rising district', noteDE:'hast den Anteil am steigenden Stadtteil verringert' }
    },
    'ch6:delegation': {
      accept:      { dim:DIM.OFFER, level:'accepted_offer',  note:'accepted the shared arrangement', noteDE:'hast die gemeinsame Vereinbarung angenommen' },
      build:       { dim:DIM.OFFER, level:'built_own',       note:'built independently at higher cost', noteDE:'hast zu höheren Kosten selbst gebaut' },
      // 'independent' kept as alias so older recorded events still resolve
      independent: { dim:DIM.OFFER, level:'built_own',       note:'built independently at higher cost', noteDE:'hast zu höheren Kosten selbst gebaut' },
      decline:     { dim:DIM.OFFER, level:'declined_both',   note:'declined both options', noteDE:'hast beide Optionen abgelehnt' }
    },
    // scenarioId matches GameScene.js: 'ch7:headlines'
    'ch7:headlines': {
      sell:        { dim:DIM.SOCIAL, level:'exited',    note:'sold after the headline', noteDE:'hast nach der Schlagzeile verkauft' },
      reduce:      { dim:DIM.SOCIAL, level:'reduced',   note:'reduced exposure after the headline', noteDE:'hast den Anteil nach der Schlagzeile verringert' },
      hold:        { dim:DIM.SOCIAL, level:'unchanged', note:'left the position unchanged after the headline', noteDE:'hast die Position nach der Schlagzeile unverändert gelassen' },
      invest_more: { dim:DIM.SOCIAL, level:'increased', note:'increased exposure against the headline', noteDE:'hast den Anteil entgegen der Schlagzeile erhöht' }
    },
    // Legacy alias — any event recorded before the rename still resolves
    'ch7:news': {
      sell:        { dim:DIM.SOCIAL, level:'exited',    note:'sold after the headline', noteDE:'hast nach der Schlagzeile verkauft' },
      reduce:      { dim:DIM.SOCIAL, level:'reduced',   note:'reduced exposure after the headline', noteDE:'hast den Anteil nach der Schlagzeile verringert' },
      hold:        { dim:DIM.SOCIAL, level:'unchanged', note:'left the position unchanged after the headline', noteDE:'hast die Position nach der Schlagzeile unverändert gelassen' },
      invest_more: { dim:DIM.SOCIAL, level:'increased', note:'increased exposure against the headline', noteDE:'hast den Anteil entgegen der Schlagzeile erhöht' }
    },
    'ch8:storm': {
      sell_all:    { dim:DIM.DOWNTURN, level:'liquidated',  note:'liquidated holdings during the downturn', noteDE:'hast im Abschwung alle Anteile verkauft' },
      hold:        { dim:DIM.DOWNTURN, level:'unchanged',   note:'held the plan through the downturn', noteDE:'hast den Plan im Abschwung beibehalten' },
      rebalance:   { dim:DIM.DOWNTURN, level:'rebalanced',  note:'rebalanced during the downturn', noteDE:'hast im Abschwung neu gewichtet' },
      invest_low:  { dim:DIM.DOWNTURN, level:'added',       note:'added holdings during the downturn', noteDE:'hast im Abschwung Anteile hinzugekauft' },
      protect:     { dim:DIM.DOWNTURN, level:'protected',   note:'moved to protective assets during the downturn', noteDE:'hast im Abschwung in sichere Anlagen gewechselt' },
      // 'opportunistic' kept as alias so older recorded events still resolve
      opportunistic: { dim:DIM.DOWNTURN, level:'added',     note:'added holdings during the downturn', noteDE:'hast im Abschwung Anteile hinzugekauft' },
      meet_reserve:{ dim:DIM.DOWNTURN, level:'obligation',  note:'sold to meet a stated reserve requirement', noteDE:'hast verkauft, um eine festgelegte Reserve zu erfüllen',
                     excludeFromPattern:true,
                     why:'Selling to meet a stated obligation is a constraint, not a downturn reaction.', whyDE:'Zu verkaufen, um eine festgelegte Verpflichtung zu erfüllen, ist eine Einschränkung, keine Reaktion auf den Abschwung.' }
    },
    // Chapter 9 matched trials — purchase price is the only difference between
    // the two holdings; forward prospects are identical. scenarioId matches
    // Chapters.js resolveCh9: 'ch9:matched_gain_loss'.
    'ch9:matched_gain_loss': {
      sell_winner: { dim:DIM.REVIEW, level:'sold_gain', note:'sold a holding standing at a gain', noteDE:'hast eine Position im Gewinn verkauft' },
      sell_loser:  { dim:DIM.REVIEW, level:'sold_loss', note:'sold a holding standing at a loss', noteDE:'hast eine Position im Verlust verkauft' },
      hold_both:   { dim:DIM.REVIEW, level:'held_both', note:'held both holdings', noteDE:'hast beide Positionen behalten' }
    },
    // Legacy alias for any events stored before the rename
    'ch9:review': {
      sell_winner: { dim:DIM.REVIEW, level:'sold_gain', note:'sold a holding standing at a gain', noteDE:'hast eine Position im Gewinn verkauft' },
      sell_loser:  { dim:DIM.REVIEW, level:'sold_loss', note:'sold a holding standing at a loss', noteDE:'hast eine Position im Verlust verkauft' },
      hold_both:   { dim:DIM.REVIEW, level:'held_both', note:'held both holdings', noteDE:'hast beide Positionen behalten' }
    },
    // Chapter 9 prospects trial — forward prospects differ, so disposition
    // cannot be inferred; this trial is excluded from the gain/loss count.
    // scenarioId matches Chapters.js resolveCh9: 'ch9:prospects_differ'.
    'ch9:prospects_differ': {
      sell_weaker:   { dim:DIM.PROSPECTS, level:'sold_weaker',   note:'sold the holding with the weaker outlook', noteDE:'hast die Position mit den schwächeren Aussichten verkauft' },
      sell_stronger: { dim:DIM.PROSPECTS, level:'sold_stronger', note:'sold the holding with the stronger outlook', noteDE:'hast die Position mit den besseren Aussichten verkauft' }
    },
    // Legacy alias for any events stored before the rename
    'ch9:prospects': {
      sell_weaker:   { dim:DIM.PROSPECTS, level:'sold_weaker',   note:'sold the holding with the weaker outlook', noteDE:'hast die Position mit den schwächeren Aussichten verkauft' },
      sell_stronger: { dim:DIM.PROSPECTS, level:'sold_stronger', note:'sold the holding with the stronger outlook', noteDE:'hast die Position mit den besseren Aussichten verkauft' }
    }
  };

  // Non-decision event types, recorded but never scored as a choice.
  const META_ACTIONS = ['research', 'forecast', 'rationale', 'comprehension'];

  function lookup(scenarioId, action) {
    const table = ACTIONS[scenarioId];
    if (!table) return null;
    return table[action] || null;
  }

  // ── Observation extraction ────────────────────────────────────────
  // One trial yields at most one decision observation. Repeated clicks and
  // repeated report opens on the same trial collapse to one.
  function observations(events) {
    const seen = new Set();
    const out = [];
    const unsupported = [];

    events.forEach(function (e) {
      if (META_ACTIONS.indexOf(e.action) !== -1) return;
      const key = e.scenarioId + '|' + e.trialId;
      // ch3 records one event per cube, each its own trial
      if (seen.has(key)) return;
      seen.add(key);

      const spec = lookup(e.scenarioId, e.action);
      if (!spec) {
        unsupported.push({ scenarioId:e.scenarioId, trialId:e.trialId, action:e.action });
        return;
      }
      out.push({
        eventId: e.eventId,
        scenarioId: e.scenarioId,
        trialId: e.trialId,
        phase: e.phase || 'baseline',
        dim: spec.dim,
        level: spec.level,
        note: spec.note,
        noteDE: spec.noteDE || null,
        whyDE: spec.whyDE || null,
        excluded: !!spec.excludeFromPattern,
        why: spec.why || null,
        afterEvidence: !!e.afterEvidence,
        districtId: e.districtId || null
      });
    });

    return { observations: out, unsupported: unsupported };
  }

  // ── Coverage ──────────────────────────────────────────────────────
  // An evidence-coverage label, explicitly NOT a statistical confidence
  // level. Three eligible observations is a product rule, not a validated
  // reliability threshold.
  const MIN_PATTERN = 3;

  function coverage(obs, dim) {
    const eligible = obs.filter(function (o) {
      return o.dim === dim && !o.excluded && o.phase === 'baseline';
    });
    if (eligible.length === 0) return { label:'insufficient', n:0, levels:[] };

    const levels = eligible.map(function (o) { return o.level; });
    const distinct = levels.filter(function (v,i){ return levels.indexOf(v)===i; });

    if (eligible.length === 1) return { label:'single', n:1, levels:distinct };
    if (distinct.length > 1)   return { label:'mixed',  n:eligible.length, levels:distinct };
    if (eligible.length >= MIN_PATTERN)
      return { label:'repeated', n:eligible.length, levels:distinct };
    return { label:'limited', n:eligible.length, levels:distinct };
  }

  // ── Concentration ─────────────────────────────────────────────────
  // Reports actual shares and HHI. Normalises against what is FEASIBLE
  // with the given number of indivisible units, not against an ideal that
  // cannot be reached.
  function concentration(events, unitCount, districtCount) {
    const placed = events.filter(function (e) {
      return e.scenarioId === 'ch3:allocate' && e.districtId;
    });
    if (!placed.length) return { available:false };

    const counts = {};
    placed.forEach(function (e) { counts[e.districtId] = (counts[e.districtId]||0) + 1; });
    const vals = Object.keys(counts).map(function (k){ return counts[k]; });
    const total = vals.reduce(function (a,b){ return a+b; }, 0);
    const shares = {};
    Object.keys(counts).forEach(function (k){ shares[k] = counts[k]/total; });
    const hhi = vals.reduce(function (s,v){ return s + Math.pow(v/total,2); }, 0);

    const n = unitCount || total;
    const d = districtCount || 4;
    const base = Math.floor(n/d), rem = n % d;
    const evenest = [];
    for (var i=0;i<d;i++) evenest.push(base + (i<rem ? 1 : 0));
    const bestHHI  = evenest.reduce(function (s,v){ return s + Math.pow(v/n,2); }, 0);
    const worstHHI = 1;
    const spread = worstHHI === bestHHI ? 0
      : (worstHHI - hhi) / (worstHHI - bestHHI) * 100;

    const largest = Math.max.apply(null, vals);
    return {
      available: true,
      counts: counts,
      shares: shares,
      districtsUsed: vals.length,
      districtCount: d,
      hhi: hhi,
      evenestFeasible: evenest,
      bestAchievableHHI: bestHHI,
      spreadVsFeasible: Math.round(spread*100)/100,
      largestShare: largest/total,
      // Factual, non-evaluative description
      note: 'placed ' + total + ' units across ' + vals.length + ' of ' + d +
            ' districts; largest single share ' + Math.round(largest/total*100) + '%'
    };
  }

  // ── Evidence use ──────────────────────────────────────────────────
  // Report access, comprehension and belief revision are tracked
  // separately. Opening a report never by itself counts as learning.
  function evidenceUse(events) {
    const opens = events.filter(function (e){ return e.action === 'research'; });
    const trials = {};
    opens.forEach(function (e){ trials[e.scenarioId+'|'+e.trialId] = true; });
    const distinctTrials = Object.keys(trials).length;

    const checks = events.filter(function (e){ return e.action === 'comprehension'; });
    const passed = checks.filter(function (e){ return e.correct === true; }).length;

    const revisions = events.filter(function (e) {
      return e.action === 'forecast' && e.revisedAfterEvidence === true;
    });
    const informative   = revisions.filter(function (e){ return e.evidenceInformative === true; }).length;
    const uninformative = revisions.filter(function (e){ return e.evidenceInformative === false; }).length;

    // Scenarios where an optional report was on offer and a decision was made.
    // 'ch7:headlines' is the canonical form; 'ch7:news' is kept for legacy events.
    const OFFERED = ['ch2:setback','ch5:boom','ch6:delegation','ch7:headlines','ch7:news'];
    const offeredIn = {};
    events.forEach(function (e) {
      if (OFFERED.indexOf(e.scenarioId) !== -1 && META_ACTIONS.indexOf(e.action) === -1)
        offeredIn[e.scenarioId] = true;
    });

    return {
      reportsOpened: distinctTrials,
      reportsOffered: Object.keys(offeredIn).length,
      rawOpens: opens.length,
      comprehensionChecked: checks.length,
      comprehensionPassed: passed,
      revisedAfterInformative: informative,
      revisedAfterUninformative: uninformative,
      // The only claim supportable from opens alone
      note: distinctTrials === 0
        ? 'did not open any of the optional reports'
        : 'opened optional reports in ' + distinctTrials + ' scenario' + (distinctTrials===1?'':'s')
    };
  }

  // ── Brier ─────────────────────────────────────────────────────────
  // Forecast accuracy on resolved binary events. Explicitly not calibration.
  function brier(events) {
    const f = events.filter(function (e) {
      return e.action === 'forecast' &&
             typeof e.p === 'number' &&
             (e.outcome === 0 || e.outcome === 1);
    });
    if (!f.length) return { available:false, n:0 };
    const score = f.reduce(function (s,e){ return s + Math.pow(e.p - e.outcome, 2); }, 0) / f.length;
    return {
      available: true,
      n: f.length,
      brier: Math.round(score*10000)/10000,
      label: 'forecast accuracy',
      caveat: f.length < 10
        ? 'Too few forecasts to describe a stable tendency.'
        : 'Descriptive for this session only.'
    };
  }

  // ── Stated preference vs observed behaviour ───────────────────────
  // Shown side by side. Disagreement is reported as a difference in
  // context, never as dishonesty or as a single blended number.
  function statedVsObserved(stated, obs) {
    const pairs = [];
    // A stated answer with no clear direction (e.g. "moderate") is not
    // compared at all — treating it as disagreement would be unfair.
    function add(label, statedVal, dim, map) {
      const eligible = obs.filter(function (o){ return o.dim===dim && !o.excluded && o.phase==='baseline'; });
      if (!statedVal || !eligible.length) return;
      if (!(statedVal in map)) return;
      const expected = map[statedVal];
      if (expected === null) {
        pairs.push({ label:label, stated:statedVal,
          observed: eligible.map(function (o){ return o.level; }),
          agrees: null });
        return;
      }
      pairs.push({
        label: label, stated: statedVal,
        observed: eligible.map(function (o){ return o.level; }),
        agrees: eligible.every(function (o){ return expected === o.level; })
      });
    }
    add('Opening preference on protecting funds', stated.q0, DIM.RISK,
        { safe:'lower_variance', balanced:'middle_variance', aggressive:'higher_variance' });
    add('Opening preference on waiting', stated.q1, DIM.TIMING,
        { impatient:'near_term', moderate:null, patient:'deferred' });
    return pairs;
  }

  root.Evidence = {
    DIM: DIM,
    ACTIONS: ACTIONS,
    MIN_PATTERN: MIN_PATTERN,
    lookup: lookup,
    observations: observations,
    coverage: coverage,
    concentration: concentration,
    evidenceUse: evidenceUse,
    brier: brier,
    statedVsObserved: statedVsObserved
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}));
