# Viral Studio Services

Minimal Railway-deployable backend for an AI short-form content pipeline.

## What it does

This service provides:

- batch trend candidate generation
- batch script generation
- pipeline job enqueueing
- PostgreSQL persistence
- Redis queue support
- a separate worker process

## Endpoints

### GET

- `GET /` or `GET /dashboard` — serves the **dashboard UI** (HTML). Use it to check health, list recent trends/scripts/jobs, and trigger POST actions.
- `GET /health`
- `GET /v1/trends/recent?limit=25`
- `GET /v1/scripts/recent?limit=25`
- `GET /v1/pipeline/jobs?limit=25`

### POST

- `POST /v1/trends/candidates`
- `POST /v1/scripts/generate`
- `POST /v1/pipeline/enqueue`

## Local development

Install dependencies:

```bash
pnpm install
```

Run the API:

```bash
pnpm dev
```

Run the worker:

```bash
pnpm dev:worker
```

Build:

```bash
pnpm build
```

Run built API:

```bash
pnpm start
```

Run built worker:

```bash
pnpm start:worker
```

## Environment variables

- `VIRAL_STUDIO_HOST`
- `VIRAL_STUDIO_PORT`
- `VIRAL_STUDIO_API_KEY`
- `VIRAL_STUDIO_DATABASE_URL`
- `VIRAL_STUDIO_REDIS_URL`
- `VIRAL_STUDIO_QUEUE_KEY`
- `VIRAL_STUDIO_WORKER_POLL_MS`
- `VIRAL_STUDIO_WORKER_PROCESS_MS`

Defaults:

- port: `4317`
- queue key: `viral-studio:pipeline-jobs`

## Persistence behavior

When `VIRAL_STUDIO_DATABASE_URL` is set, the service auto-creates:

- `trend_candidates`
- `script_drafts`
- `pipeline_jobs`

When `VIRAL_STUDIO_REDIS_URL` is set, pipeline jobs are pushed into the Redis list in `VIRAL_STUDIO_QUEUE_KEY`.

## Railway

Recommended setup:

1. Deploy this repository as a Railway service
2. Attach PostgreSQL
3. Attach Redis
4. Set env vars from `.env.example`
5. Keep the health check path as `/health`

Create a second Railway service for the worker using the same repo and set its start command to:

```bash
pnpm start:worker
```
