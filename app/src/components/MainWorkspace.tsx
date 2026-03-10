"use client";

import { Film, Sparkles } from "lucide-react";
import { useState } from "react";
import { TrendAlerts } from "./TrendAlerts";

const STYLES = ["cinematic", "vlog", "storytelling"] as const;
const PLATFORMS = ["TikTok", "Instagram", "YouTube Shorts"] as const;

export function MainWorkspace() {
  const [topic, setTopic] = useState("AI productivity");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("cinematic");
  const [length, setLength] = useState(20);
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("TikTok");
  const [videosCount, setVideosCount] = useState(5);
  const [hook, setHook] = useState("This AI tool saves 10 hours per week.");
  const [middle, setMiddle] = useState("Show problem");
  const [twist, setTwist] = useState("Unexpected reveal");

  return (
    <div className="flex flex-col gap-6 overflow-auto p-6">
      {/* Trend Prediction — detect before viral */}
      <TrendAlerts />

      {/* WOW: Find Viral Idea */}
      <div className="rounded-2xl border border-[#3b82f6]/30 bg-gradient-to-br from-[#14141c] to-[#0b0b0f] p-6 shadow-glow">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#3b82f6] py-4 font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition hover:bg-[#2563eb] hover:shadow-[0_0_32px_rgba(59,130,246,0.5)]"
        >
          <Sparkles className="h-6 w-6" />
          Find Viral Idea — 10 ideas + scripts + previews in 30 sec
        </button>
      </div>

      {/* Video Generator Card — height 180px equivalent with padding */}
      <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6 shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Film className="h-4 w-4 text-[#3b82f6]" />
          Video Generator
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-[#71717a]">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white placeholder-[#71717a] focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              placeholder="e.g. AI productivity"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#71717a]">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as (typeof STYLES)[number])}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#71717a]">Length (sec)</label>
            <input
              type="number"
              min={5}
              max={60}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#71717a]">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#71717a]">Videos</label>
            <input
              type="number"
              min={1}
              max={50}
              value={videosCount}
              onChange={(e) => setVideosCount(Number(e.target.value))}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className="h-12 rounded-xl bg-[#3b82f6] px-6 font-medium text-white shadow-glow transition hover:bg-[#2563eb] hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]"
          >
            Generate Videos
          </button>
        </div>
      </div>

      {/* Script Editor — Notion-style */}
      <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-[#3b82f6]" />
          Script Editor
        </h2>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#71717a]">
              Hook
            </div>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
              placeholder="First line that grabs attention"
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#71717a]">
              Middle
            </div>
            <input
              type="text"
              value={middle}
              onChange={(e) => setMiddle(e.target.value)}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
              placeholder="Show problem"
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#71717a]">
              Twist
            </div>
            <input
              type="text"
              value={twist}
              onChange={(e) => setTwist(e.target.value)}
              className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
              placeholder="Unexpected reveal"
            />
          </div>
        </div>
      </div>

      {/* Video Preview — 9:16 aspect */}
      <div className="rounded-2xl border border-[#1c1c24] bg-[#14141c] p-6">
        <h2 className="mb-4 text-sm font-semibold text-white">Video Preview</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="aspect-[9/16] w-full max-w-[280px] shrink-0 overflow-hidden rounded-2xl bg-[#0b0b0f] shadow-glow">
            <div className="flex h-full w-full items-center justify-center text-[#71717a]">
              <span className="text-sm">▶ Preview</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-[#71717a]">Caption</label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white placeholder-[#71717a] focus:border-[#3b82f6] focus:outline-none"
                placeholder="Post caption..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#71717a]">Hashtags</label>
              <input
                type="text"
                className="w-full rounded-lg border border-[#1c1c24] bg-[#0b0b0f] px-3 py-2 text-sm text-white placeholder-[#71717a] focus:border-[#3b82f6] focus:outline-none"
                placeholder="#viral #ai #productivity"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#71717a]">Thumbnail</label>
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[#1c1c24] bg-[#0b0b0f] text-xs text-[#71717a]">
                Upload or generate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
