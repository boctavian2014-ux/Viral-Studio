"use client";

import { TrendingUp } from "lucide-react";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type Result = {
  probability: number;
  estimatedViews: number;
  confidence: string;
  label: string;
};

type Features = {
  hook_score?: number;
  trend_score?: number;
  emotion_score?: number;
  curiosity_gap?: number;
  video_length?: number;
  scene_count?: number;
  visual_novelty?: number;
};

export function ViralPredictionCard() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState<Features>({
    hook_score: 82,
    trend_score: 74,
    emotion_score: 65,
    curiosity_gap: 90,
    video_length: 23,
    scene_count: 4,
    visual_novelty: 70,
  });

  const runPredict = () => {
    if (!API_BASE) {
      setResult({
        probability: 0.72,
        estimatedViews: 1_300_000,
        confidence: "high",
        label: "HIGH VIRAL POTENTIAL",
      });
      return;
    }
    setLoading(true);
    fetch(`${API_BASE.replace(/\/$/, "")}/v1/viral-prediction/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.NEXT_PUBLIC_API_KEY
          ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ features }),
    })
      .then((r) => r.json())
      .then((data) => {
        setResult({
          probability: data.probability,
          estimatedViews: data.estimatedViews,
          confidence: data.confidence,
          label: data.label,
        });
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  };

  const probPercent = result ? Math.round(result.probability * 100) : 0;
  const viewsStr = result
    ? result.estimatedViews >= 1e6
      ? `${(result.estimatedViews / 1e6).toFixed(1)}M`
      : `${(result.estimatedViews / 1e3).toFixed(0)}K`
    : "—";

  return (
    <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <TrendingUp className="h-4 w-4 text-[#3b82f6]" />
        Viral prediction (1M+ views)
      </h2>
      {!result ? (
        <div>
          <p className="mb-3 text-xs text-[#71717a]">
            Estimate viral probability from hook, trend, emotion, curiosity, length, scenes, novelty.
          </p>
          <button
            type="button"
            onClick={runPredict}
            disabled={loading}
            className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb] disabled:opacity-50"
          >
            {loading ? "Predicting…" : "Predict viral potential"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[#71717a]">Viral probability</span>
            <span className="text-2xl font-bold text-white">{probPercent}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[#71717a]">Estimated views</span>
            <span className="font-semibold text-white">{viewsStr}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[#71717a]">Confidence</span>
            <span className="capitalize text-white">{result.confidence}</span>
          </div>
          <div
            className={`mt-2 rounded-lg px-2 py-1 text-center text-sm font-medium ${
              result.label === "HIGH VIRAL POTENTIAL"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#1c1c24] text-[#a1a1aa]"
            }`}
          >
            {result.label}
          </div>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-2 text-xs text-[#71717a] hover:text-white"
          >
            Run again
          </button>
        </div>
      )}
    </div>
  );
}
