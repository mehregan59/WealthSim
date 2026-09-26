/* WealthSim — the money rules for each level.
 *
 * Pure: takes a Sim session and a choice, returns a factual report.
 * Storyline events (the Level 2 setback, the Level 5 boom, the Level 8
 * storm) are applied at level start and are identical for every player.
 * Only a player's own holdings decide how much each one affects them.
 * Happiness and development are civic indicators kept outside this file.
 */
(function (root) {
  'use strict';

  const RULES = {
    startCash: 600,
    L1: { invest: 200 },
    L2: { event: { district:'technology', pct:-0.25, cause:'construction overrun' },
          investMore: 100 },
    L3: { deposit: 600, perCube: 100 },
    L4: { festivalCost: 100, universityCost: 150, universityPayout: 300 },
    L5: { event: { district:'technology', pct:0.40, cause:'boom' },
          increase: 150 },
    L6: { acceptCost: 200, independentCost: 400 },
    L7: { investMore: 100 },
    L8: { severity: 1 }
  };

  // Funds bar is a 0–100 index of real wealth; the label shows real credits.
  function fundsIndex(total) { return Math.max(0, Math.min(100, Math.round(total / 15))); }

  // Move money into a district: cash first, then proportionally from the
  // other districts. Never creates money.
  function moveTo(sim, districtId, amount) {
    let need = amount;
    const fromCash = Math.min(need, sim.state.cash);
    if (fromCash > 0) { sim.invest(districtId, fromCash); need -= fromCash; }
    if (need > 1e-9) {
      const others = sim.districtIds.filter(function (id){ return id !== districtId && sim.state.holdings[id] > 0; });
      const pool = others.reduce(function (s,id){ return s + sim.state.holdings[id]; }, 0);
      if (pool > 0) {
        const take = Math.min(need, pool);
        others.forEach(function (id) { sim.divest(id, take * sim.state.holdings[id] / pool); });
        sim.invest(districtId, Math.min(take, sim.state.cash));
      }
    }
  }

  // Pay a civic cost: cash first, then proportionally from holdings.
  function pay(sim, amount, cause) {
    let short = amount - sim.state.cash;
    if (short > 1e-9) {
      const inv = sim.invested();
      if (inv > 0) {
        const take = Math.min(short, inv);
        const h = Object.assign({}, sim.state.holdings);
        sim.districtIds.forEach(function (id) { if (h[id] > 0) sim.divest(id, take * h[id] / inv); });
      }
    }
    return sim.spend(amount, cause);
  }

  function report(sim, before, extra) {
    const after = sim.total();
    return Object.assign({ before:before, after:after, change:after-before,
                           cash:sim.state.cash, holdings:Object.assign({}, sim.state.holdings) }, extra || {});
  }

  // ── Level functions ─────────────────────────────────────────────
  function start(sim) { /* session starts with RULES.startCash in cash */ return sim; }

  function level1(sim, districtId) {
    const b = sim.total();
    sim.invest(districtId, RULES.L1.invest);
    return report(sim, b);
  }

  function level2Start(sim) {
    const e = RULES.L2.event;
    const b = sim.total();
    const ch = sim.districtEvent(e.district, e.pct, e.cause);
    return report(sim, b, { eventChange: ch });
  }
  function level2(sim, choice) {
    const b = sim.total();
    if (choice === 'cancel') sim.divest('technology');
    else if (choice === 'invest_more') moveTo(sim, 'technology', RULES.L2.investMore);
    const r = sim.advanceYear('L2');
    return report(sim, b, { returns:r });
  }

  function level3Deposit(sim) { const b=sim.total(); sim.deposit(RULES.L3.deposit, 'new credits'); return report(sim,b); }
  function level3Cube(sim, districtId) { sim.invest(districtId, RULES.L3.perCube); }
  function level3End(sim) { const b=sim.total(); const r=sim.advanceYear('L3'); return report(sim,b,{returns:r}); }

  function level4(sim, choice) {
    const b = sim.total();
    if (choice === 'festival')   pay(sim, RULES.L4.festivalCost, 'festival square');
    if (choice === 'university') pay(sim, RULES.L4.universityCost, 'research university');
    const r = sim.advanceYear('L4');
    return report(sim, b, { returns:r });
  }

  function level5Start(sim) {
    const e = RULES.L5.event; const b = sim.total();
    const ch = sim.districtEvent(e.district, e.pct, e.cause);
    return report(sim, b, { eventChange: ch });
  }
  function level5(sim, choice) {
    const b = sim.total();
    if (choice === 'all_in') {
      sim.districtIds.forEach(function (id){ if (id !== 'technology') sim.divest(id); });
      sim.invest('technology', sim.state.cash);
    } else if (choice === 'increase' || choice === 'invest_more') {
      moveTo(sim, 'technology', RULES.L5.increase);
    } else if (choice === 'reduce') {
      sim.divest('technology', sim.state.holdings.technology / 2);
    }
    const r = sim.advanceYear('L5');
    return report(sim, b, { returns:r });
  }

  function level6(sim, choice) {
    const b = sim.total();
    if (choice === 'accept')                        pay(sim, RULES.L6.acceptCost,      'shared infrastructure');
    if (choice === 'independent' || choice === 'build') pay(sim, RULES.L6.independentCost, 'independent construction');
    const r = sim.advanceYear('L6');
    return report(sim, b, { returns:r });
  }

  // The headline in Level 7 is a poorly supported rumour: nothing about the
  // district's prospects changes, so the following year is an ordinary one.
  function level7(sim, choice) {
    const b = sim.total();
    if (choice === 'sell') sim.divest('technology');
    else if (choice === 'reduce') sim.divest('technology', sim.state.holdings.technology / 2);
    else if (choice === 'invest_more') moveTo(sim, 'technology', RULES.L7.investMore);
    const r = sim.advanceYear('L7');
    return report(sim, b, { returns:r });
  }

  // The storm hits every holding by its declared drawdown. The counterfactual
  // is the same storm on an even split of the same invested amount.
  function level8Storm(sim) {
    const b = sim.total();
    const inv = sim.invested();
    const cf = sim.shockCounterfactual(sim.evenSplit(inv), RULES.L8.severity);
    const hit = sim.applyShock(RULES.L8.severity);
    return report(sim, b, { loss:hit.totalLoss, evenSplitLoss:cf.loss, invested:inv });
  }
  function level8University(sim) { const b=sim.total(); sim.deposit(RULES.L4.universityPayout,'university graduates'); return report(sim,b); }
  // Recovery is an ordinary seeded year — it can be good or bad.
  function level8(sim, choice) {
    const b = sim.total();
    if (choice === 'sell_all') sim.districtIds.forEach(function (id){ sim.divest(id); });
    else if (choice === 'protect') {
      // Sell exposed (volatile) holdings; retain essential services
      sim.divest('technology');
      sim.divest('transport');
    }
    else if (choice === 'rebalance') sim.rebalanceEven();
    else if (choice === 'opportunistic' || choice === 'invest_low') {
      const per = sim.state.cash / sim.districtIds.length;
      sim.districtIds.forEach(function (id){ sim.invest(id, per); });
    }
    const r = sim.advanceYear('L8');
    return report(sim, b, { returns:r });
  }

  root.Economy = {
    RULES:RULES, fundsIndex:fundsIndex, moveTo:moveTo, pay:pay, start:start,
    level1:level1, level2Start:level2Start, level2:level2,
    level3Deposit:level3Deposit, level3Cube:level3Cube, level3End:level3End,
    level4:level4, level5Start:level5Start, level5:level5, level6:level6,
    level7:level7, level8Storm:level8Storm, level8University:level8University, level8:level8
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}));
