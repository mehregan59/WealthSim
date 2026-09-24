# WealthSim — Future Validation Plan

This document distinguishes three separate questions that require different evaluation methods. They cannot be answered by the same data.

---

## 1. Software correctness

**What it means:** The code does what the specifications say.

**How to assess:**

- Run `node test/gamescene.harness.test.js` to verify action recognition, Brier arithmetic, practice isolation, cash/holdings reconciliation, seeded replay determinism, and three complete player paths.
- Check that every action offered in the game has an explicit entry in `js/core/Evidence.js`. Actions with no entry must surface as `unsupported`, never as a neutral score.
- Check that the concentrated-Strategist regression case (all six cubes to technology, choosing university, holding at chapters 5/7/8, declining chapter 6) no longer produces "diversified" or "information-seeking" in the result.
- Verify English and German templates have identical keys (already asserted in tests).

**Current status:** Test harness covers the cases above. Three full paths (concentrated, cautious, evidence-responsive) are defined and runnable. Unresolved blockers are reported in test output.

---

## 2. Educational effectiveness

**What it means:** Players who use WealthSim understand relevant financial concepts better, or make better decisions in practice, compared to a suitable alternative.

**How to assess:**

### Phase 1 — Comprehension and usability (prerequisite)
- Five to ten individual interviews with players of varied financial experience.
- Confirm that chapter scenarios are intelligible, that the final result screen is readable, and that no scenario is systematically misunderstood in a way that would confound measurement.
- Output: list of revision priorities, not an effectiveness claim.

### Phase 2 — Expert review
- Ask two or three subject-matter experts (one behavioural economist, one financial educator, one German pension specialist) to review the construct-to-scenario mapping in `RESEARCH_MAP.md`.
- Each expert reviews: whether the scenario is a plausible elicitation of the target dimension; whether the result text is accurate and non-misleading; whether the German pension content is current.
- Output: list of content corrections, not a validity claim.

### Phase 3 — Pilot
- Twenty to forty participants with varied financial experience.
- Measure: session completion rate, time on task, any systematic confusion with controls or choices.
- Collect free-text responses on the result screen: did players recognise their own choices in the descriptions?
- Output: revised scenarios and result text; not an effectiveness estimate.

### Phase 4 — Comparative evaluation (educational claim)
- Prespecified comparison with a suitable educational alternative (e.g. a matched video explanation of the same concepts, or an equivalent text-based case study).
- Outcome measures:
  - Knowledge: parallel-form financial knowledge questions not used during play.
  - Decision: one or two new equivalent decision tasks not drawn from the game itself.
  - Follow-up: the same measures four to eight weeks later to test persistence.
- Do not use the identical taught choices as the sole success measure.
- Determine sample size from the intended analysis and power requirements (not a universal minimum); a small pilot can estimate variance for this purpose.
- Preregister the analysis before data collection.

---

## 3. Psychological measurement validity

**What it means:** WealthSim's dimensions measure what they claim to measure, reliably, in the way they are described.

**This is a much higher bar than educational effectiveness.** It requires evidence that WealthSim currently does not and cannot claim.

**Steps required before any measurement claim:**

### Reliability
- Test–retest: administer the game twice to the same participants, weeks apart, with different seeded scenarios. Compute agreement on coverage labels and individual choices.
- Internal consistency is not well-defined here (choices within a session are not parallel items); report test–retest kappa or correlation instead.

### Construct validity
- Convergent: do players who show `repeated` risk-seeking in WealthSim score similarly on an established risk-preference measure (e.g. a validated financial risk tolerance scale)?
- Discriminant: do the dimensions not correlate with things they should not correlate with (e.g. reading speed, device type, language chosen)?

### Language equivalence
- Professional back-translation of German text by a native-speaker psychologist, not just a bilingual developer.
- Test that English and German sessions produce similar coverage distributions on comparable samples.

### Generalisation
- Do patterns observed in WealthSim predict behaviour in a different domain (e.g. a real financial decision task) or at a later date?
- This is the claim that would be most practically useful and requires the most evidence.

### Confirmatory sample size
- Determine from the intended analysis and precision requirements.
- Do not use an invented universal minimum (e.g. "100 per group").
- For a correlation claim, a target precision of ±0.1 at 80% power requires approximately 800 participants; adjust for the specific statistic and design.

---

## What an initial playtest can and cannot establish

An initial playtest can:
- Reveal bugs, confusing scenarios, and UI problems.
- Confirm that scenarios are intelligible to the target audience.
- Provide preliminary data on completion rate and time.

An initial playtest cannot:
- Certify that any dimension is reliably measured.
- Establish that the game produces educational change.
- Justify any claim that WealthSim profiles are scientifically valid.

---

## Research participation and data

Research participation and optional data collection must be kept separate from ordinary play:
- Players must be able to complete the game without consenting to research data collection.
- Any data collected for validation purposes must comply with GDPR and relevant ethical guidelines.
- No personal identifying information should be stored by default.
- Session data (decision events, forecast events) should be stored locally or with explicit informed consent.
