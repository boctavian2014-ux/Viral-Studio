"use client";

import { Flame, Video } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type TrendAlert = {
  id: string;
  topic: string;
  platform: string;
  score: number;
  growthRatePercent: number;
  videoId: string;
  detectedAt: string;
  suggestedHooks?: string[];
};

export function TrendAlerts() {
  const [alerts, setAlerts] = useState<TrendAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE) {
      setLoading(false);
      setError("Set NEXT_PUBLIC_API_URL to fetch trend alerts.");
      return;
    }
    const url = `${API_BASE.replace(/\/$/, "")}/v1/trend-prediction/alerts?limit=20`;
    fetch(url, {
      headers: process.env.NEXT_PUBLIC_API_KEY
        ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}` }
        : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAlerts(Array.isArray(data.items) ? data.items : []);
        setError(null);
      })
      .catch((e) => {
        setError(e.message ?? "Failed to load alerts");
        setAlerts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Flame className="h-4 w-4 text-[#3b82f6]" />
          Trend Alerts
        </h2>
        <p className="text-sm text-[#71717a]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Flame className="h-4 w-4 text-[#3b82f6]" />
          Trend Alerts
        </h2>
        <p className="text-sm text-[#71717a]">{error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Flame className="h-4 w-4 text-[#3b82f6]" />
          Trend Alerts
        </h2>
        <p className="text-sm text-[#71717a]">No trend alerts yet. Ingest metrics via POST /v1/trend-prediction/ingest.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Flame className="h-4 w-4 text-[#3b82f6]" />
        Trend Alerts — detect before viral
      </h2>
      <div className="space-y-4">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-[#1c1c24] bg-[#0b0b0f] p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium capitalize text-white">{a.topic}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Score: {a.score}
              </span>
            </div>
            <div className="mb-2 text-xs text-[#a1a1aa]">
              {a.platform} · Growth: +{a.growthRatePercent}%
            </div>
            {a.suggestedHooks && a.suggestedHooks.length > 0 && (
              <div className="mb-3 text-xs text-[#71717a]">
                <span className="font-medium text-[#a1a1aa]">Suggested hooks:</span>
                <ul className="mt-1 list-inside list-disc">
                  {a.suggestedHooks.slice(0, 3).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2563eb]"
            >
              <Video className="h-4 w-4" />
              Generate Video
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
