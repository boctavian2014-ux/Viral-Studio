import type {
  IdeaVariant,
  PipelineEnqueueRequest,
  PipelineEnqueueResponse,
  ScriptDraft,
  ScriptsGenerateRequest,
  ScriptsGenerateResponse,
  ScoredIdeaVariant,
  TrendCandidate,
  TrendCandidatesRequest,
  TrendCandidatesResponse,
  TrendStage,
  ViralPlatform,
} from "./contracts.js";

const DEFAULT_TOPICS = [
  "ai video editing",
  "ai productivity",
  "ai tools",
  "creator growth",
  "short form storytelling",
];

const DEFAULT_PLATFORMS: ViralPlatform[] = ["tiktok", "instagram", "youtube"];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number): number {
  return Math.round(clamp01(value) * 1000) / 1000;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRange(seed: string, min: number, max: number): number {
  const unit = hashSeed(seed) / 4294967295;
  return min + unit * (max - min);
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function normalizeTopics(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_TOPICS];
  }
  const topics = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return topics.length > 0 ? topics : [...DEFAULT_TOPICS];
}

function normalizePlatforms(value: unknown): ViralPlatform[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_PLATFORMS];
  }
  const platforms = value.filter(
    (entry): entry is ViralPlatform =>
      entry === "tiktok" || entry === "instagram" || entry === "youtube",
  );
  return platforms.length > 0 ? platforms : [...DEFAULT_PLATFORMS];
}

function resolveStage(score: number): TrendStage {
  if (score >= 0.94) {
    return "platform_explosion";
  }
  if (score >= 0.86) {
    return "mid_tier_creators";
  }
  if (score >= 0.8) {
    return "niche_communities";
  }
  return "micro_creators";
}

function buildTrendCandidate(
  topic: string,
  platform: ViralPlatform,
  ordinal: number,
): TrendCandidate {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const seed = `${platform}:${slug}:${ordinal}`;
  const signals = {
    viewAcceleration: roundScore(seededRange(`${seed}:view`, 0.61, 0.99)),
    creatorSpread: roundScore(seededRange(`${seed}:creator`, 0.46, 0.95)),
    audioGrowth: roundScore(seededRange(`${seed}:audio`, 0.42, 0.97)),
    engagementRatio: roundScore(seededRange(`${seed}:engagement`, 0.4, 0.92)),
    crossPlatformLift: roundScore(seededRange(`${seed}:cross`, 0.28, 0.89)),
  };
  const score = roundScore(
    signals.viewAcceleration * 0.35 +
      signals.creatorSpread * 0.25 +
      signals.audioGrowth * 0.2 +
      signals.engagementRatio * 0.15 +
      signals.crossPlatformLift * 0.05,
  );
  return {
    id: `${platform}-${slug}-${ordinal + 1}`,
    platform,
    topic,
    hashtag: `#${slug.replace(/-/g, "")}`,
    sound: `${slug}-sound-${ordinal + 1}`,
    score,
    stage: resolveStage(score),
    summary: `${topic} shows early acceleration on ${platform} with reusable audio and widening creator spread.`,
    signals,
  };
}

function buildScript(idea: IdeaVariant): ScriptDraft {
  return {
    ideaId: idea.id,
    platform: idea.platform,
    title: idea.title,
    hook: idea.hook,
    body: `Open with the outcome, prove why ${idea.topic} matters now, then explain the tactic in two fast beats and end with one concrete creator action.`,
    callToAction: "Follow for more early trends and creator systems.",
    caption: `${idea.hook}. ${idea.title}. #${idea.topic.replace(/[^a-zA-Z0-9]+/g, "")}`,
  };
}

function buildJob(
  idea: ScoredIdeaVariant,
  targetStage: "script" | "video" | "publish",
): PipelineEnqueueResponse["jobs"][number] {
  return {
    jobId: `job-${idea.id}-${targetStage}`,
    ideaId: idea.id,
    platform: idea.platform,
    status: "queued",
    targetStage,
  };
}

export function generateTrendCandidates(body: TrendCandidatesRequest): TrendCandidatesResponse {
  const topics = normalizeTopics(body.topics);
  const platforms = normalizePlatforms(body.platforms);
  const limit = normalizeNumber(body.limit, 24, 1, 200);
  const candidates = topics
    .flatMap((topic, topicIndex) =>
      platforms.map((platform, platformIndex) =>
        buildTrendCandidate(topic, platform, topicIndex * platforms.length + platformIndex),
      ),
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return {
    generatedAt: new Date().toISOString(),
    candidates,
  };
}

export function generateScripts(body: ScriptsGenerateRequest): ScriptsGenerateResponse {
  return {
    generatedAt: new Date().toISOString(),
    scripts: (body.ideas ?? []).map(buildScript),
  };
}

export function enqueuePipeline(body: PipelineEnqueueRequest): PipelineEnqueueResponse {
  const targetStage = body.targetStage ?? "video";
  return {
    generatedAt: new Date().toISOString(),
    jobs: (body.ideas ?? []).map((idea) => buildJob(idea, targetStage)),
  };
}
