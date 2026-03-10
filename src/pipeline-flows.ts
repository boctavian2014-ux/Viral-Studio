import type {
  HookAndScriptFromTopicRequest,
  HookAndScriptFromTopicResponse,
  IdeaVariant,
  InfluencerRunRequest,
  InfluencerRunResponse,
  PipelineEnqueueResponse,
  ScoredIdeaVariant,
  ViralPlatform,
} from "./contracts.js";
import { enqueuePipeline, generateScripts } from "./generators.js";
import { generateHooks } from "./hook-generator.js";
import { getStylePreset } from "./style-profiles.js";

function normalizeCount(value: unknown, fallback = 5): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(30, Math.trunc(parsed));
}

function normalizePlatform(value: unknown): ViralPlatform {
  if (value === "instagram" || value === "youtube" || value === "tiktok") {
    return value;
  }
  return "tiktok";
}

function toIdea(topic: string, platform: ViralPlatform, hook: string, index: number, template: string): IdeaVariant {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return {
    id: `${platform}-${slug}-${index + 1}`,
    title: `${topic} — ${template} #${index + 1}`,
    topic,
    platform,
    hook,
    template,
    trendScore: Math.max(0.4, Math.min(0.99, 0.62 + index * 0.04)),
    scoreHint: Math.max(0.3, Math.min(0.99, 0.58 + index * 0.05)),
    whyNow: `${topic} shows accelerating demand on ${platform}.`,
  };
}

function scoreIdea(idea: IdeaVariant, index: number): ScoredIdeaVariant {
  const curiosityGap = Math.max(0.4, Math.min(0.98, 0.65 + index * 0.04));
  const trendRelevance = Math.max(0.4, Math.min(0.98, idea.trendScore));
  const competitionInverse = Math.max(0.25, Math.min(0.95, 0.55 - index * 0.03 + 0.2));
  const searchIntent = Math.max(0.3, Math.min(0.98, 0.63 + index * 0.03));
  const viralProbabilityScore = Math.min(
    0.99,
    curiosityGap * 0.3 + trendRelevance * 0.3 + competitionInverse * 0.15 + searchIntent * 0.25,
  );
  return {
    ...idea,
    curiosityGap,
    trendRelevance,
    competitionInverse,
    searchIntent,
    viralProbabilityScore,
    verdict: viralProbabilityScore >= 0.65 ? "promote" : "review",
  };
}

export function createTopicFlow(request: HookAndScriptFromTopicRequest): HookAndScriptFromTopicResponse {
  const topic = request.topic?.trim() || "AI tools";
  const count = normalizeCount(request.count, 5);
  const platform = normalizePlatform(request.platform);
  const style = request.stylePreset ? getStylePreset(request.stylePreset) : undefined;
  const template = style?.editing ?? "fast storytelling";
  const hooks = generateHooks(
    {
      topic,
      category: request.category,
      style: style ?? undefined,
    },
    count,
  );
  const ideas = hooks.map((entry, index) => toIdea(topic, platform, entry.hook, index, template));
  const scripts = generateScripts({ ideas }).scripts;
  return {
    generatedAt: new Date().toISOString(),
    hooks,
    ideas,
    scripts,
  };
}

export function runInfluencerFlow(
  request: InfluencerRunRequest,
): Omit<InfluencerRunResponse, "jobs"> & { enqueueRequest: Parameters<typeof enqueuePipeline>[0] } {
  const profile = request.profile;
  const topic = request.topic?.trim() || profile.niche || "AI productivity";
  const count = normalizeCount(request.count, 5);
  const platform = normalizePlatform(request.platform);
  const style = request.stylePreset ? getStylePreset(request.stylePreset) : undefined;
  const hooks = generateHooks(
    {
      topic,
      category: request.category,
      style: {
        creator: profile.name,
        hook_type: style?.hook_type ?? "question",
        editing: style?.editing ?? "fast jump cuts",
      },
    },
    count,
  );
  const ideas = hooks.map((entry, index) =>
    scoreIdea(
      toIdea(
        topic,
        platform,
        `${entry.hook} (${profile.tone})`,
        index,
        style?.editing ?? "fast jump cuts",
      ),
      index,
    ),
  );
  const scripts = generateScripts({ ideas }).scripts.map((script) => ({
    ...script,
    body: `${script.body} Keep ${profile.name}'s ${profile.tone} tone.`,
    caption: `${script.caption} #${profile.name.replace(/[^a-zA-Z0-9]/g, "")}`,
  }));
  return {
    generatedAt: new Date().toISOString(),
    profile,
    hooks,
    ideas,
    scripts,
    enqueueRequest: {
      targetStage: request.targetStage ?? "publish",
      ideas,
    },
  };
}

export function enqueueFromInfluencerFlow(
  enqueueRequest: Parameters<typeof enqueuePipeline>[0],
): PipelineEnqueueResponse {
  return enqueuePipeline(enqueueRequest);
}
