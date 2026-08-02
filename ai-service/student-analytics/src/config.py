"""Central knobs for the whole pipeline.

Everything a domain expert might want to retune lives here rather than being
scattered through the modules.
"""

import os

# --- paths -----------------------------------------------------------------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, "data", "student_data.xlsx")
MODEL_DIR = os.path.join(ROOT, "models")
REPORT_DIR = os.path.join(ROOT, "reports")
ADVICE_BANK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "advice_bank.yaml")

# --- segmentation ----------------------------------------------------------
# The brief caps the number of groups; we search inside that range and let
# silhouette pick, rather than hardcoding k.
K_RANGE = range(3, 8)

# Deliberate override of the silhouette argmax.
#
# Silhouette prefers k=4 (0.377 vs 0.341), but k=4 merges the strong-and-fast
# students into the strong-but-slow ones - they sit close together in feature
# space because they differ mainly on pace, not accuracy. Those two groups need
# opposite interventions (harder papers vs clock discipline), so collapsing them
# destroys the reason for segmenting at all. k=5 also matches the underlying
# structure far better (ARI 0.91 vs 0.76 against the hidden persona labels).
# Set to None to fall back to pure silhouette selection.
K_OVERRIDE = 5

FEATURE_COLUMNS = [
    "overall_accuracy",
    "mean_theta",
    "speed_z",
    "changes_per_question",
    "topic_acc_std",
    "weakness_depth",
    "accuracy_per_minute",
    "n_domains_attempted",
]

RANDOM_STATE = 42

# --- diagnosis -------------------------------------------------------------
# A topic is "weak" if it is bad relative to the cohort OR bad in absolute terms.
WEAK_TOPIC_Z = -0.8         # z-score vs cohort on the same topic
WEAK_TOPIC_ABS_ACC = 50.0   # accuracy % below which a topic is weak regardless
MASTERED_ABS_ACC = 80.0

# Thresholds (in cohort z-units) used to bucket a topic into a mistake type.
SLOW_Z = 0.5
FAST_Z = -0.5
HIGH_CHANGES_Z = 0.5

# --- recommender -----------------------------------------------------------
# Weights for the scoring blend. They are normalised at use time, so these are
# relative importances, not required to sum to 1.
REC_WEIGHTS = {
    "remediation": 0.35,        # covers topics the student is weak at
    "difficulty_fit": 0.20,     # slightly above current ability
    "goal_domain_affinity": 0.15,
    "coverage": 0.10,           # untouched domains/topics
    "peer_signal": 0.10,        # what similar students did well on
    "recency_penalty": 0.10,    # discourage re-taking what was just done
}

# Target the zone of proximal development: aim a little above measured ability.
ZPD_OFFSET = 0.3
# Never recommend an exam more than this far above the student's theta.
MAX_DIFFICULTY_STRETCH = 1.0
# Exams attempted within this many days are filtered out entirely.
RECENCY_BLOCK_DAYS = 21
# Decay horizon for the soft recency penalty.
RECENCY_HALFLIFE_DAYS = 60
# Cap on how many recommendations may come from any one domain.
MAX_PER_DOMAIN = 2
TOP_K = 5
