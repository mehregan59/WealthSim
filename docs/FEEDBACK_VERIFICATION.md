# Feedback repair verification — 2026-09-25

Base: 4e95d90dc4397797e89f3a102256dc158d152f32.

## Confirmed defects repaired

- GameScene's Chapter 1 narrow/wide choices lacked the ch1:pair scenario. The legacy Adapter also discarded trial IDs, collapsing the three trials. New records now identify the scenario; legacy records preserve pair identity. The ch1_done routing marker is explicitly excluded from decision evidence.
- Forecast records lacked canonical scenario/action/probability metadata. Their in-scene copies never received outcomes, so neither the chapter nor final report could calculate actual accuracy. The scene and ScoringEngine now share the recorded event, resolved from the next Economy report containing simulated annual returns. Resolution occurs once, without another random draw or any change to balances.
- The forecast question was not shown and referenced nonexistent questionEn/questionDe fields. It now uses Chapters.forecastText and is displayed above the choices.
- f4 was asked before and again after the final simulated year. The duplicate after the storm is removed; it could never resolve.
- Reset left levelStartTime behind. It now clears the timer as well as decisions and starting answers.

Legacy unresolved forecasts remain unresolved: no historical outcome is invented. Unknown actions still surface as unsupported.

## Executed tests

Run `node test/feedback.integration.test.js` from the repository root: 8 checks pass. This executes actual GameScene decision callbacks and the actual ScoringEngine, Adapter, Evidence, Chapters, Economy, Sim, and Summary modules. Drawing and scene navigation are stubbed. It also invokes the real callback registered by ProfileScene's Play Again control; this is not a physical browser click.

Additional existing suites: economy 20/20, evidence 30/30, i18n 13/13, sim 28/28.

The root package is ESM while core modules and tests use CommonJS. Scoped package.json files in js/core and test make the documented Node commands executable without changing the root application or browser script behavior.

Existing failures remain and are not represented as passing:
- chapters.test.js: 36 pass, one fails because the expected ch9:review summary row is absent in its fixture.
- gamescene.harness.test.js: stale visual stubs fail on boundary.beginPath, followed by repeated GameScene declaration failures. Its Summary/Adapter stubs also cannot establish feedback correctness. Repairing this older harness is separate from the focused real-module regression suite.

## Browser status and remaining work

The deployed game's opening was visually inspected. The browser rejected the local fixed build URL with ERR_BLOCKED_BY_CLIENT. No complete fixed-build browser playthrough, rendered final-report comparison, or physical Play Again click is claimed.

Before merging: serve this branch in an accessible preview; play all 10 chapters through the UI; compare recorded choices and displayed risk/forecast feedback; check for unsupported records; click Play Again and inspect the new run; capture console errors and screenshots. Retry-level behavior and scientific validation are not established by these tests. This change is not a visual redesign or a claim of psychological validity.
