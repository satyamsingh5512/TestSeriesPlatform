"""Work out *where* a student is losing marks and *why*.

Segmentation says what kind of test-taker someone is. This module works at the
student x topic level: for every topic a student has touched, it compares them
against the cohort on the same topic and classifies the failure mode from the
accuracy / time / answer-changes triple.
"""

import numpy as np
import pandas as pd
import yaml

from . import config

# Mistake types. The keys are what advice_bank.yaml is keyed on.
GUESSING = "guessing_or_rushing"
CONCEPTUAL = "conceptual_gap"
SECOND_GUESSING = "shaky_concept_second_guessing"
NOT_FLUENT = "correct_but_slow"
MASTERED = "mastered"
STEADY = "on_track"


def _classify(acc_z, time_z, chg_z, accuracy_pct, is_weak) -> str:
    """Bucket one student-topic cell into a failure mode.

    The three signals disambiguate causes that raw accuracy cannot: fast + wrong
    + lots of changes is a behaviour problem, slow + wrong + few changes is a
    knowledge problem, and they need opposite interventions.
    """
    if not is_weak:
        if accuracy_pct >= config.MASTERED_ABS_ACC and time_z <= config.SLOW_Z:
            return MASTERED
        if time_z > config.SLOW_Z:
            return NOT_FLUENT
        return STEADY

    fast = time_z < config.FAST_Z
    slow = time_z > config.SLOW_Z
    churny = chg_z > config.HIGH_CHANGES_Z

    if fast and churny:
        return GUESSING
    if fast:
        return GUESSING
    if slow and churny:
        return SECOND_GUESSING
    if slow:
        return CONCEPTUAL
    if churny:
        return SECOND_GUESSING
    return CONCEPTUAL


def diagnose(student_topics: pd.DataFrame, cohort_stats: pd.DataFrame) -> pd.DataFrame:
    """Attach z-scores, a weakness flag and a mistake type to every student x topic row."""
    df = student_topics.merge(cohort_stats, left_on="topic", right_index=True, how="left")

    df["acc_z"] = (df["accuracy_pct"] - df["acc_mean"]) / df["acc_std"]
    df["time_z"] = (df["avg_time_seconds"] - df["time_mean"]) / df["time_std"]
    # Compare like with like: cohort change counts are per topic-row, so scale
    # the student's total by how many times they saw the topic.
    df["chg_per_sitting"] = df["answer_changes"] / df["times_seen"]
    df["chg_z"] = (df["chg_per_sitting"] - df["chg_mean"]) / df["chg_std"]

    df[["acc_z", "time_z", "chg_z"]] = df[["acc_z", "time_z", "chg_z"]].fillna(0.0)

    df["is_weak"] = (df["acc_z"] < config.WEAK_TOPIC_Z) | (df["accuracy_pct"] < config.WEAK_TOPIC_ABS_ACC)

    df["mistake_type"] = [
        _classify(r.acc_z, r.time_z, r.chg_z, r.accuracy_pct, r.is_weak)
        for r in df.itertuples()
    ]

    # Severity drives ordering in the report and the remediation score later.
    df["severity"] = np.where(
        df["is_weak"],
        (config.WEAK_TOPIC_ABS_ACC - df["accuracy_pct"]).clip(lower=0) / 50.0
        + (-df["acc_z"]).clip(lower=0) / 3.0,
        0.0,
    )
    return df


def load_advice_bank(path: str = None) -> dict:
    path = path or config.ADVICE_BANK_PATH
    with open(path) as fh:
        return yaml.safe_load(fh)


def advice_for(bank: dict, mistake_type: str, topic: str) -> dict:
    """Topic-specific advice when it exists, otherwise the generic entry."""
    entry = dict(bank["mistake_types"].get(mistake_type, bank["mistake_types"][STEADY]))
    override = bank.get("topic_overrides", {}).get(topic, {}).get(mistake_type)
    if override:
        entry["how_to_fix"] = override
    return entry


def student_report(student_id, diag: pd.DataFrame, bank: dict, max_topics: int = 4) -> dict:
    """Human-readable weak-topic breakdown for one student."""
    d = diag[diag["student_id"] == student_id]
    weak = d[d["is_weak"]].sort_values("severity", ascending=False).head(max_topics)
    strong = d[d["mistake_type"] == MASTERED].sort_values("accuracy_pct", ascending=False)

    items = []
    for r in weak.itertuples():
        a = advice_for(bank, r.mistake_type, r.topic)
        items.append(
            dict(
                topic=r.topic,
                domain=r.domain,
                accuracy_pct=round(r.accuracy_pct, 1),
                cohort_accuracy_pct=round(r.acc_mean, 1),
                mistake_type=r.mistake_type,
                what_is_happening=a["what_is_happening"],
                how_to_fix=a["how_to_fix"],
                evidence=(
                    f"{r.accuracy_pct:.0f}% vs cohort {r.acc_mean:.0f}%, "
                    f"{r.avg_time_seconds:.0f}s per question vs {r.time_mean:.0f}s, "
                    f"{r.chg_per_sitting:.1f} answer changes per sitting vs {r.chg_mean:.1f}"
                ),
            )
        )

    return dict(
        student_id=student_id,
        weak_topics=items,
        strong_topics=strong["topic"].tolist()[:3],
        n_weak_topics=int(d["is_weak"].sum()),
        n_topics_seen=int(len(d)),
    )
