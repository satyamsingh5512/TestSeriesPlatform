"""Recommend the next tests for a student.

There are no ratings and no repeat-view history in this data, so classic
collaborative filtering is not available. This is a hybrid content + rule
scorer: hard eligibility filters, then a weighted blend of interpretable
components, then diversification. The peer_signal component is the seam where a
real CF model plugs in once interaction data exists.
"""

import numpy as np
import pandas as pd

from . import config


class Recommender:
    def __init__(self, ds, diag, assigned, weights=None):
        self.ds = ds
        self.exams = ds.exams
        self.diag = diag
        self.assigned = assigned
        self.weights = dict(weights or config.REC_WEIGHTS)
        self.as_of = ds.as_of

        self._attempts_by_student = {
            sid: g for sid, g in ds.attempts.groupby("student_id")
        }
        self._peer_scores = self._build_peer_scores()

    # -- peer signal --------------------------------------------------------
    def _build_peer_scores(self) -> pd.DataFrame:
        """Mean normalised score per (cluster, exam).

        Stands in for collaborative filtering: an exam that students in the same
        segment did well on is a reasonable next step for this student. Weak
        with a few hundred students, which is why its weight is low.
        """
        att = self.ds.attempts.merge(
            self.assigned[["cluster"]], left_on="student_id", right_index=True, how="inner"
        )
        att["score_pct"] = 100.0 * att["total_score"] / att["max_score"]
        peer = att.groupby(["cluster", "exam_id"]).agg(
            mean_score=("score_pct", "mean"), n=("attempt_id", "size")
        )
        # Shrink toward the global mean so an exam sat by two people cannot
        # dominate one sat by fifty.
        global_mean = att["score_pct"].mean()
        prior = 5.0
        peer["adjusted"] = (
            peer["mean_score"] * peer["n"] + global_mean * prior
        ) / (peer["n"] + prior)
        return peer

    # -- eligibility --------------------------------------------------------
    def _eligible(self, profile, history, weak_topics=None) -> pd.DataFrame:
        e = self.exams.copy()
        weak_topics = weak_topics or {}

        # Goal relevance, with a remediation exception: an exam outside the
        # student's goal syllabus still gets through if it targets a topic they
        # are measurably weak at. Without this, a NEET student weak in
        # Trigonometry could never be sent a Math paper, because Math is tagged
        # JEE/Banking - the single largest cause of uncovered weak topics.
        on_goal = e["goals_set"].apply(lambda s: profile["goal"] in s)
        remediates = e["topics_set"].apply(lambda s: bool(s & set(weak_topics)))
        e = e[on_goal | remediates]
        e["off_goal"] = ~e["goals_set"].apply(lambda s: profile["goal"] in s)

        # Grade band, with one grade of slack either side so a 12th-grader can
        # still be sent foundation material for remediation.
        grade_order = ["9th", "10th", "11th", "12th"]
        gi = grade_order.index(profile["grade_level"])
        allowed = {grade_order[j] for j in range(max(0, gi - 1), min(4, gi + 2))}
        e = e[e["grades_set"].apply(lambda s: bool(s & allowed))]

        # Never stretch a student far past measured ability.
        theta = profile.get("mean_theta", 0.0)
        if not np.isnan(theta):
            e = e[e["difficulty"] <= theta + config.MAX_DIFFICULTY_STRETCH]

        # Drop anything sat very recently.
        if history is not None and len(history):
            recent = history[
                (self.as_of - history["attempt_date"]).dt.days < config.RECENCY_BLOCK_DAYS
            ]["exam_id"]
            e = e[~e["exam_id"].isin(set(recent))]

        return e

    # -- scoring components -------------------------------------------------
    def _remediation(self, e, weak_topics) -> pd.Series:
        """Share of the exam that targets this student's weak topics, weighted by severity."""
        if not weak_topics:
            return pd.Series(0.0, index=e.index)
        total_sev = sum(weak_topics.values())

        def score(topics):
            hit = sum(weak_topics.get(t, 0.0) for t in topics)
            # Balance how much of the student's problem it covers against how
            # much of the paper is on-target - a 5-topic paper hitting 1 weak
            # topic should not beat a 2-topic paper hitting the same one.
            coverage_of_need = hit / total_sev if total_sev else 0.0
            focus = len([t for t in topics if t in weak_topics]) / len(topics)
            return 0.6 * coverage_of_need + 0.4 * focus

        return e["topics_set"].apply(score)

    def _difficulty_fit(self, e, theta) -> pd.Series:
        """Peak at theta + ZPD_OFFSET, falling off either side."""
        target = (0.0 if np.isnan(theta) else theta) + config.ZPD_OFFSET
        gap = (e["difficulty"] - target).abs()
        return (1.0 - gap / (config.MAX_DIFFICULTY_STRETCH + 1.5)).clip(lower=0.0)

    def _affinity(self, e, profile) -> pd.Series:
        """Cosine-style match between the student's stated preferences and exam tags."""
        pref = profile["preferred_domain"]
        goal = profile["goal"]

        def score(row):
            s = 0.0
            if row["domain"] == pref:
                s += 0.6
            if goal in row["goals_set"]:
                s += 0.3
            if profile["grade_level"] in row["grades_set"]:
                s += 0.1
            return s

        return e.apply(score, axis=1)

    def _coverage(self, e, seen_domains, seen_topics) -> pd.Series:
        """Reward breadth: domains never sat, topics never seen."""
        def score(row):
            new_domain = 0.5 if row["domain"] not in seen_domains else 0.0
            new_topics = len(row["topics_set"] - seen_topics) / len(row["topics_set"])
            return new_domain + 0.5 * new_topics

        return e.apply(score, axis=1)

    def _peer(self, e, cluster) -> pd.Series:
        if cluster is None or cluster not in self._peer_scores.index.get_level_values(0):
            return pd.Series(0.5, index=e.index)
        sub = self._peer_scores.loc[cluster]
        vals = e["exam_id"].map(sub["adjusted"])
        if vals.notna().sum() == 0:
            return pd.Series(0.5, index=e.index)
        lo, hi = vals.min(), vals.max()
        # Unseen exams sit mid-scale rather than being penalised as zero.
        return ((vals - lo) / (hi - lo)).fillna(0.5) if hi > lo else vals.notna().astype(float) * 0.5

    def _recency_penalty(self, e, history) -> pd.Series:
        """1.0 for never-attempted, decaying toward 0 the more recently it was sat."""
        if history is None or not len(history):
            return pd.Series(1.0, index=e.index)
        last = history.groupby("exam_id")["attempt_date"].max()
        days = e["exam_id"].map((self.as_of - last).dt.days)
        decayed = 1.0 - 0.5 ** (days / config.RECENCY_HALFLIFE_DAYS)
        return decayed.fillna(1.0)

    # -- main entry point ---------------------------------------------------
    def recommend(self, student_id, feats_row, top_k=None, explain=True) -> list:
        top_k = top_k or config.TOP_K
        profile = feats_row.to_dict()
        profile.setdefault("mean_theta", np.nan)

        history = self._attempts_by_student.get(student_id)
        d = self.diag[self.diag["student_id"] == student_id]
        weak_topics = dict(
            zip(d.loc[d["is_weak"], "topic"], d.loc[d["is_weak"], "severity"])
        )
        seen_topics = set(d["topic"])
        seen_domains = set(history["exam_domain"]) if history is not None else set()
        cluster = self.assigned["cluster"].get(student_id)

        e = self._eligible(profile, history, weak_topics)
        if e.empty:
            # Happens when a student sits below the easiest tier on offer. Give
            # them the gentlest papers available rather than nothing - and never
            # by lifting the difficulty ceiling, which would send someone who is
            # already drowning an even harder paper.
            fallback = self.exams[
                self.exams["goals_set"].apply(lambda s: profile["goal"] in s)
            ].copy()
            if fallback.empty:
                fallback = self.exams.copy()
            floor = fallback["difficulty"].min()
            e = fallback[fallback["difficulty"] <= floor + 0.01].copy()
            e["off_goal"] = ~e["goals_set"].apply(lambda s: profile["goal"] in s)
        if e.empty:
            return []

        theta = profile.get("mean_theta", np.nan)
        components = pd.DataFrame(index=e.index)
        components["remediation"] = self._remediation(e, weak_topics)
        components["difficulty_fit"] = self._difficulty_fit(e, theta)
        components["goal_domain_affinity"] = self._affinity(e, profile)
        components["coverage"] = self._coverage(e, seen_domains, seen_topics)
        components["peer_signal"] = self._peer(e, cluster)
        components["recency_penalty"] = self._recency_penalty(e, history)

        w_total = sum(self.weights.values())
        score = sum(components[c] * (self.weights[c] / w_total) for c in components.columns)

        ranked = e.copy()
        ranked["score"] = score
        for c in components.columns:
            ranked[f"c_{c}"] = components[c]
        ranked = ranked.sort_values("score", ascending=False)

        picked = self._diversify(ranked, top_k)

        out = []
        for r in picked.itertuples():
            rec = dict(
                exam_id=r.exam_id,
                exam_name=r.exam_name,
                domain=r.domain,
                tier=r.tier,
                difficulty=r.difficulty,
                n_questions=int(r.n_questions),
                duration_minutes=int(r.duration_minutes),
                score=round(r.score, 4),
            )
            if explain:
                rec["reasons"] = self._reasons(r, weak_topics, theta, profile, seen_domains, d)
            out.append(rec)
        return out

    def _diversify(self, ranked: pd.DataFrame, top_k: int) -> pd.DataFrame:
        """Cap per-domain picks so the list is not five near-identical papers."""
        picked, counts = [], {}
        for r in ranked.itertuples():
            if counts.get(r.domain, 0) >= config.MAX_PER_DOMAIN:
                continue
            picked.append(r.Index)
            counts[r.domain] = counts.get(r.domain, 0) + 1
            if len(picked) == top_k:
                break
        # If per-domain caps starved the list, top up with the best remaining.
        if len(picked) < top_k:
            for r in ranked.itertuples():
                if r.Index not in picked:
                    picked.append(r.Index)
                if len(picked) == top_k:
                    break
        return ranked.loc[picked]

    def _reasons(self, row, weak_topics, theta, profile, seen_domains, student_diag) -> list:
        """Plain-language justification. An unexplained recommendation is unusable."""
        reasons = []
        hit = sorted(
            [t for t in row.topics_set if t in weak_topics],
            key=lambda t: -weak_topics[t],
        )
        if hit:
            top = hit[0]
            # This student's own numbers on the topic, never the cohort's rows.
            row_stat = student_diag[student_diag["topic"] == top]
            if len(row_stat):
                acc = row_stat.iloc[0]["accuracy_pct"]
                coh = row_stat.iloc[0]["acc_mean"]
                reasons.append(
                    f"Covers {top}, where you are at {acc:.0f}% against a cohort average of {coh:.0f}%"
                )
            else:
                reasons.append(f"Covers {top}, one of your weaker topics")
            if len(hit) > 1:
                reasons.append(f"Also targets {', '.join(hit[1:3])}")

        if not np.isnan(theta):
            delta = row.difficulty - theta
            if delta > 0.15:
                reasons.append(f"A step up from your current level ({row.tier} tier) without overreaching")
            elif delta < -0.5:
                # Below-level papers mean different things depending on whether
                # the student is struggling or just revising.
                purpose = "to rebuild fundamentals" if hit else "as lighter revision"
                reasons.append(f"Below your current level ({row.tier} tier), {purpose}")
            else:
                reasons.append(f"Pitched at your current level ({row.tier} tier)")

        if row.domain not in seen_domains:
            reasons.append(f"{row.domain} is untested for you so far")
        elif row.domain == profile["preferred_domain"]:
            reasons.append(f"{row.domain} is your focus area")

        if getattr(row, "off_goal", False):
            # Be upfront when a paper is off-syllabus so the student understands
            # why it is here and can deprioritise it if time is short.
            reasons.append(
                f"Outside the core {profile['goal']} syllabus, suggested purely to fix a weak topic"
            )
        else:
            reasons.append(f"Relevant to {profile['goal']}")
        return reasons[:4]

    def cold_start(self, profile: dict, top_k=None) -> list:
        """Recommendations for a student with no attempt history."""
        top_k = top_k or config.TOP_K
        grade_default_theta = {"9th": -0.8, "10th": -0.4, "11th": 0.0, "12th": 0.3}
        row = pd.Series(
            dict(
                goal=profile["goal"],
                grade_level=profile["grade_level"],
                preferred_domain=profile["preferred_domain"],
                mean_theta=grade_default_theta.get(profile["grade_level"], 0.0),
            )
        )
        saved_diag = self.diag
        try:
            # No history means no diagnosis: score on profile fit alone.
            self.diag = self.diag.iloc[0:0]
            return self.recommend("__coldstart__", row, top_k=top_k)
        finally:
            self.diag = saved_diag
