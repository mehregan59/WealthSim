/* WealthSim — js/scoring.js
 *
 * DEPRECATED. This file is no longer loaded by index.html and plays no
 * role in the current game.
 *
 * Replaced by:
 *   js/core/Evidence.js  — action registry, observation extraction, coverage labels
 *   js/core/Summary.js   — template-driven result sentences; one scoring pipeline
 *   js/core/Chapters.js  — Ch1 pairs, Ch9 trials, Ch10 forecasts
 *   js/core/Economy.js   — seeded district simulation
 *   js/core/Sim.js       — simulation runner
 *   js/core/Adapter.js   — bridges GameScene → Evidence / Summary
 *
 * The old ScoringEngine used numeric 0–100 trait scores and a persona
 * assignment function. Both are superseded. The old implementation:
 *   - Silently returned 50 for unrecognised actions (violates rule 1 in Evidence.js).
 *   - Mixed stated preference and observed behaviour into a single blended score.
 *   - Could describe a player as "diversified" regardless of actual allocation.
 *   - Scored response latency as a psychological trait (contra brief §4).
 *
 * This file is kept in the repository to avoid 404 errors on any cached
 * references. Do not load it. Do not declare a new ScoringEngine here —
 * the active ScoringEngine is defined in GameScene.js and delegates to
 * the js/core/ pipeline.
 */
