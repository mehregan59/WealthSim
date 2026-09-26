/* WealthSim — transparent persona rules.
 *
 * Assigns one of six named personas (Strategist, Guardian, Challenger,
 * Explorer, Sprinter, Reactor) or Mixed Style when evidence is split.
 * Only recorded baseline actions qualify — no invented evidence.
 * Chapter 10 practice decisions are excluded.
 */
(function (root) {
  'use strict';

  const PERSONAS = [
    { name: 'Strategist',  nameDE: 'Stratege',     test: function (d) { return d.research >= 2 && d.wideRisk <= 1; } },
    { name: 'Guardian',    nameDE: 'Hüter',         test: function (d) { return d.narrowRisk >= 2 && d.lossAvoidance >= 1; } },
    { name: 'Challenger',  nameDE: 'Herausforderer',test: function (d) { return d.wideRisk >= 2 && d.aggressiveStorm >= 1; } },
    { name: 'Explorer',    nameDE: 'Entdecker',     test: function (d) { return d.research >= 2 && d.wideRisk >= 1; } },
    { name: 'Sprinter',    nameDE: 'Sprinter',      test: function (d) { return d.immediateChoice >= 2 && d.research === 0; } },
    { name: 'Reactor',     nameDE: 'Reaktiver',     test: function (d) { return d.newsFollower >= 1 && d.setbackSell >= 1; } },
  ];

  function _dims(events) {
    const baseline = (events || []).filter(function (e) { return e.phase !== 'practice'; });
    let research = 0, wideRisk = 0, narrowRisk = 0, lossAvoidance = 0;
    let aggressiveStorm = 0, immediateChoice = 0, newsFollower = 0, setbackSell = 0;

    baseline.forEach(function (e) {
      const a = e.action;
      if (a === 'research') research++;
      if (a === 'wide') wideRisk++;
      if (a === 'narrow') narrowRisk++;
      if (e.scenarioId === 'ch9:matched_gain_loss' && a === 'sell_winner') lossAvoidance++;
      if (e.scenarioId === 'ch8:storm' && (a === 'invest_low' || a === 'opportunistic')) aggressiveStorm++;
      if (e.scenarioId === 'ch4:timing' && a === 'festival') immediateChoice++;
      if (e.scenarioId === 'ch7:headlines' && (a === 'sell' || a === 'reduce')) newsFollower++;
      if (e.scenarioId === 'ch2:setback' && a === 'cancel') setbackSell++;
    });

    return { research, wideRisk, narrowRisk, lossAvoidance, aggressiveStorm, immediateChoice, newsFollower, setbackSell };
  }

  function classify(events) {
    const d = _dims(events);
    const matched = PERSONAS.filter(function (p) { return p.test(d); });
    if (matched.length === 1) {
      return { available: true, persona: matched[0].name, personaDE: matched[0].nameDE, dims: d };
    }
    return { available: matched.length > 1, persona: 'Mixed Style', personaDE: 'Gemischter Stil', dims: d };
  }

  function describe(result, lang) {
    if (!result.available) return null;
    const d = result.dims;
    const de = lang === 'de';
    const lines = [];
    if (d.research >= 2)         lines.push(de ? 'Entscheidungen nach Recherche: ' + d.research : 'Decisions after research: ' + d.research);
    if (d.wideRisk >= 1)         lines.push(de ? 'Breite Risikoverträge gewählt: ' + d.wideRisk : 'Wide-risk contracts chosen: ' + d.wideRisk);
    if (d.narrowRisk >= 1)       lines.push(de ? 'Enge Risikoverträge gewählt: ' + d.narrowRisk : 'Narrow-risk contracts chosen: ' + d.narrowRisk);
    if (d.lossAvoidance >= 1)    lines.push(de ? 'Gewinner verkauft (Projektevaluation): ' + d.lossAvoidance : 'Winners sold (project review): ' + d.lossAvoidance);
    if (d.aggressiveStorm >= 1)  lines.push(de ? 'Sturm-investition getätigt' : 'Invested during storm');
    if (d.immediateChoice >= 1)  lines.push(de ? 'Sofortigen Vorteil gewählt: ' + d.immediateChoice : 'Immediate benefit chosen: ' + d.immediateChoice);
    if (d.newsFollower >= 1)     lines.push(de ? 'Auf Schlagzeilen reagiert: ' + d.newsFollower : 'Reacted to headlines: ' + d.newsFollower);
    if (d.setbackSell >= 1)      lines.push(de ? 'Projekt nach Rückschlag abgebrochen' : 'Cancelled project after setback');
    return lines.join('; ');
  }

  root.SessionStyle = { PERSONAS: PERSONAS, classify: classify, describe: describe };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}));
