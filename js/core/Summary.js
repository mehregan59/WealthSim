/* WealthSim — summary layer.
 *
 * Turns evidence into sentences. Every sentence comes from a template that
 * requires specific evidence to exist. If the evidence is missing, the
 * sentence is not produced — there is no fallback prose and no default type.
 */
(function (root, Evidence) {
  'use strict';
  const E = Evidence;

  const LABEL = {
    risk_choices:              'Risk choices',
    response_to_setbacks:      'Response to setbacks',
    allocation_concentration:  'Allocation concentration',
    timing_choices:            'Timing choices',
    response_to_rising_prices: 'Response to rising prices',
    evidence_use:              'Use of available information',
    response_to_social_cues:   'Response to social cues',
    response_during_downturns: 'Response during downturns'
  };

  const COVERAGE_TEXT = {
    insufficient: 'Not enough evidence in this session to describe.',
    single:       'Based on one decision only.',
    limited:      'Based on two decisions.',
    repeated:     'A repeated pattern across this session.',
    mixed:        'Mixed — the choices differed by situation.'
  };

  function build(events, stated, meta) {
    stated = stated || {}; meta = meta || {};
    const parsed = E.observations(events);
    const obs = parsed.observations;

    const did = obs.filter(function (o) { return o.phase === 'baseline'; })
      .map(function (o) {
        return { scenario:o.scenarioId, text:'You ' + o.note + '.',
                 constraint:o.excluded ? o.why : null };
      });

    const conc = E.concentration(events, meta.units || 6, meta.districts || 4);
    if (conc.available) did.push({ scenario:'ch3:allocate', text:'You ' + conc.note + '.', constraint:null });

    const use = E.evidenceUse(events);
    did.push({ scenario:'information', text:'You ' + use.note + '.', constraint:null });

    const patterns = Object.keys(LABEL).map(function (dim) {
      const c = E.coverage(obs, dim);
      return { dimension:dim, label:LABEL[dim], coverage:c.label,
               n:c.n, levels:c.levels, text:COVERAGE_TEXT[c.label] };
    });

    // Interpretation only where coverage supports it, always with an
    // alternative explanation offered.
    const readings = [];
    patterns.forEach(function (p) {
      if (p.coverage === 'insufficient') return;
      if (p.coverage === 'mixed') {
        readings.push({ dimension:p.dimension,
          claim:'Your ' + p.label.toLowerCase() + ' varied between situations.',
          alternative:'Different circumstances can reasonably call for different choices; this is not inconsistency by itself.' });
        return;
      }
      if (p.coverage === 'single') {
        readings.push({ dimension:p.dimension,
          claim:'One decision was recorded here.',
          alternative:'A single choice cannot show a tendency. It may not repeat.' });
        return;
      }
      readings.push({ dimension:p.dimension,
        claim:'You made the same kind of choice on ' + p.n + ' occasions.',
        alternative:'This describes these scenarios only and does not establish a lasting trait.' });
    });

    if (conc.available && conc.largestShare >= 0.5) {
      readings.push({ dimension:'allocation_concentration',
        claim:'Half or more of your funding went to a single district.',
        alternative:'Concentration is not automatically an error — it may reflect a considered view. It does mean a shock to that district affects you proportionally more.' });
    }

    const comparison = E.statedVsObserved(stated, obs).map(function (p) {
      return { label:p.label, stated:p.stated, observed:p.observed, agrees:p.agrees,
        note: p.agrees
          ? 'Your stated preference and your choices pointed the same way here.'
          : 'Your stated preference and your choices differed here. People often answer about general intentions and then respond to the specifics in front of them. This is not dishonesty.' };
    });

    const forecast = E.brier(events);

    const next = [];
    if (conc.available && conc.largestShare >= 0.5) {
      next.push('Compare how a single-district shock would change your funds at your actual shares versus a more even spread. The relationship is proportional to exposure.');
    }
    if (use.reportsOpened === 0) {
      next.push('Optional reports were available and unopened. Next time, try reading one before deciding and notice whether it changes your view.');
    }
    if (use.revisedAfterUninformative > use.revisedAfterInformative) {
      next.push('You changed your plan more often after weakly supported news than after substantive updates. Comparing the two side by side is a useful habit.');
    }

    return {
      did:did, patterns:patterns, readings:readings, comparison:comparison,
      concentration:conc, evidenceUse:use, forecast:forecast,
      nextSteps:next, unsupported:parsed.unsupported,
      disclaimer:'This is a summary of one session of play. It is an educational description of decisions made in a fictional scenario, not a validated psychological assessment and not financial advice.'
    };
  }

  // Optional secondary label. Returns unavailable unless the evidence
  // genuinely qualifies — there is no fallback type and no catch-all.
  function optionalLabel(summary) {
    const c = summary.concentration, u = summary.evidenceUse;
    const byDim = {};
    summary.patterns.forEach(function (p) { byDim[p.dimension] = p; });
    const strong = Object.keys(byDim).filter(function (d) {
      return byDim[d] && byDim[d].coverage === 'repeated';
    });
    if (strong.length < 3) {
      return { available:false,
               reason:'Not enough repeated observations in this session to describe an overall style.' };
    }
    const traits = [];
    if (c.available && c.spreadVsFeasible >= 70) traits.push('spread funding widely');
    if (c.available && c.spreadVsFeasible <= 30) traits.push('concentrated funding');
    if (u.reportsOpened >= 2) traits.push('consulted available reports');
    if (u.revisedAfterInformative > 0 && u.revisedAfterUninformative === 0)
      traits.push('revised plans after substantive evidence only');
    if (!traits.length) return { available:false, reason:'No descriptor was supported by the evidence.' };
    return { available:true, traits:traits, note:'Descriptive of this session only.' };
  }

  root.Summary = { build:build, optionalLabel:optionalLabel, LABEL:LABEL };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}),
   typeof module !== 'undefined' && module.exports
     ? require('./Evidence.js').Evidence
     : window.WS.Evidence);
