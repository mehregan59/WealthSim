# WealthSim visual patch — apply and push handoff

This is implemented code, not a request to repeat the design/research prompt.

## Base and scope

Apply on top of `43f990c` (Fix contract and forecast evidence recording and resolution). That revision already contains the earlier feedback patch. Do not apply that earlier patch again.

This patch preserves the ten-chapter routing and the core Adapter/Evidence/Summary rules. It adds:

- A city-first opening with optional city naming, English/German selection, quick play, and a separate background-question route. Quick play leaves stated answers absent; it does not fabricate a baseline. The original question-first sequence remains available. Session mode is recorded separately.
- Correct district coordinates/colours, narrow-screen two-row layout, pastel buildings, cream paths, pocket gardens, soft shadows, more visible citizens and stable daylight.
- Native HTML decision cards and consequence/report panels. These support keyboard focus, touch, readable text and scrolling while leaving the city visible.
- Six-unit allocation through guarded district buttons or map taps. It replaces the active broken cube-spawn path (which passed an object where ResourceCube expected x/y). Existing decision/economy callbacks are reused. The inherited fallback drag code is not claimed repaired.
- Help, pause/resume, text enlargement and reduced-motion controls. Decorative movement is frozen in reduced motion; lightning, shake and district particle effects are suppressed. This is not a claim that every inherited transition is motion-free.
- An accessible HTML ending showing factual choices before interpretations, observation coverage, alternatives, stated/observed comparisons, replay suggestions and limitations. It reads the real Summary output. No new scores or persona thresholds.
- A new replay control that clears decisions, answers and personal context before a fresh city.
- Correct frame-duration arguments for cars/rain, and removal of a call to nonexistent Economy.level7Start.

No new dependencies, image downloads, additional chapters, financial prescriptions or claimed scientific validation.

## Executed verification

`node test/verify-visual.cjs` passed on the patch contents:

- 18 presentation/flow checks, including one complete ten-chapter route through the new controls into the real Summary, with four resolved forecasts and zero unsupported actions on that route.
- 8 feedback integration checks.
- 20 economy, 30 evidence, 13 localization-key and 28 simulation checks.
- Total: 117 passing checks.
- JavaScript syntax checks and `git diff --check` passed.
- District geometry checked at initial widths 390, 768 and 1366 px; actual procedural District drawing was executed with graphics stubs and checked for non-finite geometry.
- Patch applicability checked against the stated base.

These are Node tests. The native element and Phaser drawing interfaces are mocked; they do not establish pixel layout, browser performance or screen-reader behavior. The full route exercises actual GameScene callbacks, actual simulation and actual evidence modules; those are not stubbed. Not every alternative branch is covered.

## Apply/push procedure

1. Preserve unrelated work. Verify the current target includes the stated base and earlier feedback fixes.
2. On a clean branch, use `git am /path/to/WealthSim_visual_upgrade.patch`.
3. If the working tree matches the stated base, the checks above have already been run. A repeat of the entire research audit or previous prompt is not requested. If there are intervening edits or conflicts, resolve only those conflicts, preserve newer work, and run `node test/verify-visual.cjs` once.
4. Push the resulting branch/commit using the authorized GitHub connection. Do not force-push or rewrite published history. Report the branch and commit. If pushing the deployment branch, clearly state that this publishes the changes.

## Honest remaining limitations

The cloud browser previously blocked the local preview. This patch has NOT had a rendered browser playthrough or pixel inspection. It is appropriate to push for preview/review, but it must not be called visually verified or production-ready solely from the Node checks.

The remaining visual smoke check is narrow: open a preview, inspect opening/city/decision/report layouts, complete one ten-chapter run, and click the new replay button. Check console output and one narrow viewport. This is not a request to repeat paper validation, redesign the game, or rerun all previous analyses.

Legacy chapter/harness test failures recorded in FEEDBACK_VERIFICATION.md are outside this patch; they have not been relabelled as passing. Some inherited chapter prose remains English in German mode, although the new UI copy supports both languages. Live window resizing/orientation changes, broader research claims, all alternative decision branches, and effects of shortened onboarding on research comparability are not validated here. Visual state reflects the existing city-health/resource mechanics, not a reconstruction of real financial outcomes.

This implements the visual/pacing portion of the earlier prompt. It does not claim every research, usability-interview, scenario-redesign or scientific-validation requirement from that longer prompt is complete.
