/* WealthSim — deterministic simulation.
 *
 * Replaces hand-tuned stat nudges with a declared model:
 *   • one seeded PRNG per session; identical seed -> identical session
 *   • every scenario's outcome distribution is declared up front and is
 *     auditable before play
 *   • a shock's effect follows from actual exposure, so concentration has
 *     a real consequence rather than a scripted one
 *   • an outcome is never chosen to justify the player's decision
 */
(function (root) {
  'use strict';

  // ── Seeded PRNG (mulberry32) ──────────────────────────────────────
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
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i); h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // ── Declared asset model ──────────────────────────────────────────
  // Annual return distributions, declared once and never adjusted mid-run.
  // `drawdown` is the proportional hit this district takes in a downturn.
  const DISTRICTS = {
    housing:    { label:'Housing',    mean:0.04, sd:0.06, drawdown:0.18 },
    transport:  { label:'Transport',  mean:0.05, sd:0.09, drawdown:0.26 },
    technology: { label:'Technology', mean:0.09, sd:0.24, drawdown:0.52 },
    energy:     { label:'Energy',     mean:0.05, sd:0.11, drawdown:0.30 }
  };
  const DISTRICT_IDS = Object.keys(DISTRICTS);

  // Box–Muller using the seeded stream, so draws stay reproducible.
  function normal(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // ── Session ───────────────────────────────────────────────────────
  function createSession(seedInput, opts) {
    opts = opts || {};
    const seedStr = String(seedInput === undefined ? Date.now() : seedInput);
    const seed = seedFromString(seedStr);
    const rng = makeRng(seed);

    const holdings = {};
    DISTRICT_IDS.forEach(function (id) { holdings[id] = 0; });

    const state = {
      seed: seed,
      seedString: seedStr,
      cash: opts.startingCash === undefined ? 600 : opts.startingCash,
      holdings: holdings,
      year: opts.startYear || 2024,
      ledger: []            // every value change, with its cause
    };

    function total() {
      let v = state.cash;
      DISTRICT_IDS.forEach(function (id) { v += state.holdings[id]; });
      return v;
    }

    function record(kind, detail, before) {
      state.ledger.push({
        step: state.ledger.length,
        year: state.year,
        kind: kind,
        detail: detail,
        totalBefore: before,
        totalAfter: total()
      });
    }

    // Move funds from cash into a district.
    function invest(districtId, amount) {
      if (!DISTRICTS[districtId]) throw new Error('unknown district: ' + districtId);
      const before = total();
      const amt = Math.min(amount, state.cash);
      state.cash -= amt;
      state.holdings[districtId] += amt;
      record('invest', { districtId: districtId, amount: amt }, before);
      return amt;
    }

    // Move funds from a district back to cash.
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

    // Advance one year. Each district draws from its own declared
    // distribution using the seeded stream.
    // With a key (e.g. 'L3'), returns come from a stream derived from the
    // session seed and that key alone. A level therefore sees the same market
    // however often it is retried and whichever option is chosen.
    function advanceYear(key) {
      const before = total();
      const returns = {};
      const draw = key === undefined ? rng : makeRng(seedFromString(seedStr + '|year|' + key));
      DISTRICT_IDS.forEach(function (id) {
        const d = DISTRICTS[id];
        const r = d.mean + d.sd * normal(draw);
        returns[id] = r;
        state.holdings[id] = state.holdings[id] * (1 + r);
      });
      state.year += 1;
      record('year', { returns: returns, key: key === undefined ? null : key }, before);
      return returns;
    }

    // A downturn. The loss each district takes is declared in the model,
    // so the damage to the player follows from where they actually are.
    // Nothing here inspects the player's decisions.
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

    // Counterfactual: what this same shock would have cost under a
    // different allocation of the same money. Used for feedback that shows
    // the consequence of exposure instead of asserting it.
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

    // New money arriving from outside (e.g. a grant). Recorded with its cause.
    function deposit(amount, cause) {
      const before = total();
      state.cash += Math.max(0, amount);
      record('deposit', { amount: Math.max(0, amount), cause: cause || null }, before);
    }

    // Money leaving for a civic purpose (a square, a university). A real cost
    // to wealth; any civic benefit is tracked outside the simulation.
    function spend(amount, cause) {
      const before = total();
      const amt = Math.min(Math.max(0, amount), state.cash);
      state.cash -= amt;
      record('spend', { amount: amt, cause: cause || null }, before);
      return amt;
    }

    // A scripted scenario event on one district (e.g. the Chapter 5 boom).
    // Part of the storyline and identical whatever the player chose; like
    // applyShock it reads holdings only, never decisions.
    function districtEvent(districtId, pct, cause) {
      if (!DISTRICTS[districtId]) throw new Error('unknown district: ' + districtId);
      const before = total();
      const change = state.holdings[districtId] * pct;
      state.holdings[districtId] += change;
      record('event', { districtId: districtId, pct: pct, change: change, cause: cause || null }, before);
      return change;
    }

    // Sell everything and reinvest it evenly across all districts.
    function rebalanceEven() {
      const before = total();
      let pool = state.cash;
      DISTRICT_IDS.forEach(function (id) { pool += state.holdings[id]; state.holdings[id] = 0; });
      const per = pool / DISTRICT_IDS.length;
      DISTRICT_IDS.forEach(function (id) { state.holdings[id] = per; });
      state.cash = 0;
      record('rebalance', { perDistrict: per }, before);
    }

    function invested() {
      let v = 0; DISTRICT_IDS.forEach(function (id) { v += state.holdings[id]; }); return v;
    }

    // Restore a snapshot (used by Retry level). The ledger is cut back to the
    // same point so the history stays consistent with the balances.
    function restore(snap) {
      state.cash = snap.cash;
      DISTRICT_IDS.forEach(function (id) { state.holdings[id] = snap.holdings[id] || 0; });
      state.year = snap.year;
      if (typeof snap.ledgerLength === 'number') state.ledger.length = snap.ledgerLength;
    }

    function evenSplit(amount) {
      const per = amount / DISTRICT_IDS.length;
      const a = {};
      DISTRICT_IDS.forEach(function (id) { a[id] = per; });
      return a;
    }

    return {
      state: state,
      districts: DISTRICTS,
      districtIds: DISTRICT_IDS,
      total: total,
      invest: invest,
      divest: divest,
      advanceYear: advanceYear,
      applyShock: applyShock,
      shockCounterfactual: shockCounterfactual,
      evenSplit: evenSplit,
      deposit: deposit,
      spend: spend,
      districtEvent: districtEvent,
      rebalanceEven: rebalanceEven,
      invested: invested,
      restore: restore,
      snapshot: function () {
        return JSON.parse(JSON.stringify({
          cash: state.cash, holdings: state.holdings,
          year: state.year, total: total(), ledgerLength: state.ledger.length
        }));
      }
    };
  }

  root.Sim = {
    createSession: createSession,
    DISTRICTS: DISTRICTS,
    makeRng: makeRng,
    seedFromString: seedFromString
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.WS = window.WS || {}));
