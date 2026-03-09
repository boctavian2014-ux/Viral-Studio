// Domain contracts (types and interfaces) for viral-studio-services

export interface TrendCandidate {
  id: string;
  topic: string;
  platform: string;
  score: number;
  createdAt: string;
}

export interface Script {
  id: string;
  trendId: string;
  content: string;
  durationSeconds: number;
  createdAt: string;
}

export interface PipelineJob {
  id: string;
  trendId: string;
  scriptId?: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  enqueuedAt: string;
  finishedAt?: string;
}

// Request bodies

export interface TrendCandidateRequest {
  topic: string;
  platform: string;
  score?: number;
}

export interface ScriptGenerateRequest {
  trendId: string;
}

export interface PipelineEnqueueRequest {
  trendId: string;
}
