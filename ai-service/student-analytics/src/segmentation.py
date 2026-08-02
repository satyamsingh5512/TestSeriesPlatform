"""Cluster students into a small number of interpretable performance groups.

The persona column in the workbook is ground truth for *validation only* - it is
never a model input, because real data will not have it.
"""

import os

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering, KMeans
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler

from . import config


class SegmentationModel:
    """Fitted scaler + KMeans, plus the human-readable labels for each cluster."""

    def __init__(self, scaler, kmeans, feature_columns, labels_by_cluster, profiles):
        self.scaler = scaler
        self.kmeans = kmeans
        self.feature_columns = feature_columns
        self.labels_by_cluster = labels_by_cluster
        self.profiles = profiles

    @property
    def k(self):
        return self.kmeans.n_clusters

    def predict(self, feats: pd.DataFrame) -> pd.DataFrame:
        """Assign clusters to students without refitting.

        Refitting per request would reshuffle cluster ids and silently break the
        advice mapping, so scoring new students always goes through here.
        """
        X = self.scaler.transform(feats[self.feature_columns].to_numpy())
        cluster = self.kmeans.predict(X)
        out = pd.DataFrame(index=feats.index)
        out["cluster"] = cluster
        out["segment"] = [self.labels_by_cluster[c] for c in cluster]
        return out

    def save(self, path=None):
        path = path or os.path.join(config.MODEL_DIR, "segmentation.joblib")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self, path)
        return path

    @staticmethod
    def load(path=None):
        path = path or os.path.join(config.MODEL_DIR, "segmentation.joblib")
        return joblib.load(path)


def choose_k(X: np.ndarray, k_range=None) -> pd.DataFrame:
    """Score every candidate k with silhouette and inertia."""
    k_range = k_range or config.K_RANGE
    rows = []
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=config.RANDOM_STATE, n_init=20).fit(X)
        rows.append(
            dict(
                k=k,
                silhouette=silhouette_score(X, km.labels_),
                inertia=km.inertia_,
            )
        )
    return pd.DataFrame(rows)


def cross_check(X: np.ndarray, k: int) -> dict:
    """Do GMM and agglomerative clustering agree with KMeans at this k?

    At a few hundred students, agreement across three different algorithms is
    better evidence that the structure is real than any single internal metric.
    """
    km = KMeans(n_clusters=k, random_state=config.RANDOM_STATE, n_init=20).fit_predict(X)
    gmm = GaussianMixture(n_components=k, random_state=config.RANDOM_STATE, n_init=5).fit_predict(X)
    agg = AgglomerativeClustering(n_clusters=k).fit_predict(X)
    return {
        "kmeans_vs_gmm_ari": adjusted_rand_score(km, gmm),
        "kmeans_vs_agglomerative_ari": adjusted_rand_score(km, agg),
    }


def stability(X: np.ndarray, k: int, n_runs: int = 25, frac: float = 0.8) -> float:
    """Bootstrap stability: refit on subsamples, measure label agreement on the overlap."""
    rng = np.random.default_rng(config.RANDOM_STATE)
    base = KMeans(n_clusters=k, random_state=config.RANDOM_STATE, n_init=20).fit(X)
    scores = []
    n = X.shape[0]
    for _ in range(n_runs):
        idx = rng.choice(n, size=int(frac * n), replace=False)
        sub = KMeans(n_clusters=k, random_state=int(rng.integers(1e6)), n_init=10).fit(X[idx])
        scores.append(adjusted_rand_score(base.labels_[idx], sub.labels_))
    return float(np.mean(scores))


def _describe(centroid: pd.Series, cohort_mean: pd.Series, cohort_std: pd.Series) -> tuple:
    """Turn a centroid into a segment name + prose profile.

    Derived from the centroid's position relative to the cohort, never from the
    persona column, so the naming still works on data with no ground truth.
    """
    z = (centroid - cohort_mean) / cohort_std.replace(0, np.nan)
    z = z.fillna(0.0)

    acc = z["overall_accuracy"]
    speed = z["speed_z"]          # positive = slower than peers
    careless = z["changes_per_question"]
    lopsided = z["weakness_depth"]

    if acc > 0.4 and speed > 0.4:
        name = "Slow but Accurate"
    elif acc > 0.4:
        name = "High Performers"
    elif acc < -0.6 and careless < 0.3 and speed > -0.2:
        name = "Consistently Struggling"
    elif speed < -0.4 and careless > 0.3:
        name = "Fast but Careless"
    elif lopsided > 0.4:
        name = "Strong with One Blind Spot"
    elif acc < -0.2:
        name = "Developing"
    else:
        name = "Steady All-Rounders"

    parts = [
        f"accuracy {centroid['overall_accuracy']:.0f}%",
        f"{'slower' if speed > 0 else 'faster'} than average pace",
        f"{centroid['changes_per_question']:.2f} answer changes per question",
        f"worst topic sits {centroid['weakness_depth']:.0f} pts below own average",
    ]
    return name, "; ".join(parts)


def _dedupe(names: list) -> list:
    """Guarantee unique segment names even if two centroids describe alike."""
    seen, out = {}, []
    for n in names:
        if n in seen:
            seen[n] += 1
            out.append(f"{n} ({seen[n]})")
        else:
            seen[n] = 1
            out.append(n)
    return out


def fit(feats: pd.DataFrame, k: int = None) -> tuple:
    """Fit the segmentation. Returns (model, assignments, diagnostics)."""
    X_raw = feats[config.FEATURE_COLUMNS].to_numpy()
    scaler = StandardScaler().fit(X_raw)
    X = scaler.transform(X_raw)

    k_table = choose_k(X)
    silhouette_best = int(k_table.loc[k_table["silhouette"].idxmax(), "k"])
    if k is None:
        k = config.K_OVERRIDE or silhouette_best

    kmeans = KMeans(n_clusters=k, random_state=config.RANDOM_STATE, n_init=50).fit(X)

    assigned = feats.copy()
    assigned["cluster"] = kmeans.labels_

    centroids = assigned.groupby("cluster")[config.FEATURE_COLUMNS].mean()
    cohort_mean = feats[config.FEATURE_COLUMNS].mean()
    cohort_std = feats[config.FEATURE_COLUMNS].std()

    described = [_describe(centroids.loc[c], cohort_mean, cohort_std) for c in centroids.index]
    names = _dedupe([d[0] for d in described])
    labels_by_cluster = dict(zip(centroids.index, names))
    profiles = {c: dict(name=n, profile=d[1]) for c, n, d in zip(centroids.index, names, described)}

    assigned["segment"] = assigned["cluster"].map(labels_by_cluster)

    model = SegmentationModel(scaler, kmeans, config.FEATURE_COLUMNS, labels_by_cluster, profiles)

    diagnostics = dict(
        k=k,
        silhouette_best_k=silhouette_best,
        k_table=k_table,
        silhouette=float(silhouette_score(X, kmeans.labels_)),
        centroids=centroids,
        cluster_sizes=assigned["cluster"].value_counts().sort_index(),
        stability=stability(X, k),
        **cross_check(X, k),
    )
    return model, assigned, diagnostics


def validate_against_personas(assigned: pd.DataFrame, students: pd.DataFrame) -> tuple:
    """Compare discovered clusters to the generator's hidden persona labels."""
    truth = students.set_index("student_id")["persona"]
    joined = assigned.join(truth, how="inner").dropna(subset=["persona"])
    ari = adjusted_rand_score(joined["persona"], joined["cluster"])
    crosstab = pd.crosstab(joined["segment"], joined["persona"])
    return ari, crosstab
