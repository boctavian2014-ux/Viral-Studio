// In-memory persistence store with placeholders for PostgreSQL and Redis

import { TrendCandidate, Script, PipelineJob } from './contracts';

// ---------------------------------------------------------------------------
// In-memory stores (replace with real DB queries when DATABASE_URL is set)
// ---------------------------------------------------------------------------

const trends: TrendCandidate[] = [];
const scripts: Script[] = [];
const jobs: PipelineJob[] = [];

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

export function saveTrend(trend: TrendCandidate): void {
  trends.push(trend);
}

export function getRecentTrends(limit = 20): TrendCandidate[] {
  return trends.slice(-limit).reverse();
}

export function getTrendById(id: string): TrendCandidate | undefined {
  return trends.find((t) => t.id === id);
}

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

export function saveScript(script: Script): void {
  scripts.push(script);
}

export function getRecentScripts(limit = 20): Script[] {
  return scripts.slice(-limit).reverse();
}

// ---------------------------------------------------------------------------
// Pipeline jobs
// ---------------------------------------------------------------------------

export function enqueueJob(job: PipelineJob): void {
  jobs.push(job);
}

export function getPipelineJobs(): PipelineJob[] {
  return jobs.slice().reverse();
}

export function getNextQueuedJob(): PipelineJob | undefined {
  return jobs.find((j) => j.status === 'queued');
}

export function updateJobStatus(
  id: string,
  status: PipelineJob['status'],
  scriptId?: string,
): void {
  const job = jobs.find((j) => j.id === id);
  if (job) {
    job.status = status;
    if (scriptId) job.scriptId = scriptId;
    if (status === 'done' || status === 'failed') {
      job.finishedAt = new Date().toISOString();
    }
  }
}

// ---------------------------------------------------------------------------
// Environment variable placeholders
// PostgreSQL: process.env.VIRAL_STUDIO_DATABASE_URL
// Redis:      process.env.VIRAL_STUDIO_REDIS_URL
// ---------------------------------------------------------------------------
