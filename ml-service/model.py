from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression

THRESHOLD = 0.65
MODEL: LogisticRegression | None = None


def _normalize_vector(features: dict) -> np.ndarray:
    values = np.array(
        [
            float(features.get("hook_score", 50.0)) / 100.0,
            float(features.get("trend_score", 50.0)) / 100.0,
            float(features.get("emotion_score", 50.0)) / 100.0,
            float(features.get("curiosity_gap", 50.0)) / 100.0,
            min(float(features.get("video_length", 20.0)), 180.0) / 180.0,
            min(float(features.get("scene_count", 4.0)), 20.0) / 20.0,
            float(features.get("visual_novelty", 50.0)) / 100.0,
        ],
        dtype=np.float64,
    )
    return np.clip(values, 0.0, 1.0).reshape(1, -1)


def _build_training_data() -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(42)
    n = 3000
    x = rng.uniform(0, 1, (n, 7))
    score = (
        x[:, 0] * 0.25
        + x[:, 1] * 0.23
        + x[:, 2] * 0.12
        + x[:, 3] * 0.2
        + x[:, 4] * 0.07
        + x[:, 5] * 0.05
        + x[:, 6] * 0.08
    )
    y = (score > 0.62).astype(int)
    return x, y


def _get_model() -> LogisticRegression:
    global MODEL
    if MODEL is None:
        x, y = _build_training_data()
        fitted = LogisticRegression(max_iter=500, random_state=42)
        fitted.fit(x, y)
        MODEL = fitted
    return MODEL


def _confidence(probability: float) -> str:
    if probability >= 0.8 or probability <= 0.3:
        return "high"
    if 0.45 <= probability <= 0.75:
        return "medium"
    return "low"


def predict_viral(features: dict) -> dict:
    model = _get_model()
    x = _normalize_vector(features)
    probability = float(model.predict_proba(x)[0, 1])
    probability = max(0.0, min(1.0, probability))

    estimated_views = int(round(100_000 + probability * (2_500_000 - 100_000)))
    label = "HIGH VIRAL POTENTIAL" if probability >= THRESHOLD else "LOW VIRAL POTENTIAL"

    return {
        "probability": round(probability, 3),
        "estimatedViews": estimated_views,
        "confidence": _confidence(probability),
        "label": label,
    }
