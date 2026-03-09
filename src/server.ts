// Express HTTP server for viral-studio-services

import 'dotenv/config';
import { randomUUID } from 'crypto';
import express, { Request, Response, NextFunction } from 'express';

import {
  TrendCandidateRequest,
  ScriptGenerateRequest,
  PipelineEnqueueRequest,
} from './contracts';
import {
  enqueueJob,
  getPipelineJobs,
  getRecentScripts,
  getRecentTrends,
  getTrendById,
  saveTrend,
} from './persistence';
import { generateScript } from './generators';
import { saveScript } from './persistence';
import { startWorker } from './worker';

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Auth middleware (simple API key check)
// ---------------------------------------------------------------------------

const API_KEY = process.env.VIRAL_STUDIO_API_KEY ?? '';

function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (!API_KEY) {
    next();
    return;
  }
  const provided =
    req.headers['x-api-key'] ??
    (req.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '');
  if (provided !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /v1/trends/recent
app.get('/v1/trends/recent', requireApiKey, (_req: Request, res: Response) => {
  res.json(getRecentTrends());
});

// GET /v1/scripts/recent
app.get('/v1/scripts/recent', requireApiKey, (_req: Request, res: Response) => {
  res.json(getRecentScripts());
});

// GET /v1/pipeline/jobs
app.get('/v1/pipeline/jobs', requireApiKey, (_req: Request, res: Response) => {
  res.json(getPipelineJobs());
});

// POST /v1/trends/candidates
app.post(
  '/v1/trends/candidates',
  requireApiKey,
  (req: Request, res: Response) => {
    const body = req.body as TrendCandidateRequest;
    if (!body.topic || !body.platform) {
      res.status(400).json({ error: '`topic` and `platform` are required' });
      return;
    }
    const trend = {
      id: randomUUID(),
      topic: body.topic,
      platform: body.platform,
      score: body.score ?? 0,
      createdAt: new Date().toISOString(),
    };
    saveTrend(trend);
    res.status(201).json(trend);
  },
);

// POST /v1/scripts/generate
app.post(
  '/v1/scripts/generate',
  requireApiKey,
  (req: Request, res: Response) => {
    const body = req.body as ScriptGenerateRequest;
    if (!body.trendId) {
      res.status(400).json({ error: '`trendId` is required' });
      return;
    }
    const trend = getTrendById(body.trendId);
    if (!trend) {
      res.status(404).json({ error: 'Trend not found' });
      return;
    }
    const script = generateScript(trend);
    saveScript(script);
    res.status(201).json(script);
  },
);

// POST /v1/pipeline/enqueue
app.post(
  '/v1/pipeline/enqueue',
  requireApiKey,
  (req: Request, res: Response) => {
    const body = req.body as PipelineEnqueueRequest;
    if (!body.trendId) {
      res.status(400).json({ error: '`trendId` is required' });
      return;
    }
    const trend = getTrendById(body.trendId);
    if (!trend) {
      res.status(404).json({ error: 'Trend not found' });
      return;
    }
    const job = {
      id: randomUUID(),
      trendId: body.trendId,
      status: 'queued' as const,
      enqueuedAt: new Date().toISOString(),
    };
    enqueueJob(job);
    res.status(201).json(job);
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const host = process.env.VIRAL_STUDIO_HOST ?? '0.0.0.0';
const port = parseInt(process.env.VIRAL_STUDIO_PORT ?? '3000', 10);

app.listen(port, host, () => {
  console.log(`[server] Listening on http://${host}:${port}`);
  void startWorker();
});

export default app;
