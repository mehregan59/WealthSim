/* Converts the game's level-numbered decision records into the stable
 * scenario/trial event format the evidence layer expects.
 *
 * Research and the decision that follows share a trialId, so the evidence
 * layer keeps the committed choice and records the report access separately.
 * Each Level 3 cube placement is its own trial.
 */
(function (root) {
  'use strict';
  const SCENARIO = {
    1:'ch1:contract', 2:'ch2:setback', 3:'ch3:allocate', 4:'ch4:timing',
    5:'ch5:boom',     6:'ch6:delegation', 7:'ch7:news',  8:'ch8:storm'
  };

  function toEvents(decisions) {
    let cube = 0;
    return (decisions || []).map(function (d, i) {
      // New chapters record scenario-keyed events directly; pass them through.
      // Ensure the event always has an explicit `action` field — GameScene
      // stores the player's choice in `value`; Evidence reads `action`.
      if (d.scenarioId) {
        const ev = Object.assign({ eventId:'e' + i, phase:'baseline' }, d);
        // Evidence reads `action`; GameScene stores the choice in `value`.
        if (!ev.action && ev.value) ev.action = ev.value;
        // ch3 cube placements: GameScene records the district name in `value`.
        // Evidence.concentration() needs the district in `districtId`; the
        // observations() lookup needs action='allocate' (the fixed action name).
        if (ev.scenarioId === 'ch3:allocate') {
          if (!ev.districtId && ev.value) ev.districtId = ev.value;
          ev.action = 'allocate';
        }
        return ev;
      }
      const scenarioId = SCENARIO[d.level] || ('unknown:L' + d.level);
      const trialId = d.level === 3 ? ('cube' + (cube++)) : ('L' + d.level);
      return {
        eventId: 'e' + i,
        scenarioId: scenarioId,
        trialId: trialId,
        action: d.value,
        phase: d.phase || 'baseline',
        afterEvidence: !!d.afterResearch,
        districtId: d.districtId || null,
        elapsed: (typeof d.elapsed === 'number') ? d.elapsed : null
      };
    });
  }

  function toStated(answers) {
    answers = answers || [];
    return { q0: answers[0], q1: answers[1], q2: answers[2] };
  }

  root.Adapter = { toEvents: toEvents, toStated: toStated, SCENARIO: SCENARIO };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}));
