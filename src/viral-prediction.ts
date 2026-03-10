import type {
  ViralPredictionFeatures,
  ViralPredictionResponse,
  ViralPredictionResult,
} from "./contracts.js";

const VIRAL_THRESHOLD = 0.65;
const WEIGHTS = {
  hook_score: 0.25,
  trend_score: 0.2,
  emotion_score: 0.15,
  curiosity_gap: 0.2,
  video_length: 0.05, // sweet spot ~15–30s
  scene_count: 0.05,
  visual_novelty: 0.1,
} as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Normalize video_length: peak around 20–25s. */
function lengthScore(sec: number): number {
  if (sec <= 0) return 0;
  const peak = 22;
  const spread = 15;
  const d = Math.abs(sec - peak);
  return Math.max(0, 100 - (d / spread) * 100);
}

/** Normalize scene_count: 3–6 scenes often best. */
function sceneScore(count: number): number {
  if (count <= 0) return 0;
  const peak = 4;
  const spread = 3;
  const d = Math.abs(count - peak);
  return Math.max(0, 100 - (d / spread) * 100);
}

/**
 * Formula-based viral predictor fallback.
 * probability > 0.65 → HIGH VIRAL POTENTIAL.
 */
export function predictViralFallback(features: ViralPredictionFeatures): ViralPredictionResult {
  const h = clamp(features.hook_score ?? 50, 0, 100);
  const t = clamp(features.trend_score ?? 50, 0, 100);
  const e = clamp(features.emotion_score ?? 50, 0, 100);
  const c = clamp(features.curiosity_gap ?? 50, 0, 100);
  const len = lengthScore(features.video_length ?? 20);
  const sc = sceneScore(features.scene_count ?? 4);
  const v = clamp(features.visual_novelty ?? 50, 0, 100);

  const raw =
    h * WEIGHTS.hook_score +
    t * WEIGHTS.trend_score +
    e * WEIGHTS.emotion_score +
    c * WEIGHTS.curiosity_gap +
    len * WEIGHTS.video_length +
    sc * WEIGHTS.scene_count +
    v * WEIGHTS.visual_novelty;

  // Map 0–100 weighted sum to 0–1 probability (sigmoid-like)
  const normalized = raw / 100;
  const probability = Math.round((1 / (1 + Math.exp(-4 * (normalized - 0.6)))) * 1000) / 1000;
  const prob = clamp(probability, 0, 1);

  const label = prob >= VIRAL_THRESHOLD ? "HIGH VIRAL POTENTIAL" : "LOW VIRAL POTENTIAL";

  // Estimated views: rough band from probability (e.g. 0.7 → ~1.3M)
  const base = 100_000;
  const viralPeak = 2_500_000;
  const estimatedViews = Math.round(base + prob * (viralPeak - base));

  let confidence: ViralPredictionResult["confidence"] = "medium";
  if (prob >= 0.8 || prob <= 0.3) confidence = "high";
  else if (prob >= 0.5 && prob <= 0.75) confidence = "low";

  return {
    probability: prob,
    estimatedViews,
    confidence,
    label,
  };
}

function normalizeRemoteResult(payload: unknown): ViralPredictionResult | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const probability =
    typeof value.probability === "number" ? clamp(value.probability, 0, 1) : Number.NaN;
  const estimatedViews =
    typeof value.estimatedViews === "number"
      ? Math.max(0, Math.trunc(value.estimatedViews))
      : Number.NaN;
  const confidence = value.confidence;
  const label = value.label;
  if (
    !Number.isFinite(probability) ||
    !Number.isFinite(estimatedViews) ||
    (confidence !== "high" && confidence !== "medium" && confidence !== "low") ||
    (label !== "HIGH VIRAL POTENTIAL" && label !== "LOW VIRAL POTENTIAL")
  ) {
    return null;
  }
  return {
    probability,
    estimatedViews,
    confidence,
    label,
  };
}

async function predictWithMlService(
  features: ViralPredictionFeatures,
): Promise<ViralPredictionResult | null> {
  const baseUrl = process.env.VIRAL_STUDIO_ML_SERVICE_URL?.trim();
  if (!baseUrl) {
    return null;
  }
  const timeoutMs = Number(process.env.VIRAL_STUDIO_ML_TIMEOUT_MS ?? 3500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 3500);
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.VIRAL_STUDIO_ML_API_KEY?.trim()
          ? { Authorization: `Bearer ${process.env.VIRAL_STUDIO_ML_API_KEY.trim()}` }
          : {}),
      },
      body: JSON.stringify({ features }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as unknown;
    return normalizeRemoteResult(payload);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Smart predictor: try ML service first (Python/Node model), fallback to formula.
 */
export async function predictViral(features: ViralPredictionFeatures): Promise<ViralPredictionResponse> {
  const remote = await predictWithMlService(features);
  if (remote) {
    return { ...remote, modelSource: "ml-service" };
  }
  return { ...predictViralFallback(features), modelSource: "fallback-formula" };
}
