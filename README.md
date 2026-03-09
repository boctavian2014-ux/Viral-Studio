# viral-studio-services

Minimal **Node.js + TypeScript** backend for an AI short-form content pipeline.

## Features

- Express HTTP server
- In-memory data store (swap for PostgreSQL/Redis when ready)
- Background pipeline worker
- Railway deployment ready

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Server health check |
| GET | `/v1/trends/recent` | API Key | List recent trend candidates |
| GET | `/v1/scripts/recent` | API Key | List recently generated scripts |
| GET | `/v1/pipeline/jobs` | API Key | List all pipeline jobs |
| POST | `/v1/trends/candidates` | API Key | Submit a new trend candidate |
| POST | `/v1/scripts/generate` | API Key | Generate a script for a trend |
| POST | `/v1/pipeline/enqueue` | API Key | Enqueue a trend for the pipeline |

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy and edit environment variables
cp .env.example .env

# Run in development
pnpm dev

# Build and run in production
pnpm build && pnpm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VIRAL_STUDIO_HOST` | Bind host | `0.0.0.0` |
| `VIRAL_STUDIO_PORT` | Listen port | `3000` |
| `VIRAL_STUDIO_API_KEY` | API key for protected routes | *(empty = no auth)* |
| `VIRAL_STUDIO_DATABASE_URL` | PostgreSQL connection string | — |
| `VIRAL_STUDIO_REDIS_URL` | Redis connection string | — |
| `VIRAL_STUDIO_QUEUE_KEY` | Redis key for the job queue | `pipeline:jobs` |
| `VIRAL_STUDIO_WORKER_POLL_MS` | Worker poll interval (ms) | `5000` |
| `VIRAL_STUDIO_WORKER_PROCESS_MS` | Simulated processing delay (ms) | `2000` |

## Authentication

Pass your API key via:
- Header: `X-Api-Key: <key>`, or
- Header: `Authorization: Bearer <key>`

If `VIRAL_STUDIO_API_KEY` is not set, authentication is disabled.

## Deploy to Railway

1. Create a new project in [Railway](https://railway.app)
2. Connect this repository
3. Set the environment variables listed above
4. Railway will use `railway.json` to build and start the service automatically

## Project Structure

```
src/
  contracts.ts   – TypeScript interfaces/types
  persistence.ts – In-memory store (PostgreSQL/Redis placeholders)
  generators.ts  – Script generation logic
  worker.ts      – Background pipeline worker
  server.ts      – Express HTTP server
```
