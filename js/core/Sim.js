/* WealthSim — deterministic simulation.
 *
 * Replaces hand-tuned stat nudges with a declared model:
 *   • one seeded PRNG per session; identical seed -> identical session
 *   • every district's return distribution is declared up front and is
 *     auditable before play
 *   • a shock's effect follows from actual exposure, so concentration has
 *     a real consequence rather than a scripted one
 *   • an outcome is never chosen to justify the player's decision
 */
(function (root) {
  'use strict';

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFromString(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // Declared asset model. `drawdown` is the proportional hit a district
  // takes in a downturn. Declared once; never adjusted mid-run.
  const DISTRICTS = {
    housing:    { label:'Housing',    mean:0.04, sd:0.06, drawdown:0.18 },
    transport:  { label:'Transport',  mean:0.05, sd:0.09, drawdown:0.26 },
    technology: { label:'Technology', mean:0.09, sd:0.24, drawdown:0.52 },
    energy:     { label:'Energy',     mean:0.05, sd:0.11, drawdown:0.30 }
  };
  const DISTRICT_IDS = Object.keys(DISTRICTS);

  function normal(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function createSession(seedInput, opts) {
    opts = opts || {};
    const seedStr = String(seedInput === undefined ? Date.now() : seedInput);
    const seed = seedFromString(seedStr);
    const rng = makeRng(seed);

    const holdings = {};
    DISTRICT_IDS.forEach(function (id) { holdings[id] = 0; });

    const state = {
      seed: seed, seedString: seedStr,
      cash: opts.startingCash === undefined ? 600 : opts.startingCash,
      holdings: holdings,
      year: opts.startYear || 2024,
      ledger: []
    };

    function total() {
      let v = state.cash;
      DISTRICT_IDS.forEach(function (id) { v += state.holdings[id]; });
      return v;
    }

    function record(kind, detail, before) {
      state.ledger.push({
        step: state.ledger.length, year: state.year, kind: kind,
        detail: detail, totalBefore: before, totalAfter: total()
      });
    }

    function invest(districtId, amount) {
      if (!DISTRICTS[districtId]) throw new Error('unknown district: ' + districtId);
      const before = total();
      const amt = Math.min(amount, state.cash);
      state.cash -= amt;
      state.holdings[districtId] += amt;
      record('invest', { districtId: districtId, amount: amt }, before);
      return amt;
    }

    function divest(districtId, amount) {
      if (!DISTRICTS[districtId]) throw new Error('unknown district: ' + districtId);
      const before = total();
      const amt = (amount === undefined) ? state.holdings[districtId]
                                         : Math.min(amount, state.holdings[districtId]);
      state.holdings[districtId] -= amt;
      state.cash += amt;
      record('divest', { districtId: districtId, amount: amt }, before);
      return amt;
    }

    function advanceYear() {
      const before = total();
      const returns = {};
      DISTRICT_IDS.forEach(function (id) {
        const d = DISTRICTS[id];
        const r = d.mean + d.sd * normal(rng);
        returns[id] = r;
        state.holdings[id] = state.holdings[id] * (1 + r);
      });
      state.year += 1;
      record('year', { returns: returns }, before);
      return returns;
    }

    // Damage follows declared drawdowns and actual holdings only. This
    // function deliberately has no access to what was chosen or why.
    function applyShock(severity) {
      const s = severity === undefined ? 1 : severity;
      const before = total();
      const losses = {};
      DISTRICT_IDS.forEach(function (id) {
        const hit = DISTRICTS[id].drawdown * s;
        losses[id] = state.holdings[id] * hit;
        state.holdings[id] -= losses[id];
      });
      record('shock', { severity: s, losses: losses }, before);
      return { losses: losses, totalLoss: before - total() };
    }

    // What the same shock would have cost under a different allocation of
    // the same money — lets feedback show a consequence instead of asserting one.
    function shockCounterfactual(allocation, severity) {
      const s = severity === undefined ? 1 : severity;
      let lost = 0, base = 0;
      Object.keys(allocation).forEach(function (id) {
        if (!DISTRICTS[id]) return;
        base += allocation[id];
        lost += allocation[id] * DISTRICTS[id].drawdown * s;
      });
      return { invested: base, loss: lost, lossPct: base ? lost / base : 0 };
    }

    function evenSplit(amount) {
      const per = amount / DISTRICT_IDS.length;
      const a = {};
      DISTRICT_IDS.forEach(function (id) { a[id] = per; });
      return a;
    }

    return {
      state: state, districts: DISTRICTS, districtIds: DISTRICT_IDS,
      total: total, invest: invest, divest: divest,
      advanceYear: advanceYear, applyShock: applyShock,
      shockCounterfactual: shockCounterfactual, evenSplit: evenSplit,
      snapshot: function () {
        return JSON.parse(JSON.stringify({
          cash: state.cash, holdings: state.holdings,
          year: state.year, total: total()
        }));
      }
    };
  }

  root.Sim = {
    createSession: createSession, DISTRICTS: DISTRICTS,
    makeRng: makeRng, seedFromString: seedFromString
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}));
