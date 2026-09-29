import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const load = (file: string, name: string) =>
  vm.runInNewContext(readFileSync(`public/game/js/${file}`, "utf8") + `;${name}`, { console, Date });
const A = load("assessment.js", "Assessment");
const cubes = (ids: string[]) => ids.map((districtId) => ({ level: 3, value: "allocate", districtId }));

describe("missing data", () => {
  it("no decisions -> every trait is null, never a fake 50", () => {
    const s = A.computeScores([], []);
    for (const k of ["riskPreference","lossAversion","patience","diversification","greedFomo","reactionToNoise","learning","resilience","disposition","overconfidence"])
      expect(s[k]).toBeNull();
    expect(A.personaKey(s)).toBe("insufficient");
  });
  it("unrecognised action is not observed, not average", () => {
    expect(A.computeScores([{ level: 5, value: "banana" }], []).greedFomo).toBeNull();
  });
  it("starting answer alone never creates a score", () => {
    expect(A.computeScores([], ["aggressive", "patient", "stop"]).riskPreference).toBeNull();
  });
  it("fewer than 4 observed traits -> not enough evidence", () => {
    const s = A.computeScores([{ level: 1, value: "safe" }, { level: 5, value: "hold" }, { level: 8, value: "hold" }], []);
    expect(A.personaKey(s)).toBe("insufficient");
  });
});

describe("level wiring", () => {
  it("level 2 loss aversion reads the dip, not the news beat", () => {
    const s = A.computeScores([{ level: 2, value: "continue", phase: "dip" }, { level: 2, value: "cancel", phase: "news" }], []);
    expect(s.lossAversion).toBe(30);
  });
  it("level 4 repair beat never counts as patience", () => {
    expect(A.computeScores([{ level: 4, value: "repair_now", phase: "repair" }], []).patience).toBeNull();
    expect(A.computeScores([{ level: 4, value: "repair_now", phase: "repair" }, { level: 4, value: "university", phase: "build" }], []).patience).toBe(88);
  });
  it("level 6 scores the final choice; research adds on top", () => {
    expect(A.computeScores([{ level: 6, value: "research" }, { level: 6, value: "accept" }], []).learning).toBe(85);
  });
  it("level 7 invest_more is counted", () => {
    expect(A.computeScores([{ level: 7, value: "invest_more" }], []).reactionToNoise).toBe(70);
  });
});

describe("90/10 blend", () => {
  it("risk: gameplay 90%, stated answer 10%", () => {
    // safe gameplay (20) + aggressive stated (88) -> 20*0.9 + 88*0.1 = 26.8 -> 27
    expect(A.computeScores([{ level: 1, value: "safe" }], ["aggressive"]).riskPreference).toBe(27);
  });
  it("patience: gameplay 90%, stated answer 10%", () => {
    // university (88) + impatient stated (20) -> 88*0.9 + 20*0.1 = 81.2 -> 81
    expect(A.computeScores([{ level: 4, value: "university", phase: "build" }], [undefined, "impatient"]).patience).toBe(81);
  });
  it("loss aversion: gameplay 90%, stated answer 10%", () => {
    // continue dip (30) + stop stated (90) -> 30*0.9 + 90*0.1 = 36
    expect(A.computeScores([{ level: 2, value: "continue", phase: "dip" }], [undefined, undefined, "stop"]).lossAversion).toBe(36);
  });
  it("skipped starting answer -> gameplay only, no invented preference", () => {
    expect(A.computeScores([{ level: 1, value: "safe" }], []).riskPreference).toBe(20);
  });
  it("other traits are 100% gameplay regardless of answers", () => {
    const s = A.computeScores([{ level: 5, value: "hold" }], ["aggressive", "impatient", "stop"]);
    expect(s.greedFomo).toBe(26);
  });
});

describe("pension content", () => {
  const PC = load("pensionContent.js", "PensionContent");
  it("has exactly three badge states", () => {
    expect(Object.keys(PC.STATUS)).toEqual(["LAW", "EFFECTIVE_2027", "PROPOSAL"]);
  });
  it("proposals never carry an EFFECTIVE 2027 badge", () => {
    expect(PC.items.fruhstartRente.status).toBe("PROPOSAL");
    expect(PC.items.retirementAge.status).toBe("PROPOSAL");
    expect(PC.items.target70.status).toBe("PROPOSAL");
  });
  it("Generationenkapital is omitted", () => {
    expect(JSON.stringify(PC.items)).not.toContain("enerationenkapital");
  });
  it("every item and framing exists in both languages with a verified date", () => {
    for (const k of Object.keys(PC.items)) { expect(PC.items[k].en).toBeTruthy(); expect(PC.items[k].de).toBeTruthy(); }
    for (const k of Object.keys(PC.training)) { expect(PC.training[k].en).toBeTruthy(); expect(PC.training[k].de).toBeTruthy(); }
    for (const k of Object.keys(PC.cta)) { expect(PC.cta[k].en).toBeTruthy(); expect(PC.cta[k].de).toBeTruthy(); }
    expect(PC.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("level 3 exposure", () => {
  it("losses scale with exposure", () => {
    expect(A.level3Loss(0)).toEqual({ exposed: 0, lost: 0 });
    expect(A.level3Loss(1).lost).toBe(40);
    expect(A.level3Loss(6).lost).toBe(240);
  });
  it("2/2/1/1 is 100, all in one is 0", () => {
    expect(A.diversification(["housing","housing","transport","transport","technology","energy"])).toBe(100);
    expect(A.diversification(Array(6).fill("technology"))).toBe(0);
  });
  it("all six cubes in tech is never a strategist", () => {
    const s = A.computeScores([...cubes(Array(6).fill("technology")),
      { level: 4, value: "university", phase: "build" }, { level: 7, value: "research" }, { level: 7, value: "hold" }, { level: 8, value: "hold" }], ["safe","patient","wait"]);
    expect(A.personaKey(s)).not.toBe("strategist");
  });
});

describe("level 9 disposition effect", () => {
  it("selling the winner and letting past price decide scores high", () => {
    expect(A.computeScores([{ level: 9, value: "sell_winner", phase: "pair" }, { level: 9, value: "sell_gain", phase: "twin" }], []).disposition).toBe(80);
  });
  it("forward-looking choices score low", () => {
    expect(A.computeScores([{ level: 9, value: "sell_loser", phase: "pair" }, { level: 9, value: "either", phase: "twin" }], []).disposition).toBe(20);
  });
});

describe("level 10 forecast calibration", () => {
  it("90% sure and half right is overconfident", () => {
    const r = A.forecastResult([
      { pick: true, conf: 90, outcome: true }, { pick: true, conf: 90, outcome: false },
      { pick: false, conf: 90, outcome: false }, { pick: false, conf: 90, outcome: true }]);
    expect(r.hitRate).toBe(0.5); expect(r.avgConf).toBeCloseTo(0.9); expect(r.overconfidence).toBe(80);
  });
  it("50/50 answers count as half a hit and are perfectly calibrated", () => {
    expect(A.forecastResult([{ pick: null, conf: 50, outcome: true }]).overconfidence).toBe(0);
  });
  it("practice round alone does not produce an overconfidence score", () => {
    const s = A.computeScores([{ level: 10, value: "y90", phase: "practice", pick: true, conf: 90, outcome: false }], []);
    expect(s.overconfidence).toBeNull();
  });
  it("forecast outcomes are fixed for fair replays", () => {
    expect(A.FORECASTS.map((f: any) => f.outcome)).toEqual([true, false, false, true]);
  });
});

describe("decision timeline", () => {
  it("records what happened in order without interpreting it", () => {
    const tl = A.timeline([
      { level: 1, value: "safe" },
      { level: 2, value: "cancel", phase: "dip" },
      { level: 4, value: "repair_now", phase: "repair" },
      { level: 4, value: "university", phase: "build" }
    ]);
    expect(tl.map((e: any) => e.level)).toEqual([1, 2, 4, 4]);
    expect(tl[3].text).toContain("Research University");
  });
  it("is empty when nothing was played", () => {
    expect(A.timeline([])).toEqual([]);
  });
});

describe("research table", () => {
  it("gives every concept a stated limitation", () => {
    expect(A.RESEARCH.length).toBeGreaterThan(4);
    A.RESEARCH.forEach((r: any) => {
      expect(r.finding.length).toBeGreaterThan(10);
      expect(r.mechanic.length).toBeGreaterThan(10);
      expect(r.limit.length).toBeGreaterThan(10);
    });
    expect(A.RESEARCH_NOTE).toContain("not been empirically validated");
  });
});

describe("evidence panel", () => {
  it("lists every trait and marks unobserved ones", () => {
    const rows = A.evidence([{ level: 1, value: "safe" }], [], A.computeScores([{ level: 1, value: "safe" }], []));
    expect(rows).toHaveLength(10);
    expect(rows[0].did).toContain("Level 1");
    expect(rows[1].did).toBeNull();
  });
});

describe("ScoringEngine", () => {
  it("records phase and extra fields", () => {
    const S = load("scoring.js", "ScoringEngine");
    S.recordDecision(2, "wait", { phase: "dip" });
    expect(S.decisions[0]).toMatchObject({ level: 2, value: "wait", phase: "dip" });
    S.reset(); expect(S.decisions).toHaveLength(0);
  });
});

describe('previously unwired beats', () => {
  const A2 = A;
  const base = [
    { level: 6, value: 'accept' }, { level: 7, value: 'hold', elapsed: 8000 },
    { level: 8, value: 'hold' }, { level: 4, value: 'university', phase: 'build' },
  ];
  it('level 2 news adjusts adaptability', () => {
    const a = A2.computeScores([...base, { level: 2, value: 'cancel', phase: 'news' }], []);
    const b = A2.computeScores([...base, { level: 2, value: 'invest_more', phase: 'news' }], []);
    expect(a.learning - b.learning).toBe(20);
  });
  it('level 4 repair adjusts resilience, never patience', () => {
    const a = A2.computeScores([...base, { level: 4, value: 'repair_now', phase: 'repair' }], []);
    const b = A2.computeScores([...base, { level: 4, value: 'defer', phase: 'repair' }], []);
    expect(a.patience).toBe(b.patience);
    expect(a.resilience).toBeGreaterThan(b.resilience);
  });
  it('fast level 7 answer raises reaction to noise', () => {
    const fast = A2.computeScores([...base.slice(0, 1), { level: 7, value: 'hold', elapsed: 1200 }, ...base.slice(2)], []);
    const slow = A2.computeScores(base, []);
    expect(fast.reactionToNoise - slow.reactionToNoise).toBe(10);
  });
  it('practice forecast counts 10% of overconfidence', () => {
    const F = [1, 2, 3, 4].map(i => ({ level: 10, phase: 'forecast', pick: true, conf: 90, outcome: i % 2 === 0 }));
    const without = A2.computeScores(F, []).overconfidence;
    const withP = A2.computeScores([...F, { level: 10, phase: 'practice', pick: true, conf: 50, outcome: true }], []).overconfidence;
    expect(withP).toBe(Math.round(without * 0.9));
  });
});
