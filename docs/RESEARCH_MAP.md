# Source-to-design map

**Status of the sources below.** The findings in column 2 are stated from
general knowledge of these publications. They have **not** been re-checked
against the full texts during this implementation. Before any of this is
presented externally, each row must be verified against the primary source
and this notice removed row by row.

None of these papers validates WealthSim's own scores, thresholds, labels or
translations. They motivate design choices; they do not certify results.

| Source | Supported claim (to verify) | Adaptation in WealthSim | Assumptions | Validation still needed |
|---|---|---|---|---|
| Holt & Laury (2002), *Risk Aversion and Incentive Effects*, AER | Risk attitudes can be elicited from a ladder of paired lotteries where one option's attractiveness rises; the switch row is informative. Incentive level matters. | Ch1 ladder: one fixed narrow contract vs a wide contract whose high-outcome chance rises 30→50→70%. Equal cost. Tested: no option dominates; risk-neutral switch is row 2. | Three rows, hypothetical credits, no real payment. | Reported only as a switch point — **no coefficient is fitted**. Whether three rows discriminate meaningfully is untested. |
| Frederick, Loewenstein & O'Donoghue (2002), *Time Discounting and Time Preference*, JEL | Measured intertemporal choice mixes pure time preference with uncertainty, liquidity needs and other confounds. | Ch4 separates an optional deferred benefit from a forced repair. The repair is tagged as a constraint and excluded from the timing pattern. | The repair variant is designed but **not yet built into the UI**. | One festival/university choice is reported as a single observation, never as impatience. |
| Odean (1998), *Are Investors Reluctant to Realize Their Losses?*, J. Finance | Account data showed gains realised more readily than losses, with alternative explanations examined. | Ch9 matched pairs: identical current value, prospects and fee; only purchase price differs. A fourth trial puts prospects and history in opposite directions and is counted separately. | Hypothetical holdings; three matched trials. | Reported as counts ("sold the gain 3 times, the loss 0 times"). The words *bias* and *disposition effect* are test-banned from the output. |
| Moore et al. (2017), *Confidence Calibration in a Multiyear Geopolitical Forecasting Competition*, Mgmt Sci | Confidence relative to accuracy can be studied over many repeated forecasts. | Ch10: four binary forecasts spread across the game, resolved by the seeded simulation. Brier score reported as *forecast accuracy*. | Four forecasts; financial-game setting differs from geopolitics. | Explicitly **not** called calibration. Distance from the model's own probability is reported separately. |
| Morewedge et al. (2015), *Debiasing Decisions*, PIBBS | Game-based training with personalised feedback reduced specific trained biases. | Post-feedback practice: one new equivalent decision chosen from an observed pattern, tagged `practice`, excluded from the profile. | Different biases from those studied. | The paper's effect sizes are **not** borrowed. Transfer is reported as changed/unchanged on one attempt, with no improvement claim. |
| Lusardi & Mitchell (2014), *The Economic Importance of Financial Literacy*, JEL | Financial knowledge is distinct from, and related to, economic decisions. | Behavioural summary never infers knowledge. Comprehension is tracked separately from choices. | Comprehension checks are designed but **not yet built into the UI**. | Not failing to understand an option must never become a personality statement. |

## Product rules that are not research findings

These are design choices. They are documented here so nobody mistakes them
for published parameters.

- **`MIN_PATTERN = 3`** — the minimum eligible observations before a pattern
  is called *repeated*. A coverage rule, not a reliability threshold.
- **Coverage labels** (`insufficient`, `single`, `limited`, `repeated`,
  `mixed`) describe how much evidence exists, not how confident a claim is.
- **District return model** (`mean`, `sd`, `drawdown` in `Sim.js`) is
  illustrative and chosen for coherence (higher variance, deeper drawdown).
  It is not calibrated to any market.
- **Concentration** is normalised against the evenest *feasible* split
  (`[2,2,1,1]` for 6 units in 4 districts) and labelled concentration, not
  total investment risk.
- **Largest-share threshold of 50%** for the concentration reading is a
  presentation choice.
