import { Pool } from "pg";
import { createClient } from "redis";
import type {
  PipelineJob,
  PipelineEnqueueRequest,
  PipelineEnqueueResponse,
  ScriptDraft,
  ScriptsGenerateRequest,
  ScriptsGenerateResponse,
  TrendCandidate,
  TrendCandidatesRequest,
  TrendCandidatesResponse,
} from "./contracts.js";

export type BackendStatus =
  | { status: "disabled" }
  | { status: "connected" }
  | { status: "error"; error: string };

export type PersistenceHealth = {
  postgres: BackendStatus;
  redis: BackendStatus;
  queueKey: string;
};

export type PersistenceLayer = {
  init: () => Promise<void>;
  close: () => Promise<void>;
  health: () => PersistenceHealth;
  readRecentTrendCandidates: (limit?: number) => Promise<TrendCandidate[]>;
  readRecentScripts: (limit?: number) => Promise<ScriptDraft[]>;
  readPipelineJobs: (limit?: number) => Promise<PipelineJob[]>;
  saveTrendCandidates: (
    request: TrendCandidatesRequest,
    response: TrendCandidatesResponse,
  ) => Promise<void>;
  saveScripts: (
    request: ScriptsGenerateRequest,
    response: ScriptsGenerateResponse,
  ) => Promise<void>;
  enqueueJobs: (
    request: PipelineEnqueueRequest,
    response: PipelineEnqueueResponse,
  ) => Promise<void>;
  popNextQueuedJob: (timeoutSec?: number) => Promise<PipelineJob | null>;
  markPipelineJobStatus: (
    jobId: string,
    status: "queued" | "processing" | "completed" | "failed",
  ) => Promise<void>;
};

type PersistenceOptions = {
  databaseUrl?: string;
  redisUrl?: string;
  queueKey?: string;
};

function stringifyError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createPersistence(options: PersistenceOptions = {}): PersistenceLayer {
  // Prefer explicit config, then our env name, then Railway's default from attached Postgres/Redis
  const databaseUrl =
    options.databaseUrl?.trim() ||
    process.env.VIRAL_STUDIO_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "";
  const redisUrl =
    options.redisUrl?.trim() ||
    process.env.VIRAL_STUDIO_REDIS_URL?.trim() ||
    process.env.REDIS_URL?.trim() ||
    "";
  const queueKey =
    options.queueKey?.trim() ||
    process.env.VIRAL_STUDIO_QUEUE_KEY?.trim() ||
    "viral-studio:pipeline-jobs";

  const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
  const redis = redisUrl ? createClient({ url: redisUrl }) : null;
  let postgresStatus: BackendStatus = { status: "disabled" };
  let redisStatus: BackendStatus = { status: "disabled" };

  async function initPostgres(): Promise<void> {
    if (!pool) {
      postgresStatus = { status: "disabled" };
      return;
    }
    try {
      await pool.query(`
        create table if not exists trend_candidates (
          id bigserial primary key,
          external_id text not null,
          platform text not null,
          topic text not null,
          hashtag text not null,
          sound text not null,
          score double precision not null,
          stage text not null,
          summary text not null,
          signals jsonb not null,
          request_payload jsonb not null,
          created_at timestamptz not null default now()
        );
      `);
      await pool.query(`
        create table if not exists script_drafts (
          id bigserial primary key,
          idea_id text not null,
          platform text not null,
          title text not null,
          hook text not null,
          body text not null,
          call_to_action text not null,
          caption text not null,
          request_payload jsonb not null,
          created_at timestamptz not null default now()
        );
      `);
      await pool.query(`
        create table if not exists pipeline_jobs (
          id bigserial primary key,
          job_id text not null unique,
          idea_id text not null,
          platform text not null,
          target_stage text not null,
          status text not null,
          payload jsonb not null,
          request_payload jsonb not null,
          created_at timestamptz not null default now()
        );
      `);
      await pool.query(
        "create index if not exists trend_candidates_external_id_idx on trend_candidates (external_id);",
      );
      await pool.query(
        "create index if not exists script_drafts_idea_id_idx on script_drafts (idea_id);",
      );
      await pool.query(
        "create index if not exists pipeline_jobs_idea_id_idx on pipeline_jobs (idea_id);",
      );
      postgresStatus = { status: "connected" };
    } catch (error) {
      postgresStatus = { status: "error", error: stringifyError(error) };
    }
  }

  async function initRedis(): Promise<void> {
    if (!redis) {
      redisStatus = { status: "disabled" };
      return;
    }
    try {
      await redis.connect();
      redisStatus = { status: "connected" };
    } catch (error) {
      redisStatus = { status: "error", error: stringifyError(error) };
    }
  }

  return {
    async init() {
      await Promise.all([initPostgres(), initRedis()]);
    },
    async close() {
      await Promise.allSettled([pool?.end(), redis?.isOpen ? redis.quit() : Promise.resolve()]);
    },
    health() {
      return {
        postgres: postgresStatus,
        redis: redisStatus,
        queueKey,
      };
    },
    async readRecentTrendCandidates(limit = 25) {
      if (!pool || postgresStatus.status !== "connected") {
        return [];
      }
      const result = await pool.query<{
        external_id: string;
        platform: string;
        topic: string;
        hashtag: string;
        sound: string;
        score: number;
        stage: string;
        summary: string;
        signals: TrendCandidate["signals"];
      }>(
        `
          select external_id, platform, topic, hashtag, sound, score, stage, summary, signals
          from trend_candidates
          order by created_at desc
          limit $1;
        `,
        [limit],
      );
      return result.rows.map((row: (typeof result.rows)[number]) => ({
        id: row.external_id,
        platform: row.platform as TrendCandidate["platform"],
        topic: row.topic,
        hashtag: row.hashtag,
        sound: row.sound,
        score: row.score,
        stage: row.stage as TrendCandidate["stage"],
        summary: row.summary,
        signals: row.signals,
      }));
    },
    async readRecentScripts(limit = 25) {
      if (!pool || postgresStatus.status !== "connected") {
        return [];
      }
      const result = await pool.query<{
        idea_id: string;
        platform: string;
        title: string;
        hook: string;
        body: string;
        call_to_action: string;
        caption: string;
      }>(
        `
          select idea_id, platform, title, hook, body, call_to_action, caption
          from script_drafts
          order by created_at desc
          limit $1;
        `,
        [limit],
      );
      return result.rows.map((row: (typeof result.rows)[number]) => ({
        ideaId: row.idea_id,
        platform: row.platform as ScriptDraft["platform"],
        title: row.title,
        hook: row.hook,
        body: row.body,
        callToAction: row.call_to_action,
        caption: row.caption,
      }));
    },
    async readPipelineJobs(limit = 25) {
      if (!pool || postgresStatus.status !== "connected") {
        return [];
      }
      const result = await pool.query<{ payload: PipelineJob }>(
        `
          select payload
          from pipeline_jobs
          order by created_at desc
          limit $1;
        `,
        [limit],
      );
      return result.rows.map((row: (typeof result.rows)[number]) => row.payload);
    },
    async saveTrendCandidates(request, response) {
      if (!pool || postgresStatus.status !== "connected") {
        return;
      }
      const requestPayload = JSON.stringify(request);
      for (const candidate of response.candidates) {
        await pool.query(
          `
            insert into trend_candidates (
              external_id, platform, topic, hashtag, sound, score, stage, summary, signals, request_payload
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb);
          `,
          [
            candidate.id,
            candidate.platform,
            candidate.topic,
            candidate.hashtag,
            candidate.sound,
            candidate.score,
            candidate.stage,
            candidate.summary,
            JSON.stringify(candidate.signals),
            requestPayload,
          ],
        );
      }
    },
    async saveScripts(request, response) {
      if (!pool || postgresStatus.status !== "connected") {
        return;
      }
      const requestPayload = JSON.stringify(request);
      for (const script of response.scripts) {
        await pool.query(
          `
            insert into script_drafts (
              idea_id, platform, title, hook, body, call_to_action, caption, request_payload
            ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb);
          `,
          [
            script.ideaId,
            script.platform,
            script.title,
            script.hook,
            script.body,
            script.callToAction,
            script.caption,
            requestPayload,
          ],
        );
      }
    },
    async enqueueJobs(request, response) {
      if (pool && postgresStatus.status === "connected") {
        const requestPayload = JSON.stringify(request);
        for (const job of response.jobs) {
          await pool.query(
            `
              insert into pipeline_jobs (
                job_id, idea_id, platform, target_stage, status, payload, request_payload
              ) values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)
              on conflict (job_id) do update set
                status = excluded.status,
                payload = excluded.payload,
                request_payload = excluded.request_payload;
            `,
            [
              job.jobId,
              job.ideaId,
              job.platform,
              job.targetStage,
              job.status,
              JSON.stringify(job),
              requestPayload,
            ],
          );
        }
      }
      if (redis && redisStatus.status === "connected") {
        for (const job of response.jobs) {
          await redis.rPush(queueKey, JSON.stringify(job));
        }
      }
    },
    async popNextQueuedJob(timeoutSec = 2) {
      if (!redis || redisStatus.status !== "connected") {
        return null;
      }
      const result = await redis.blPop(queueKey, timeoutSec);
      if (!result?.element) {
        return null;
      }
      return JSON.parse(result.element) as PipelineJob;
    },
    async markPipelineJobStatus(jobId, status) {
      if (!pool || postgresStatus.status !== "connected") {
        return;
      }
      await pool.query(
        `
          update pipeline_jobs
          set status = $2,
              payload = jsonb_set(payload, '{status}', to_jsonb($2::text), true)
          where job_id = $1;
        `,
        [jobId, status],
      );
    },
  };
}
