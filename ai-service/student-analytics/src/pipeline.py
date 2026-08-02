"""End-to-end run: load -> features -> segment -> diagnose -> recommend -> evaluate.

    python -m src.pipeline
"""

import json
import os

import pandas as pd

from . import config, data_loader, diagnosis, evaluate, features, segmentation
from .recommender import Recommender


def build(verbose=True):
    ds = data_loader.load()
    feats = features.build_student_features(ds)
    cohort = features.build_topic_cohort_stats(ds)
    student_topics = features.build_student_topic_table(ds)
    diag = diagnosis.diagnose(student_topics, cohort)

    model, assigned, diagnostics = segmentation.fit(feats)
    ari, crosstab = segmentation.validate_against_personas(assigned, ds.students)

    bank = diagnosis.load_advice_bank()
    rec = Recommender(ds, diag, assigned)

    if verbose:
        _print_report(ds, feats, diag, model, assigned, diagnostics, ari, crosstab)

    return dict(
        ds=ds, feats=feats, diag=diag, model=model, assigned=assigned,
        diagnostics=diagnostics, bank=bank, rec=rec, ari=ari, crosstab=crosstab,
    )


def student_card(ctx, student_id) -> dict:
    """The full per-student output: segment, mistakes, advice, next tests."""
    feats, diag, bank, rec = ctx["feats"], ctx["diag"], ctx["bank"], ctx["rec"]
    row = feats.loc[student_id]
    segment = ctx["assigned"].loc[student_id, "segment"]

    report = diagnosis.student_report(student_id, diag, bank)
    return dict(
        student_id=student_id,
        name=row["name"],
        age=int(row["age"]),
        grade_level=row["grade_level"],
        goal=row["goal"],
        preferred_domain=row["preferred_domain"],
        segment=segment,
        segment_profile=ctx["model"].profiles[ctx["assigned"].loc[student_id, "cluster"]]["profile"],
        segment_advice=bank["segment_advice"].get(segment, ""),
        overall_accuracy=round(row["overall_accuracy"], 1),
        n_attempts=int(row["n_attempts"]),
        diagnosis=report,
        recommended_tests=rec.recommend(student_id, row),
    )


def _print_report(ds, feats, diag, model, assigned, diagnostics, ari, crosstab):
    line = "=" * 78
    print(line)
    print("DATA")
    print(line)
    print(f"students {len(ds.students)} | exams {len(ds.exams)} | attempts {len(ds.attempts)} "
          f"| topic rows {len(ds.topics)} | as_of {ds.as_of.date()}")

    print(f"\n{line}\nSEGMENTATION\n{line}")
    print("k selection (silhouette per k):")
    print(diagnostics["k_table"].to_string(index=False, float_format=lambda v: f"{v:.4f}"))
    print(f"\nchosen k = {diagnostics['k']}  silhouette = {diagnostics['silhouette']:.4f}")
    if diagnostics["k"] != diagnostics["silhouette_best_k"]:
        print(f"  (silhouette argmax was k={diagnostics['silhouette_best_k']}; overridden in config "
              f"- see config.K_OVERRIDE for why)")
    print(f"bootstrap stability (mean ARI over 25 refits) = {diagnostics['stability']:.4f}")
    print(f"kmeans vs GMM ARI            = {diagnostics['kmeans_vs_gmm_ari']:.4f}")
    print(f"kmeans vs agglomerative ARI  = {diagnostics['kmeans_vs_agglomerative_ari']:.4f}")

    print("\nCluster centroids (original units):")
    cent = diagnostics["centroids"].copy()
    cent.insert(0, "segment", [model.labels_by_cluster[c] for c in cent.index])
    cent.insert(1, "n", diagnostics["cluster_sizes"].values)
    print(cent.to_string(float_format=lambda v: f"{v:.2f}"))

    print(f"\nARI vs hidden persona labels = {ari:.4f}")
    print("\nSegment x persona crosstab:")
    print(crosstab.to_string())

    print(f"\n{line}\nDIAGNOSIS\n{line}")
    print("Mistake type distribution across all student x topic cells:")
    print(diag["mistake_type"].value_counts().to_string())
    print(f"\nStudents with >=1 weak topic: "
          f"{diag.groupby('student_id')['is_weak'].any().sum()} / {diag['student_id'].nunique()}")


def main():
    ctx = build(verbose=True)

    line = "=" * 78
    print(f"\n{line}\nEVALUATION\n{line}")
    guard = evaluate.guardrails(ctx["ds"], ctx["feats"], ctx["diag"], ctx["assigned"], ctx["rec"])
    print("Recommender guardrails:")
    for k, v in guard.items():
        print(f"  {k:<36} {v}")

    lolo = evaluate.evaluate_recommender_leave_last_out(ctx["ds"], ctx["assigned"])
    print("\nLeave-last-attempt-out ranking:")
    for k, v in lolo.items():
        print(f"  {k:<36} {v:.4f}" if isinstance(v, float) else f"  {k:<36} {v}")
    print("  NOTE: the dummy generator picks each attempt's exam at random within a domain,")
    print("        so there is no signal here to learn. Scoring near the random baseline is")
    print("        expected. Judge the recommender on the guardrails above; this harness only")
    print("        becomes informative once real attempt data replaces the dummy workbook.")

    # Write per-student cards + a segment summary.
    os.makedirs(config.REPORT_DIR, exist_ok=True)
    cards = [student_card(ctx, sid) for sid in ctx["feats"].index]
    with open(os.path.join(config.REPORT_DIR, "student_cards.json"), "w") as fh:
        json.dump(cards, fh, indent=2, default=str)

    summary = ctx["assigned"].groupby("segment").agg(
        n_students=("overall_accuracy", "size"),
        mean_accuracy=("overall_accuracy", "mean"),
        mean_speed_z=("speed_z", "mean"),
        mean_changes_per_q=("changes_per_question", "mean"),
        mean_weakness_depth=("weakness_depth", "mean"),
    ).round(2)
    summary.to_csv(os.path.join(config.REPORT_DIR, "segment_summary.csv"))
    ctx["assigned"][["cluster", "segment"]].to_csv(
        os.path.join(config.REPORT_DIR, "student_segments.csv")
    )
    ctx["diag"].to_csv(os.path.join(config.REPORT_DIR, "topic_diagnosis.csv"), index=False)

    path = ctx["model"].save()
    print(f"\nSaved model -> {path}")
    print(f"Saved reports -> {config.REPORT_DIR}/")

    # One worked example so the output is legible without opening the JSON.
    example = next(
        (c for c in cards if c["diagnosis"]["weak_topics"]), cards[0]
    )
    print(f"\n{line}\nEXAMPLE STUDENT CARD\n{line}")
    print(_render_card(example))


def _render_card(card) -> str:
    out = []
    out.append(f"{card['name']} ({card['student_id']}) - age {card['age']}, {card['grade_level']}, "
               f"goal {card['goal']}, focus {card['preferred_domain']}")
    out.append(f"Segment: {card['segment']}  [{card['segment_profile']}]")
    out.append(f"Overall accuracy: {card['overall_accuracy']}%  across {card['n_attempts']} attempts")
    out.append(f"\nStrategy: {card['segment_advice'].strip()}")
    out.append("\nWhere marks are being lost:")
    for w in card["diagnosis"]["weak_topics"]:
        out.append(f"\n  * {w['topic']} ({w['domain']}) - {w['mistake_type']}")
        out.append(f"    {w['evidence']}")
        out.append(f"    What's happening: {' '.join(w['what_is_happening'].split())}")
        out.append(f"    How to fix it:    {' '.join(w['how_to_fix'].split())}")
    out.append("\nRecommended next tests:")
    for i, r in enumerate(card["recommended_tests"], 1):
        out.append(f"\n  {i}. {r['exam_name']}  [{r['tier']}, {r['n_questions']}q, "
                   f"{r['duration_minutes']}min]  score={r['score']}")
        for reason in r["reasons"]:
            out.append(f"     - {reason}")
    return "\n".join(out)


if __name__ == "__main__":
    main()
