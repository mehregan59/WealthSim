/* WealthSim — summary layer.
 *
 * Turns evidence into sentences. Every sentence comes from a template that
 * requires specific evidence to exist. If the evidence is missing, the
 * sentence is not produced — there is no fallback prose and no default type.
 *
 * English and German templates share identical keys, and a test asserts
 * this, so both languages always carry the same substance.
 */
(function (root, Evidence, Chapters) {
  'use strict';
  const E = Evidence, C = Chapters;

  const T = {
    en: {
      label: {
        risk_choices:'Risk choices',
        response_to_setbacks:'Response to setbacks',
        allocation_concentration:'Allocation concentration',
        timing_choices:'Timing choices',
        response_to_rising_prices:'Response to rising prices',
        response_to_social_cues:'Response to social cues',
        response_during_downturns:'Response during downturns',
        response_to_outside_offers:'Response to an outside offer',
        response_to_past_gains_and_losses:'Response to past gains and losses',
        use_of_forward_prospects:'Use of forward prospects'
      },
      coverage: {
        insufficient:'Not enough evidence in this session to describe.',
        single:'Based on one decision only.',
        limited:'Based on two decisions.',
        repeated:'A repeated pattern across this session.',
        mixed:'Mixed — the choices differed by situation.'
      },
      you: function (note) { return 'You ' + note + '.'; },
      alloc: function (total, used, d, pct) {
        return 'You placed ' + total + ' units across ' + used + ' of ' + d +
               ' districts; your largest single share was ' + pct + '%.';
      },
      reports: function (opened, offered) {
        if (!offered) return opened ? 'You opened ' + opened + ' optional report' + (opened===1?'':'s') + '.'
                                    : 'You did not open any optional reports.';
        return 'You opened ' + opened + ' of ' + offered + ' optional reports that were offered.';
      },
      mixedClaim: function (label) { return 'Your ' + label.toLowerCase() + ' varied between situations.'; },
      mixedAlt: 'Different circumstances can reasonably call for different choices; this is not inconsistency by itself.',
      singleClaim: 'One decision was recorded here.',
      singleAlt: 'A single choice cannot show a tendency. It may not repeat.',
      repeatClaim: function (n) { return 'You made the same kind of choice on ' + n + ' occasions.'; },
      repeatAlt: 'This describes these scenarios only and does not establish a lasting trait.',
      concClaim: 'Half or more of your funding went to a single district.',
      concAlt: 'Concentration is not automatically an error — it may reflect a considered view. It does mean a shock to that district affects you proportionally more.',
      cmpLabel: { q0:'Opening preference on protecting funds', q1:'Opening preference on waiting' },
      cmpNone: 'Your stated answer did not point in a clear direction, so it is shown without comparison.',
      cmpAgree: 'Your stated preference and your choices pointed the same way here.',
      cmpDiffer: 'Your stated preference and your choices differed here. People often answer about general intentions and then respond to the specifics in front of them. This is not dishonesty.',
      nextConc: 'Compare how a single-district shock would change your funds at your actual shares versus a more even spread. The relationship is proportional to exposure.',
      nextReports: 'Optional reports were available and unopened. Next time, try reading one before deciding and notice whether it changes your view.',
      nextRevise: 'You changed your plan more often after weakly supported news than after substantive updates. Comparing the two side by side is a useful habit.',
      noLabel: 'Not enough repeated observations in this session to describe an overall style.',
      noTrait: 'No descriptor was supported by the evidence.',
      traitNote: 'Descriptive of this session only.',
      trait: { spread:'spread funding widely', concentrated:'concentrated funding',
               reports:'consulted available reports', revised:'revised plans after substantive evidence only' },
      pairs: function (wide, n, switchAt, mono) {
        let t = 'You chose the wider-range contract in ' + wide + ' of ' + n + ' contract pairs';
        if (mono && switchAt !== null) t += ', starting once its chance of the high outcome reached ' + Math.round(switchAt*100) + '%';
        else if (!mono) t += '; your choices did not follow a single switch point as the odds improved';
        return t + '.';
      },
      disp: function (n, g, l) {
        return 'In ' + n + ' reviews where both holdings had identical future prospects, you sold the one standing at a gain ' +
               g + ' time' + (g===1?'':'s') + ' and the one standing at a loss ' + l + ' time' + (l===1?'':'s') + '.';
      },
      fc: function (n, b) {
        return 'You made ' + n + ' forecast' + (n===1?'':'s') + '. Forecast accuracy (Brier score) was ' + b +
               ' — 0 is perfect, and always answering 50% would score 0.25. Too few forecasts to describe a stable tendency.';
      },
      gap: function (g) {
        return 'On average your estimates were ' + Math.round(g*100) + ' percentage points away from the probability implied by the game\u2019s own model.';
      },
      disclaimer: 'This is a summary of one session of play. It is an educational description of decisions made in a fictional scenario, not a validated psychological assessment and not financial advice.'
    },
    de: {
      label: {
        risk_choices:'Risikoentscheidungen',
        response_to_setbacks:'Reaktion auf Rückschläge',
        allocation_concentration:'Konzentration der Aufteilung',
        timing_choices:'Zeitliche Entscheidungen',
        response_to_rising_prices:'Reaktion auf steigende Werte',
        response_to_social_cues:'Reaktion auf öffentliche Signale',
        response_during_downturns:'Reaktion im Abschwung',
        response_to_outside_offers:'Reaktion auf ein Angebot von außen',
        response_to_past_gains_and_losses:'Reaktion auf frühere Gewinne und Verluste',
        use_of_forward_prospects:'Nutzung der Zukunftsaussichten'
      },
      coverage: {
        insufficient:'In dieser Sitzung zu wenig Daten für eine Beschreibung.',
        single:'Beruht auf nur einer Entscheidung.',
        limited:'Beruht auf zwei Entscheidungen.',
        repeated:'Ein wiederholtes Muster in dieser Sitzung.',
        mixed:'Gemischt — die Entscheidungen unterschieden sich je nach Lage.'
      },
      you: function (note) { return 'Du ' + note + '.'; },
      alloc: function (total, used, d, pct) {
        return 'Du hast ' + total + ' Einheiten auf ' + used + ' von ' + d +
               ' Stadtteilen verteilt; dein größter Einzelanteil lag bei ' + pct + ' %.';
      },
      reports: function (opened, offered) {
        if (!offered) return opened ? 'Du hast ' + opened + ' optionale' + (opened===1?'n Bericht':' Berichte') + ' geöffnet.'
                                    : 'Du hast keinen der optionalen Berichte geöffnet.';
        return 'Du hast ' + opened + ' von ' + offered + ' angebotenen optionalen Berichten geöffnet.';
      },
      mixedClaim: function (label) { return 'Deine ' + label + ' unterschied sich je nach Situation.'; },
      mixedAlt: 'Unterschiedliche Umstände können vernünftigerweise unterschiedliche Entscheidungen erfordern; das ist für sich genommen keine Inkonsequenz.',
      singleClaim: 'Hier wurde eine Entscheidung erfasst.',
      singleAlt: 'Eine einzelne Entscheidung zeigt keine Tendenz. Sie muss sich nicht wiederholen.',
      repeatClaim: function (n) { return 'Du hast bei ' + n + ' Gelegenheiten dieselbe Art von Entscheidung getroffen.'; },
      repeatAlt: 'Das beschreibt nur diese Szenarien und belegt keine dauerhafte Eigenschaft.',
      concClaim: 'Die Hälfte oder mehr deiner Mittel ging in einen einzigen Stadtteil.',
      concAlt: 'Konzentration ist nicht automatisch ein Fehler — sie kann eine überlegte Einschätzung sein. Sie bedeutet aber, dass ein Schock in diesem Stadtteil dich entsprechend stärker trifft.',
      cmpLabel: { q0:'Anfangsangabe zum Schutz der Mittel', q1:'Anfangsangabe zum Warten' },
      cmpNone: 'Deine Angabe zeigte in keine klare Richtung und wird daher ohne Vergleich gezeigt.',
      cmpAgree: 'Deine Angabe und deine Entscheidungen wiesen hier in dieselbe Richtung.',
      cmpDiffer: 'Deine Angabe und deine Entscheidungen unterschieden sich hier. Menschen antworten oft über allgemeine Absichten und reagieren dann auf die konkrete Lage. Das ist keine Unehrlichkeit.',
      nextConc: 'Vergleiche, wie ein Schock in einem Stadtteil deine Mittel bei deinen tatsächlichen Anteilen verändern würde, verglichen mit einer gleichmäßigeren Aufteilung. Der Zusammenhang ist proportional zum Anteil.',
      nextReports: 'Optionale Berichte waren verfügbar und blieben ungeöffnet. Lies beim nächsten Mal einen vor der Entscheidung und achte darauf, ob er deine Sicht verändert.',
      nextRevise: 'Du hast deinen Plan öfter nach schwach belegten Nachrichten geändert als nach substanziellen Neuigkeiten. Beides nebeneinander zu vergleichen ist eine nützliche Gewohnheit.',
      noLabel: 'In dieser Sitzung gibt es nicht genug wiederholte Beobachtungen für einen Gesamtstil.',
      noTrait: 'Keine Beschreibung wurde durch die Daten gestützt.',
      traitNote: 'Beschreibt nur diese Sitzung.',
      trait: { spread:'Mittel breit verteilt', concentrated:'Mittel konzentriert',
               reports:'verfügbare Berichte genutzt', revised:'Pläne nur nach substanziellen Belegen geändert' },
      pairs: function (wide, n, switchAt, mono) {
        let t = 'Du hast in ' + wide + ' von ' + n + ' Vertragspaaren den Vertrag mit breiterer Spanne gewählt';
        if (mono && switchAt !== null) t += ', ab dem Punkt, an dem seine Chance auf das hohe Ergebnis ' + Math.round(switchAt*100) + ' % erreichte';
        else if (!mono) t += '; deine Entscheidungen folgten keinem einzelnen Wechselpunkt, als sich die Chancen verbesserten';
        return t + '.';
      },
      disp: function (n, g, l) {
        return 'In ' + n + ' Überprüfungen, bei denen beide Positionen identische Zukunftsaussichten hatten, hast du die Position im Gewinn ' +
               g + '-mal und die Position im Verlust ' + l + '-mal verkauft.';
      },
      fc: function (n, b) {
        return 'Du hast ' + n + ' Prognose' + (n===1?'':'n') + ' abgegeben. Die Prognosegenauigkeit (Brier-Wert) lag bei ' + b +
               ' — 0 ist perfekt, und immer 50 % zu antworten ergäbe 0,25. Zu wenige Prognosen, um eine stabile Tendenz zu beschreiben.';
      },
      gap: function (g) {
        return 'Im Durchschnitt lagen deine Schätzungen ' + Math.round(g*100) + ' Prozentpunkte von der Wahrscheinlichkeit entfernt, die das Modell des Spiels selbst ergibt.';
      },
      disclaimer: 'Dies ist eine Zusammenfassung einer Spielsitzung. Sie beschreibt Entscheidungen in einem fiktiven Szenario zu Lernzwecken und ist weder eine validierte psychologische Messung noch eine Finanzberatung.'
    }
  };

  function build(events, stated, meta) {
    stated = stated || {}; meta = meta || {};
    const lang = meta.lang === 'de' ? 'de' : 'en';
    const L = T[lang];
    const parsed = E.observations(events);
    const obs = parsed.observations;

    // 1. What you did — cube placements are summarised once, not listed six times
    const did = obs
      .filter(function (o) {
        // Cube placements and matched reviews are summarised once below
        return o.phase === 'baseline' && o.scenarioId !== 'ch3:allocate' && o.scenarioId !== 'ch9:review';
      })
      .map(function (o) {
        const note = (lang === 'de' && o.noteDE) ? o.noteDE : o.note;
        const why  = o.excluded ? ((lang === 'de' && o.whyDE) ? o.whyDE : o.why) : null;
        return { scenario:o.scenarioId, text:L.you(note), constraint:why };
      });

    const conc = E.concentration(events, meta.units || 6, meta.districts || 4);
    if (conc.available) {
      did.push({ scenario:'ch3:allocate', constraint:null,
        text:L.alloc(Object.values(conc.counts).reduce(function(a,b){return a+b;},0),
                     conc.districtsUsed, conc.districtCount, Math.round(conc.largestShare*100)) });
    }
    const use = E.evidenceUse(events);
    did.push({ scenario:'information', constraint:null, text:L.reports(use.reportsOpened, use.reportsOffered) });

    // Chapter-level facts: stated as counts, never as parameters or diagnoses
    const rp = C.riskPairs(events);
    if (rp.available) did.push({ scenario:'ch1:pair', constraint:null,
      text:L.pairs(rp.wideCount, rp.n, rp.switchAt, rp.monotonic) });
    const dp = C.disposition(events);
    if (dp.available) did.push({ scenario:'ch9:review', constraint:null,
      text:L.disp(dp.n, dp.soldGain, dp.soldLoss) });
    const fc = E.brier(events);
    if (fc.available) did.push({ scenario:'ch10:forecast', constraint:null, text:L.fc(fc.n, fc.brier) });
    const mg = C.modelGap(events);
    if (mg.available) did.push({ scenario:'ch10:forecast', constraint:null, text:L.gap(mg.meanGap) });

    // 2. Patterns with coverage
    const patterns = Object.keys(L.label).map(function (dim) {
      const c = E.coverage(obs, dim);
      return { dimension:dim, label:L.label[dim], coverage:c.label,
               n:c.n, levels:c.levels, text:L.coverage[c.label] };
    });

    // 3. Interpretation — always paired with an alternative explanation
    const readings = [];
    patterns.forEach(function (p) {
      if (p.coverage === 'insufficient') return;
      if (p.coverage === 'mixed')  { readings.push({ dimension:p.dimension, kind:'mixed',  claim:L.mixedClaim(p.label), alternative:L.mixedAlt }); return; }
      if (p.coverage === 'single') { readings.push({ dimension:p.dimension, kind:'single', claim:L.singleClaim, alternative:L.singleAlt }); return; }
      readings.push({ dimension:p.dimension, kind:'repeated', claim:L.repeatClaim(p.n), alternative:L.repeatAlt });
    });
    if (conc.available && conc.largestShare >= 0.5) {
      readings.push({ dimension:'allocation_concentration', kind:'concentration', claim:L.concClaim, alternative:L.concAlt });
    }

    // 4. Stated vs observed — side by side, never blended
    const comparison = E.statedVsObserved(stated, obs).map(function (p, i) {
      const key = p.label.indexOf('waiting') !== -1 ? 'q1' : 'q0';
      return { key:key, label:L.cmpLabel[key], stated:p.stated, observed:p.observed, agrees:p.agrees,
               note: p.agrees === null ? L.cmpNone : (p.agrees ? L.cmpAgree : L.cmpDiffer) };
    });

    // 5. Next steps — each requires evidence that actually exists
    const next = [];
    if (conc.available && conc.largestShare >= 0.5) next.push(L.nextConc);
    if (use.reportsOffered > 0 && use.reportsOpened === 0) next.push(L.nextReports);
    if (use.revisedAfterUninformative > use.revisedAfterInformative) next.push(L.nextRevise);

    return {
      lang:lang, did:did, patterns:patterns, readings:readings, comparison:comparison,
      concentration:conc, evidenceUse:use, forecast:E.brier(events),
      nextSteps:next, unsupported:parsed.unsupported, disclaimer:L.disclaimer
    };
  }

  // Optional secondary label. Unavailable unless the evidence genuinely
  // qualifies — no fallback type, no catch-all.
  function optionalLabel(summary) {
    const L = T[summary.lang === 'de' ? 'de' : 'en'];
    const c = summary.concentration, u = summary.evidenceUse;
    const strong = summary.patterns.filter(function (p) { return p.coverage === 'repeated'; });
    if (strong.length < 3) return { available:false, reason:L.noLabel };
    const traits = [];
    if (c.available && c.spreadVsFeasible >= 70) traits.push(L.trait.spread);
    if (c.available && c.spreadVsFeasible <= 30) traits.push(L.trait.concentrated);
    if (u.reportsOpened >= 2) traits.push(L.trait.reports);
    if (u.revisedAfterInformative > 0 && u.revisedAfterUninformative === 0) traits.push(L.trait.revised);
    if (!traits.length) return { available:false, reason:L.noTrait };
    return { available:true, traits:traits, note:L.traitNote };
  }

  root.Summary = { build:build, optionalLabel:optionalLabel, T:T, LABEL:T.en.label };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}),
   typeof module !== 'undefined' && module.exports ? require('./Evidence.js').Evidence : window.WS.Evidence,
   typeof module !== 'undefined' && module.exports ? require('./Chapters.js').Chapters : window.WS.Chapters);
