"""Evaluation for both halves of the system.

Segmentation is scored with internal metrics plus ARI against the generator's
hidden personas. The recommender has no ground truth of "what the student
*should* have taken", so it gets a leave-last-out proxy (does it rank the exam
they actually sat next?) plus hard guardrail assertions.

Read the two very differently on this dataset:

  * The guardrails are the real evaluation. They assert properties the output
    must have - no empty lists, no paper beyond the difficulty ceiling, no
    off-syllabus paper that is not remediating a weak topic, and the student's
    worst topic actually appearing in the list.

  * The leave-last-out ranking numbers are close to meaningless here, and are
    reported only to keep the harness in place for real data. generate_dummy_data
    picks each attempt's exam uniformly at random within a domain, so *which*
    specific paper a student sat next carries no signal to learn. Scoring near
    the random baseline is the correct result, not a defect. On real data, where
    exam choice reflects intent, these numbers become informative.
"""

import numpy as np
import pandas as pd

from . import config, diagnosis, features
from .data_loader import Dataset
from .recommender import Recommender


def evaluate_recommender_leave_last_out(ds: Dataset, assigned, max_students=200) -> dict:
    """Hide each student's final attempt, then see where the held-out exam ranks.

    Only students with 2+ attempts qualify, since the model needs some history
    left over after the last attempt is removed.
    """
    counts = ds.attempts.groupby("student_id").size()
    eligible = counts[counts >= 2].index.tolist()
    rng = np.random.default_rng(config.RANDOM_STATE)
    if len(eligible) > max_students:
        eligible = list(rng.choice(eligible, size=max_students, replace=False))

    last = (
        ds.attempts[ds.attempts["student_id"].isin(eligible)]
        .sort_values("attempt_date")
        .groupby("student_id")
        .tail(1)
    )
    held_out_ids = set(last["attempt_id"])
    truth = last.set_index("student_id")["exam_id"].to_dict()

    # Rebuild every derived table from history only, so nothing about the
    # held-out attempt leaks into the features the recommender scores on.
    trunc = _truncate(ds, held_out_ids)
    feats = features.build_student_features(trunc)
    cohort = features.build_topic_cohort_stats(trunc)
    st = features.build_student_topic_table(trunc)
    diag = diagnosis.diagnose(st, cohort)

    rec = Recommender(trunc, diag, assigned.reindex(feats.index).dropna(subset=["cluster"]))

    hits_at_5, hits_at_10, rr = [], [], []
    for sid in eligible:
        if sid not in feats.index or sid not in truth:
            continue
        recs = rec.recommend(sid, feats.loc[sid], top_k=10, explain=False)
        ids = [r["exam_id"] for r in recs]
        target = truth[sid]
        hits_at_5.append(target in ids[:5])
        hits_at_10.append(target in ids[:10])
        rr.append(1.0 / (ids.index(target) + 1) if target in ids else 0.0)

    n_exams = len(ds.exams)
    return dict(
        n_evaluated=len(hits_at_5),
        recall_at_5=float(np.mean(hits_at_5)) if hits_at_5 else 0.0,
        recall_at_10=float(np.mean(hits_at_10)) if hits_at_10 else 0.0,
        mrr=float(np.mean(rr)) if rr else 0.0,
        random_baseline_at_5=5.0 / n_exams,
    )


def _truncate(ds: Dataset, drop_attempt_ids: set) -> Dataset:
    keep = ~ds.attempts["attempt_id"].isin(drop_attempt_ids)
    attempts = ds.attempts[keep].copy()
    topics = ds.topics[ds.topics["attempt_id"].isin(set(attempts["attempt_id"]))].copy()
    long = ds.long[ds.long["attempt_id"].isin(set(attempts["attempt_id"]))].copy()
    return Dataset(
        students=ds.students, exams=ds.exams, attempts=attempts, topics=topics, long=long
    )


def guardrails(ds: Dataset, feats, diag, assigned, rec: Recommender, n_check=150) -> dict:
    """Rules the output must satisfy regardless of what the ranking metric says."""
    rng = np.random.default_rng(config.RANDOM_STATE)
    sample = list(rng.choice(feats.index.tolist(), size=min(n_check, len(feats)), replace=False))

    empty, overreach, wrong_goal, weak_covered, checked_weak = 0, 0, 0, 0, 0
    for sid in sample:
        recs = rec.recommend(sid, feats.loc[sid], explain=False)
        if not recs:
            empty += 1
            continue

        theta = feats.loc[sid, "mean_theta"]
        goal = feats.loc[sid, "goal"]
        d = diag[(diag["student_id"] == sid) & diag["is_weak"]]
        weak = set(d["topic"])
        easiest = ds.exams["difficulty"].min()

        exam_idx = ds.exams.set_index("exam_id")
        for r in recs:
            # The ceiling may only be breached by papers at the gentlest tier,
            # which is the documented floor case for very low-theta students.
            if (
                not np.isnan(theta)
                and r["difficulty"] > theta + config.MAX_DIFFICULTY_STRETCH + 1e-9
                and r["difficulty"] > easiest + 1e-9
            ):
                overreach += 1
            exam = exam_idx.loc[r["exam_id"]]
            # Off-goal is allowed only as a remediation exception.
            if goal not in exam["goals_set"] and not (exam["topics_set"] & weak):
                wrong_goal += 1

        if len(d):
            checked_weak += 1
            worst = d.sort_values("severity", ascending=False).iloc[0]["topic"]
            covered = any(
                worst in ds.exams.set_index("exam_id").loc[r["exam_id"], "topics_set"]
                for r in recs
            )
            weak_covered += int(covered)

    return dict(
        students_checked=len(sample),
        empty_recommendation_lists=empty,
        difficulty_overreach_violations=overreach,
        goal_mismatch_violations=wrong_goal,
        worst_topic_covered_rate=(weak_covered / checked_weak) if checked_weak else float("nan"),
        students_with_weak_topics=checked_weak,
    )
