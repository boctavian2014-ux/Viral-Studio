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
- `POST /v1/trend-prediction/ingest` — send raw video metrics; returns trend alerts (score > 80)
- `POST /v1/viral-prediction/predict` — predict 1M+ viral probability (ML service if configured, otherwise fallback formula)
- `POST /v1/hooks/generate` — generate hook from topic/category
- `POST /v1/scripts/from-topic` — topic + category -> hooks + ideas + scripts
- `POST /v1/influencer/run` — influencer profile -> hooks + ideas + scripts + queued jobs

### Trend Prediction (detect before viral)

- **GET** `/v1/trend-prediction/alerts?limit=25` — list recent trend alerts.
- **POST** `/v1/trend-prediction/ingest` — body: `{ "metrics": [ { "video_id", "views", "likes", "comments", "shares", "hashtags", "created_at", "views_before?", "minutes_elapsed?" } ] }`. Score = view_velocity×0.4 + engagement×0.3 + hashtag×0.2 + audio×0.1; alerts created when score > 80.

### Viral prediction (1M+ views)

- **POST** `/v1/viral-prediction/predict` — body: `{ "features": { "hook_score", "trend_score", "emotion_score", "curiosity_gap", "video_length", "scene_count", "visual_novelty" } }`. Returns `{ "probability", "estimatedViews", "confidence", "label" }`. Threshold 0.65 = HIGH VIRAL POTENTIAL.

### Hook generator

- **POST** `/v1/hooks/generate` — body: `{ "topic": "AI tools", "category": "curiosity" }`. Returns `{ "hook", "trigger", "topic", "curiosityGap" }`. Categories: curiosity, shock, secret, money, mistake, challenge.

### Creator style presets

- **GET** `/v1/styles/presets` — returns preset styles (fast_storytelling, cinematic, challenge, educational) for script/video generation.

## Optional ML Predictor Service

Set these env vars on API service to use an external ML model endpoint:

- `VIRAL_STUDIO_ML_SERVICE_URL` (example: `https://your-ml-service.up.railway.app` base URL, without `/predict`)
- `VIRAL_STUDIO_ML_API_KEY` (optional bearer token)
- `VIRAL_STUDIO_ML_TIMEOUT_MS` (optional, default `3500`)

When ML service is unavailable, API automatically falls back to local formula predictor.

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
