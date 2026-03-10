import type { CreatorStyleProfile } from "./contracts.js";

/** Preset styles that clone common viral creator patterns. */
export const STYLE_PRESETS: Record<string, CreatorStyleProfile> = {
  fast_storytelling: {
    creator: "fast_storytelling",
    avg_length: 21,
    hook_type: "provocative question",
    camera: "handheld vlog",
    editing: "fast jump cuts",
    speech_speed: "fast",
    caption_style: "short + emoji",
  },
  cinematic: {
    creator: "cinematic",
    avg_length: 45,
    hook_type: "statement",
    camera: "static or slow pan",
    editing: "slow cuts",
    speech_speed: "medium",
    caption_style: "minimal",
  },
  challenge: {
    creator: "challenge",
    avg_length: 18,
    hook_type: "challenge",
    camera: "handheld",
    editing: "fast jump cuts",
    speech_speed: "fast",
    caption_style: "call to action",
  },
  educational: {
    creator: "educational",
    avg_length: 35,
    hook_type: "question",
    camera: "talking head or screen",
    editing: "medium",
    speech_speed: "medium",
    caption_style: "bullet points",
  },
};

export function getStylePreset(name: string): CreatorStyleProfile | undefined {
  return STYLE_PRESETS[name];
}
