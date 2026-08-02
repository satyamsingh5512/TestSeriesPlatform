# Student Analytics — Segmentation & Test Recommendation

Two systems over one Excel workbook of test data:

1. **Segmentation** — group students into 5 performance segments, and for each
   one say *where* they are losing marks and *why*, with concrete fixes.
2. **Test recommendation** — rank the next tests a student should sit, based on
   their weak topics, measured ability, goal, grade and preferences.

## Running it

```bash
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
./.venv/bin/python generate_dummy_data.py     # rebuild the workbook
./.venv/bin/python -m src.pipeline            # fit, diagnose, recommend, evaluate
```

Outputs land in `reports/` (per-student cards as JSON, segment summary,
topic-level diagnosis) and `models/segmentation.joblib`.

## Layout

| File | Role |
|---|---|
| `generate_dummy_data.py` | Builds the 4-sheet workbook: students, exams, attempts, topic_performance |
| `src/config.py` | Every tunable: k, feature list, thresholds, scoring weights |
| `src/data_loader.py` | Load + validate the workbook, join into a long frame |
| `src/features.py` | Student-level feature table, cohort stats, student×topic table |
| `src/segmentation.py` | k selection, KMeans fit, cluster naming, validation |
| `src/diagnosis.py` | Per-topic mistake classification |
| `src/advice_bank.yaml` | All student-facing advice text — edit without touching code |
| `src/recommender.py` | Eligibility filters, scoring blend, diversification, explanations |
| `src/evaluate.py` | Guardrails + leave-last-out ranking harness |
| `src/pipeline.py` | End-to-end run and report generation |

## How segmentation works

Eight features per student, aggregated across all attempts:

`overall_accuracy`, `mean_theta`, `speed_z`, `changes_per_question`,
`topic_acc_std`, `weakness_depth`, `accuracy_per_minute`, `n_domains_attempted`

Two deliberate choices worth knowing:

- **Accuracy is question-weighted**, not a mean of percentages. Topics carry
  5–12 questions each, so an unweighted mean over-counts short topics.
- **Speed is z-scored within domain.** Raw seconds would confound pace with
  domain choice — GK questions read faster than Calculus ones, so a student who
  only sits GK papers would look artificially quick.

`persona` in the workbook is ground truth for validation only and is never a
model input, because real data will not have it.

### Results on the current dummy data

| metric | value |
|---|---|
| k chosen | 5 |
| silhouette | 0.341 |
| bootstrap stability (25 refits) | 0.976 |
| KMeans vs GMM agreement (ARI) | 0.92 |
| ARI vs hidden personas | **0.910** |

**On k:** silhouette's argmax is k=4, but k=4 merges strong-and-fast students
into strong-but-slow ones — they sit close in feature space because they differ
mainly on pace. Those two groups need opposite interventions (harder papers vs
clock discipline), so collapsing them defeats the point of segmenting. k=5 is a
documented override in `config.K_OVERRIDE`; set it to `None` for pure silhouette
selection.

## How diagnosis works

For each student × topic, z-score accuracy, time and answer-changes against the
cohort **on that same topic**, then read the combination:

| accuracy | time | changes | diagnosis | fix |
|---|---|---|---|---|
| low | fast | high | Guessing / rushing | Slow the first pass; timed accuracy drills |
| low | slow | low | **Conceptual gap** | Stop timed practice; relearn, then easy tier |
| low | slow | high | Shaky + second-guessing | Revise concept + commit-to-first-answer rule |
| high | slow | — | Correct but not fluent | Speed drills on known material |
| high | fast | — | Mastered | Move up a tier |

The three signals separate causes that raw accuracy cannot: fast-and-wrong is a
behaviour problem, slow-and-wrong is a knowledge problem, and they need opposite
interventions. A topic is flagged weak at z < −0.8 **or** accuracy < 50%.

## How recommendation works

No ratings and no repeat-view history exist, so collaborative filtering is not
available. This is a hybrid content + rule scorer.

**Hard filters:** goal relevance, grade band (±1 grade of slack), difficulty
ceiling (θ + 1.0), and anything sat in the last 21 days.

**Scoring blend** (weights in `config.REC_WEIGHTS`):

| component | weight | what it does |
|---|---|---|
| `remediation` | 0.35 | Overlap with weak topics, severity-weighted |
| `difficulty_fit` | 0.20 | Peaks at θ + 0.3 — just above current ability |
| `goal_domain_affinity` | 0.15 | Match to stated goal, grade, preferred domain |
| `coverage` | 0.10 | Rewards untouched domains and topics |
| `peer_signal` | 0.10 | How same-segment students scored — the CF seam |
| `recency_penalty` | 0.10 | Decays recently-sat papers |

Then a per-domain cap (max 2) so the list isn't five near-identical papers, and
a plain-language reason on every pick.

**Two exceptions that matter**, both found by the guardrails during the build:

- *Remediation overrides goal tagging.* A NEET student weak in Trigonometry
  could never be sent a Math paper, since Math is tagged JEE/Banking. This was
  causing 50 of 52 uncovered weak topics. Off-syllabus papers now pass the goal
  filter if they target a weak topic, are ranked lower via the affinity term,
  and say so in their explanation. Worst-topic coverage went 45% → 95%.
- *The difficulty floor.* Students at θ ≈ −2.3 sit below the easiest tier on
  offer, emptying the eligible set. The fallback returns the gentlest available
  papers — never by lifting the ceiling, which would send someone already
  drowning a harder paper.

**Cold start:** no history → skip remediation and peer terms, set a default θ
from grade level, recommend easy-tier papers in the student's goal domains.

## Evaluation — read the two halves differently

**Guardrails are the real evaluation** (150 students sampled):

| check | result |
|---|---|
| empty recommendation lists | 0 |
| difficulty overreach violations | 0 |
| goal mismatch violations | 0 |
| worst topic covered in top 5 | 95% |

**Leave-last-attempt-out ranking is near-meaningless on this data**: recall@5
0.15 vs a 0.125 random baseline. That is expected, not a defect —
`generate_dummy_data.py` picks each attempt's exam uniformly at random within a
domain, so *which* specific paper a student sat next carries no signal to learn.
The harness is in place so the metric becomes informative the moment real
attempt data replaces the dummy workbook.

## Known limitations

- **Topic granularity, not question.** There is no per-question data, so
  diagnosis resolves to topics. Sub-concept diagnosis needs a question-response
  table.
- **`peer_signal` is a placeholder.** Mean same-segment score per exam, shrunk
  toward the global mean. It becomes a real CF term once there is genuine
  interaction data.
- **Ranking quality is unvalidated.** See above — the guardrails prove the
  output is *sane*, not that it is *optimal*.
- **Advice is static text.** Good enough for a first version; a real deployment
  would want it reviewed by subject teachers.
