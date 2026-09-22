# Validation plan

Three different questions, answered by three different kinds of evidence.
Passing one says nothing about the others.

## 1. Software correctness — *does the code do what it says?*

Covered now by 149 automated tests (`node test/*.test.js`): unknown actions
never become neutral scores, absent data is `insufficient`, research never
replaces the final choice, duplicate clicks are not extra evidence, money is
conserved, shocks follow exposure only, seeded runs are reproducible,
practice never enters the profile, and English and German carry the same
facts, numbers and coverage labels.

**Play-throughs.** `test/gamescene.harness.test.js` runs the real
`GameScene` through all eight levels for the three paths the brief requires
(concentrated/risk-seeking, cautious, evidence-responsive), with a stand-in
Phaser. It checks each path finishes, that final money equals the pure
economy model for the same seed and choices, and that Retry reproduces the
same market. Mutation checks confirmed it fails when the wiring is broken.

**Not yet covered:** actual rendering in a browser — layout, overlap,
readability and touch input. The harness replaces all drawing with no-ops, so
it proves the logic runs, not that the screens look right. The cautious path
also still lacks a genuine liquidity need (the Chapter 4 repair variant is
not built yet).

## 2. Educational effectiveness — *does playing help people decide better?*

Nothing here is established yet.

1. **Comprehension and usability interviews** (small, varied financial
   experience). Can players say what each option does? Do they read the
   coverage tags correctly as "how much evidence", not "how sure"?
2. **Prespecified comparison** against suitable educational material
   (e.g. a well-made text explainer) rather than against no treatment.
3. **Parallel-form outcome tasks** — decisions that are structurally
   equivalent to the game's but not identical, so success is not just
   memorising the taught answer.
4. **Delayed follow-up** to see whether any difference persists.

## 3. Measurement validity — *do the patterns mean what their names say?*

Required before any dimension is described as a trait:

- **Reliability** — do repeated sessions give similar patterns?
- **Convergent and discriminant validity** — do dimensions relate to
  established measures where they should, and not where they should not?
- **Language equivalence** — do English and German versions function the
  same way for comparable players, not just contain the same words?
- **Generalisation** — do in-game patterns relate to real decisions at all?

Sample size for any confirmatory study must be derived from the intended
analysis and the precision required, not from a universal rule of thumb.

## Boundaries

- An initial playtest can find defects. It cannot certify validity.
- Research participation and data collection must be optional and separate
  from ordinary play, with no unnecessary personal data stored.
- Until the steps above are done, the game is an educational session
  summary. It must not be described as a validated assessment.
