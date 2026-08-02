"""Build the one-row-per-student feature table that segmentation clusters on."""

import numpy as np
import pandas as pd

from .data_loader import Dataset


def _domain_speed_z(long: pd.DataFrame) -> pd.Series:
    """Z-score avg_time_seconds *within each domain*.

    Raw seconds would confound pace with domain choice - GK questions are read
    faster than Calculus ones - so a student who only sits GK papers would look
    artificially fast. Standardising inside the domain removes that.
    """
    grp = long.groupby("exam_domain")["avg_time_seconds"]
    mean = grp.transform("mean")
    std = grp.transform("std").replace(0, np.nan)
    return ((long["avg_time_seconds"] - mean) / std).fillna(0.0)


def build_student_features(ds: Dataset) -> pd.DataFrame:
    long = ds.long.copy()
    long["speed_z_row"] = _domain_speed_z(long)

    rows = []
    for student_id, d in long.groupby("student_id"):
        attempted = d["questions_attempted"].sum()
        correct = d["correct_count"].sum()

        # Weighted by question count, not a mean of percentages: topics carry
        # between 5 and 12 questions, so an unweighted mean over-counts short ones.
        overall_accuracy = 100.0 * correct / attempted

        # Total working time in minutes, from per-question averages.
        total_minutes = (d["avg_time_seconds"] * d["questions_attempted"]).sum() / 60.0

        topic_acc = d.groupby("topic")["accuracy_pct"].mean()

        rows.append(
            dict(
                student_id=student_id,
                overall_accuracy=overall_accuracy,
                mean_theta=d.groupby("attempt_id")["irt_theta"].first().mean(),
                speed_z=d["speed_z_row"].mean(),
                changes_per_question=d["answer_changes_total"].sum() / attempted,
                # Consistency across topics. One topic only -> no spread to measure.
                topic_acc_std=topic_acc.std() if len(topic_acc) > 1 else 0.0,
                # The single-weak-topic signature: how far the worst topic sits
                # below the student's own average.
                weakness_depth=(topic_acc.mean() - topic_acc.min()) if len(topic_acc) > 1 else 0.0,
                accuracy_per_minute=correct / total_minutes if total_minutes > 0 else 0.0,
                n_domains_attempted=d["exam_domain"].nunique(),
                n_attempts=d["attempt_id"].nunique(),
                n_topics_seen=len(topic_acc),
                questions_attempted=int(attempted),
            )
        )

    feats = pd.DataFrame(rows).set_index("student_id")
    return feats.join(ds.students.set_index("student_id")[
        ["name", "age", "grade_level", "goal", "preferred_domain"]
    ])


def build_topic_cohort_stats(ds: Dataset) -> pd.DataFrame:
    """Cohort mean/std per topic for accuracy, time and answer changes.

    Diagnosis compares a student against these, so 'weak' means weak relative to
    peers on the same topic rather than against a global constant.
    """
    stats = ds.long.groupby("topic").agg(
        acc_mean=("accuracy_pct", "mean"),
        acc_std=("accuracy_pct", "std"),
        time_mean=("avg_time_seconds", "mean"),
        time_std=("avg_time_seconds", "std"),
        chg_mean=("answer_changes_total", "mean"),
        chg_std=("answer_changes_total", "std"),
        n_observations=("accuracy_pct", "size"),
    )
    # A zero std would make every z-score infinite; treat it as "no spread".
    for col in ["acc_std", "time_std", "chg_std"]:
        stats[col] = stats[col].replace(0, np.nan).fillna(1.0)
    return stats


def build_student_topic_table(ds: Dataset) -> pd.DataFrame:
    """One row per student x topic, aggregated across that student's attempts."""
    agg = ds.long.groupby(["student_id", "topic"]).agg(
        questions=("questions_attempted", "sum"),
        correct=("correct_count", "sum"),
        avg_time_seconds=("avg_time_seconds", "mean"),
        answer_changes=("answer_changes_total", "sum"),
        times_seen=("attempt_id", "nunique"),
        last_seen=("attempt_date", "max"),
    ).reset_index()
    agg["accuracy_pct"] = 100.0 * agg["correct"] / agg["questions"]
    agg["changes_per_question"] = agg["answer_changes"] / agg["questions"]
    agg["domain"] = agg["topic"].map(_topic_to_domain(ds))
    return agg


def _topic_to_domain(ds: Dataset) -> dict:
    return ds.long.drop_duplicates("topic").set_index("topic")["exam_domain"].to_dict()
