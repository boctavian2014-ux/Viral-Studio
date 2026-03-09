export type ViralPlatform = "tiktok" | "instagram" | "youtube";

export type TrendStage =
  | "micro_creators"
  | "niche_communities"
  | "mid_tier_creators"
  | "platform_explosion";

export type TrendCandidate = {
  id: string;
  platform: ViralPlatform;
  topic: string;
  hashtag: string;
  sound: string;
  score: number;
  stage: TrendStage;
  summary: string;
  signals: {
    viewAcceleration: number;
    creatorSpread: number;
    audioGrowth: number;
    engagementRatio: number;
    crossPlatformLift: number;
  };
};

export type IdeaVariant = {
  id: string;
  title: string;
  topic: string;
  platform: ViralPlatform;
  hook: string;
  template: string;
  trendScore: number;
  scoreHint: number;
  whyNow: string;
};

export type ScoredIdeaVariant = IdeaVariant & {
  curiosityGap: number;
  trendRelevance: number;
  competitionInverse: number;
  searchIntent: number;
  viralProbabilityScore: number;
  verdict: "promote" | "review" | "discard";
};

export type ScriptDraft = {
  ideaId: string;
  platform: ViralPlatform;
  title: string;
  hook: string;
  body: string;
  callToAction: string;
  caption: string;
};

export type PipelineJob = {
  jobId: string;
  ideaId: string;
  platform: ViralPlatform;
  status: "queued" | "processing" | "completed" | "failed";
  targetStage: "script" | "video" | "publish";
};

export type TrendCandidatesRequest = {
  topics?: string[];
  platforms?: ViralPlatform[];
  limit?: number;
};

export type TrendCandidatesResponse = {
  generatedAt: string;
  candidates: TrendCandidate[];
};

export type ScriptsGenerateRequest = {
  ideas: IdeaVariant[];
};

export type ScriptsGenerateResponse = {
  generatedAt: string;
  scripts: ScriptDraft[];
};

export type PipelineEnqueueRequest = {
  targetStage?: "script" | "video" | "publish";
  ideas: ScoredIdeaVariant[];
};

export type PipelineEnqueueResponse = {
  generatedAt: string;
  jobs: PipelineJob[];
};
