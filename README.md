# WealthSim — Build Your Future

A behavioral simulation disguised as a city-building game. Players manage a fictional city across a lifetime of decisions. Only at the end does the game reveal what each decision represented.

WealthSim is **not** an investment game and does **not** give financial advice. It is an educational tool. Its profiles describe a single play session; they are not validated psychological assessments.

---

## How to play

Open `index.html` in any modern browser. No server or build step required.

Live on GitHub Pages: <https://mehregan59.github.io/WealthSim>

Toggle language (English / Deutsch) in the top-right corner.

---

## Repository structure

```
WealthSim/
├── index.html              # Entry point — loads all scripts and starts the game
├── css/
│   └── style.css           # Responsive styles (mobile / tablet / desktop)
└── js/
    ├── i18n.js             # All UI strings in EN + DE
    ├── scoring.js          # DEPRECATED — see js/core/ (file kept to avoid 404s)
    └── core/               # Pure modules: no Phaser, no DOM dependency
    │   ├── Evidence.js     # Action registry, observation extraction, coverage labels
    │   ├── Summary.js      # Template-driven result sentences; one scoring pipeline
    │   ├── Chapters.js     # Ch1 pairs, Ch9 trials, Ch10 forecasts, practice
    │   ├── Economy.js      # Seeded district simulation (mulberry32 PRNG)
    │   ├── Sim.js          # Simulation runner, year-by-year returns
    │   └── Adapter.js      # Bridges GameScene events → Evidence / Summary
    └── scenes/
        ├── BootScene.js
        ├── ProfileScene.js # Opening questions and player information
        └── GameScene.js    # Ten-chapter game flow and decision recorder
```

`index.html` is the only entry point. `src/routes/index.tsx` is a separate placeholder that is **not** the working game.

---

## Game flow (ten chapters)

| Chapter | Scenario | Dimension observed |
|---------|----------|--------------------|
| 1 | Choose development contracts — three paired offers | Risk choices |
| 2 | A setback — temporary fall vs changed prospects | Response to setbacks |
| 3 | Allocate six resource cubes across four districts | Allocation concentration |
| 4 | Today or tomorrow — festival vs university | Timing choices |
| 5 | The boom — rising-district headline | Response to rising prices |
| 6 | The delegation — outside offer with reports | Response to an outside offer |
| 7 | Headlines — rumour vs credible update | Response to social cues |
| 8 | The storm — downturn with stated reserve | Response during downturns |
| 9 | Project review — selling winners and keeping losers | Response to past gains and losses |
| 10 | Planning desk — forecast summary and one practice decision | Forecast accuracy |

Forecasts are collected at chapter gates (2 / 4 / 6 / 8); chapter 10 reports accuracy and offers one equivalent practice decision. The practice decision is tagged separately and never enters the session profile.

---

## Running tests

```bash
node test/gamescene.harness.test.js
```

The harness uses Node.js's built-in `vm` module and a Proxy-based Phaser stub. No browser, canvas, or additional dependencies are required.

Tests cover: Ch1 district routing, Ch2 research flag, Ch3 cube records, Ch7 `invest_more` regression, Ch9 disposition recording, Ch10 Brier arithmetic, practice isolation, cash/holdings reconciliation, three complete player paths (concentrated, cautious, evidence-responsive).

---

## Core design rules

**Evidence, not averages.** Missing decisions produce `insufficient evidence`, never a neutral score.

**Traceable sentences.** Every sentence in the result screen requires specific recorded evidence. If the evidence is absent, the sentence is not produced.

**One scoring pipeline.** `js/core/Evidence.js` and `js/core/Summary.js` are the only code that produces result text. `js/scoring.js` is deprecated and no longer loaded by `index.html`.

**Seeded simulation.** Economic events in `js/core/Economy.js` use a mulberry32 PRNG seeded from a session string. Cosmetic randomness (building animations) is separate. Replaying with the same seed produces identical economic outcomes.

**Practice is isolated.** Post-feedback practice events are tagged `phase:'practice'`. They are never aggregated with the session profile.

**No fabricated motive claims.** The result screen reports what happened ("You kept your allocation unchanged after two headlines") and a plausible alternative explanation. It never asserts a motive that was not observed.

---

## Dimensions and coverage labels

Each dimension is scored independently with a coverage label:

| Label | Meaning |
|-------|-------|
| `insufficient` | No eligible observations in this session |
| `single` | One decision recorded |
| `limited` | Two decisions recorded |
| `repeated` | Three or more decisions with the same direction |
| `mixed` | Two or more decisions pointing in different directions |

Three observations is a product design rule, not a validated reliability threshold.

---

## Optional secondary label

A secondary label (e.g. "spread funding widely") is generated only when three or more dimensions show a `repeated` pattern **and** the specific claim is supported by evidence. If the evidence does not qualify, no label is produced. There is no catch-all fallback.

---

## What the game does not claim

- WealthSim's custom scores, personas, thresholds, and German translations have not been validated against the published research cited in `RESEARCH_MAP.md`.
- Behavioral profiles reflect a single play session only.
- No investment product is recommended. No financial advice is given.
- Retirement education (GRV / bAV / private provision) is general. Verify current German pension figures against official sources before relying on them.
- A short hypothetical city game is not a replication of any laboratory study.

---

## Known limitations

- Forecast count (four) is insufficient to establish stable overconfidence; the Brier score is reported as descriptive only.
- The 15–20 minute play duration is a design aspiration; actual duration depends on reading speed and device.
- English and German templates carry identical substance (tested), but the German text has not been reviewed by a native-speaker psychologist.
- The `js/scoring.js` file is kept in the repository to avoid 404 errors on any cached references; it is not loaded by `index.html` and plays no role in the current game.

---

## Research background

See `RESEARCH_MAP.md` for the source-to-design table and `VALIDATION_PLAN.md` for the future evaluation plan.

---

Built as a prototype for the German retirement education market.

### Warm city presentation

The default opening now shows the city with **Start building** and a separate
**Start with background questions** route. Quick play omits personal questions;
the other route retains pre-play questions. The game still has ten chapters.
Decision cards, allocation controls and the final report use native HTML for
keyboard/touch access. Help, pause, text enlargement and reduced motion are in
the game toolbar. The city uses a brighter palette and persistent daylight.

Run the focused presentation and feedback checks with:

```sh
node test/verify-visual.cjs
```

See `docs/CLAUDE_VISUAL_HANDOFF.md` for the patch base, verification results and
remaining rendered-browser checks. Node test success is not visual certification.
