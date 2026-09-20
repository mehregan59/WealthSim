# WealthSim core

Pure, testable modules with no Phaser or DOM dependency. Run with plain Node.

    node test/evidence.test.js
    node test/sim.test.js

## Why this layer exists

The original scoring produced claims the game could not support. A session
that put half its funding into one district, and opened one optional report,
was described as *"patient, diversified and information-seeking"*. Every part
of that sentence rested on one observation or on a number normalised against
an unreachable ideal.

These modules make that class of error structurally impossible.

## Evidence.js

**Every offered action is declared.** `ACTIONS` lists each action in each
scenario. An action that is offered in the UI but missing here becomes
`unsupported` and is reported — it can never quietly become a neutral 50.

**Absent data is `insufficient`.** Coverage labels are `insufficient`,
`single`, `limited`, `repeated` or `mixed`. There is no default average.

**Coverage is not confidence.** `MIN_PATTERN = 3` is a product rule about how
much evidence justifies describing a pattern. It is not a validated
reliability threshold and is not presented as one.

**Concentration reports reality.** Actual shares, HHI, and the largest single
share. Normalisation is against the evenest split reachable with the given
number of indivisible units — with 6 units across 4 districts that is
`[2,2,1,1]`, not a perfect quarter each.

**Opening a report is not learning.** `reportsOpened` is counted separately
from comprehension checks and from belief revision, and revision after
substantive evidence is separated from revision after weak evidence.

**Constraint actions are excluded from preference patterns.** Funding a due
repair is not a timing preference; selling to meet a stated reserve is not a
downturn reaction. Both are tagged with the reason.

## Summary.js

Every sentence comes from a template that requires specific evidence. If the
evidence is absent the sentence is not produced. There is no fallback prose
and no catch-all persona.

`optionalLabel()` returns `available: false` unless at least three dimensions
reach `repeated` coverage **and** each descriptor is individually earned.
Most single playthroughs will correctly produce no label at all.

Stated preferences and observed behaviour are shown side by side, never
blended into one number. Disagreement is explained as answering about
intentions versus responding to specifics — explicitly not dishonesty.

## Sim.js

**Deterministic.** One seeded PRNG per session. The same seed reproduces the
session exactly, which makes a run replayable and auditable.

**Declared model.** Each district declares `mean`, `sd` and `drawdown` up
front. Higher-variance districts carry deeper drawdowns.

**Consequences follow exposure.** `applyShock` reads holdings and declared
drawdowns only. It has no access to what the player chose, so an outcome can
never be selected to justify a decision. A test asserts the function body
contains no reference to decisions.

**Counterfactuals.** `shockCounterfactual` computes what the same shock would
have cost under a different allocation of the same money, without mutating
state — so feedback can show the consequence of exposure rather than assert it.

**Full ledger.** Every value change records its cause, the total before and
the total after.

## Status

This layer is not yet wired into the Phaser game. It is standalone and tested
so it can be reviewed independently before replacing the existing scoring.
