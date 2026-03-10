"use client";

import { Bot, Zap } from "lucide-react";
import { ViralPredictionCard } from "./ViralPredictionCard";
import { useState } from "react";

const AGENTS = [
  { id: "trend", label: "Trend Agent" },
  { id: "idea", label: "Idea Agent" },
  { id: "script", label: "Script Agent" },
  { id: "video", label: "Video Generator" },
  { id: "publish", label: "Publish Bot" },
] as const;

export function AIPanel() {
  const [agents, setAgents] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map((a) => [a.id, true]))
  );

  const toggle = (id: string) => {
    setAgents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="flex w-full flex-col gap-6 border-l border-[#1c1c24] bg-[#0b0b0f] p-6 lg:w-[280px]">
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Bot className="h-4 w-4 text-[#3b82f6]" />
          AI Control
        </h2>
        <div className="space-y-2">
          {AGENTS.map(({ id, label }) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg border border-[#1c1c24] bg-[#14141c] px-3 py-2"
            >
              <span className="text-sm text-white">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={agents[id]}
                onClick={() => toggle(id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  agents[id] ? "bg-emerald-600" : "bg-[#1c1c24]"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    agents[id] ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ViralPredictionCard />

      <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#71717a]">
          <Zap className="h-3.5 w-3.5" />
          Analytics
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#a1a1aa]">Total Videos</dt>
            <dd className="font-medium text-white">—</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#a1a1aa]">Total Views</dt>
            <dd className="font-medium text-white">—</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#a1a1aa]">Avg Watch</dt>
            <dd className="font-medium text-white">—</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#a1a1aa]">Top Video</dt>
            <dd className="font-medium text-white">—</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
