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

// --- Trend Prediction (detect before viral) ---

export type RawVideoMetric = {
  video_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  audio?: string;
  created_at: string; // ISO
  /** Previous snapshot views (for velocity). */
  views_before?: number;
  /** Minutes between previous and this snapshot. */
  minutes_elapsed?: number;
  platform?: ViralPlatform;
  topic?: string;
};

export type TrendAlert = {
  id: string;
  topic: string;
  platform: ViralPlatform;
  score: number;
  growthRatePercent: number;
  videoId: string;
  detectedAt: string; // ISO
  suggestedHooks?: string[];
};

export type TrendPredictionIngestRequest = {
  metrics: RawVideoMetric[];
};

export type TrendPredictionIngestResponse = {
  processed: number;
  alertsCreated: number;
  alerts: TrendAlert[];
};

export type TrendPredictionAlertsResponse = {
  items: TrendAlert[];
};

// --- Viral prediction (1M+ views probability) ---

export type ViralPredictionFeatures = {
  hook_score?: number; // 0–100
  trend_score?: number; // 0–100
  emotion_score?: number; // 0–100
  curiosity_gap?: number; // 0–100
  video_length?: number; // seconds
  scene_count?: number;
  visual_novelty?: number; // 0–100
};

export type ViralPredictionResult = {
  probability: number; // 0–1
  estimatedViews: number; // e.g. 1_300_000
  confidence: "high" | "medium" | "low";
  label: "HIGH VIRAL POTENTIAL" | "LOW VIRAL POTENTIAL";
};

export type ViralPredictionRequest = {
  features: ViralPredictionFeatures;
};

// --- Creator style (clone viral creators) ---

export type CreatorStyleProfile = {
  creator: string;
  avg_length: number; // seconds
  hook_type: string; // question | statement | challenge | ...
  camera: string; // handheld vlog | static | ...
  editing: string; // fast jump cuts | slow | ...
  speech_speed?: string;
  caption_style?: string;
};

// --- Hook generator ---

export type HookCategory = "curiosity" | "shock" | "secret" | "money" | "mistake" | "challenge";

export type GenerateHookRequest = {
  topic: string;
  category?: HookCategory;
  style?: Partial<CreatorStyleProfile>;
};

export type GenerateHookResponse = {
  hook: string;
  trigger: string;
  topic: string;
  curiosityGap?: string;
};

// --- AI Influencer profile ---

export type InfluencerProfile = {
  name: string;
  niche: string;
  tone: string; // enthusiastic | calm | ...
  posting_frequency: string; // e.g. "3 videos/day"
};

export type HookAndScriptFromTopicRequest = {
  topic: string;
  category?: HookCategory;
  platform?: ViralPlatform;
  count?: number;
  stylePreset?: string;
};

export type HookAndScriptFromTopicResponse = {
  generatedAt: string;
  hooks: GenerateHookResponse[];
  ideas: IdeaVariant[];
  scripts: ScriptDraft[];
};

export type ViralPredictionMeta = {
  modelSource: "ml-service" | "fallback-formula";
};

export type ViralPredictionResponse = ViralPredictionResult & ViralPredictionMeta;

export type InfluencerRunRequest = {
  profile: InfluencerProfile;
  topic?: string;
  category?: HookCategory;
  platform?: ViralPlatform;
  count?: number;
  targetStage?: "script" | "video" | "publish";
  stylePreset?: string;
};

export type InfluencerRunResponse = {
  generatedAt: string;
  profile: InfluencerProfile;
  hooks: GenerateHookResponse[];
  ideas: ScoredIdeaVariant[];
  scripts: ScriptDraft[];
  jobs: PipelineJob[];
};
