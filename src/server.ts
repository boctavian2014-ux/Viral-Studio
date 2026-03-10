import { readFileSync, existsSync } from "node:fs";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { enqueuePipeline, generateScripts, generateTrendCandidates } from "./generators.js";
import {
  createTopicFlow,
  enqueueFromInfluencerFlow,
  runInfluencerFlow,
} from "./pipeline-flows.js";
import { createPersistence, type PersistenceLayer } from "./persistence.js";
import { generateHook } from "./hook-generator.js";
import { processMetrics } from "./trend-prediction.js";
import { STYLE_PRESETS } from "./style-profiles.js";
import { predictViral } from "./viral-prediction.js";

const PORT = Number(process.env.PORT ?? process.env.VIRAL_STUDIO_PORT ?? 4317);
const HOST = process.env.VIRAL_STUDIO_HOST ?? "0.0.0.0";
const API_KEY = process.env.VIRAL_STUDIO_API_KEY?.trim() || "";

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function parseLimit(url: string | undefined, fallback = 25): number {
  if (!url) {
    return fallback;
  }
  const parsed = new URL(url, "http://127.0.0.1");
  const raw = parsed.searchParams.get("limit");
  const next = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(next) || next <= 0) {
    return fallback;
  }
  return Math.min(next, 200);
}

function isAuthorized(req: IncomingMessage): boolean {
  if (!API_KEY) {
    return true;
  }

  const headerApiKey = req.headers["x-api-key"];
  if (typeof headerApiKey === "string" && headerApiKey.trim() === API_KEY) {
    return true;
  }

  const auth = req.headers.authorization;
  return auth === `Bearer ${API_KEY}`;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

const DASHBOARD_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "dashboard.html",
);

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  persistence: PersistenceLayer,
): Promise<void> {
  if (req.method === "GET" && (req.url === "/" || req.url === "/dashboard" || req.url?.startsWith("/dashboard"))) {
    if (existsSync(DASHBOARD_PATH)) {
      const html = readFileSync(DASHBOARD_PATH, "utf8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
      return;
    }
  }

  if (req.method === "GET" && req.url === "/health") {
    writeJson(res, 200, { ok: true, persistence: persistence.health() });
    return;
  }

  if (!isAuthorized(req)) {
    writeJson(res, 401, { error: "Unauthorized" });
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/v1/trends/recent")) {
    writeJson(res, 200, {
      items: await persistence.readRecentTrendCandidates(parseLimit(req.url)),
    });
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/v1/scripts/recent")) {
    writeJson(res, 200, {
      items: await persistence.readRecentScripts(parseLimit(req.url)),
    });
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/v1/pipeline/jobs")) {
    writeJson(res, 200, {
      items: await persistence.readPipelineJobs(parseLimit(req.url)),
    });
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/v1/trend-prediction/alerts")) {
    writeJson(res, 200, {
      items: await persistence.readTrendAlerts(parseLimit(req.url)),
    });
    return;
  }

  if (req.method === "GET" && req.url === "/v1/styles/presets") {
    writeJson(res, 200, { presets: STYLE_PRESETS });
    return;
  }

  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);

    if (req.url === "/v1/trends/candidates") {
      const response = generateTrendCandidates(
        body as Parameters<typeof generateTrendCandidates>[0],
      );
      await persistence.saveTrendCandidates(
        body as Parameters<typeof generateTrendCandidates>[0],
        response,
      );
      writeJson(res, 200, response);
      return;
    }

    if (req.url === "/v1/scripts/generate") {
      const response = generateScripts(body as Parameters<typeof generateScripts>[0]);
      await persistence.saveScripts(body as Parameters<typeof generateScripts>[0], response);
      writeJson(res, 200, response);
      return;
    }

    if (req.url === "/v1/pipeline/enqueue") {
      const response = enqueuePipeline(body as Parameters<typeof enqueuePipeline>[0]);
      await persistence.enqueueJobs(body as Parameters<typeof enqueuePipeline>[0], response);
      writeJson(res, 200, response);
      return;
    }

    if (req.url === "/v1/trend-prediction/ingest") {
      const { metrics = [] } = body as { metrics?: Parameters<typeof processMetrics>[0] };
      const alerts = processMetrics(metrics);
      await persistence.saveTrendAlerts(alerts);
      writeJson(res, 200, {
        processed: metrics.length,
        alertsCreated: alerts.length,
        alerts,
      });
      return;
    }

    if (req.url === "/v1/viral-prediction/predict") {
      const { features } = body as { features?: Parameters<typeof predictViral>[0] };
      const result = await predictViral(features ?? {});
      writeJson(res, 200, result);
      return;
    }

    if (req.url === "/v1/hooks/generate") {
      const payload = body as Parameters<typeof generateHook>[0];
      const result = generateHook(payload);
      writeJson(res, 200, result);
      return;
    }

    if (req.url === "/v1/scripts/from-topic") {
      const response = createTopicFlow(body as Parameters<typeof createTopicFlow>[0]);
      await persistence.saveScripts({ ideas: response.ideas }, { generatedAt: response.generatedAt, scripts: response.scripts });
      writeJson(res, 200, response);
      return;
    }

    if (req.url === "/v1/influencer/run") {
      const flow = runInfluencerFlow(body as Parameters<typeof runInfluencerFlow>[0]);
      await persistence.saveScripts({ ideas: flow.ideas }, { generatedAt: flow.generatedAt, scripts: flow.scripts });
      const jobs = enqueueFromInfluencerFlow(flow.enqueueRequest);
      await persistence.enqueueJobs(flow.enqueueRequest, jobs);
      writeJson(res, 200, {
        generatedAt: flow.generatedAt,
        profile: flow.profile,
        hooks: flow.hooks,
        ideas: flow.ideas,
        scripts: flow.scripts,
        jobs: jobs.jobs,
      });
      return;
    }

    writeJson(res, 404, { error: "Not found" });
  } catch (error) {
    writeJson(res, 400, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function createServer(persistence: PersistenceLayer = createPersistence()) {
  return http.createServer((req, res) => {
    void handleRequest(req, res, persistence);
  });
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === entryUrl) {
  const dbEnv =
    process.env.VIRAL_STUDIO_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
  const redisEnv =
    process.env.VIRAL_STUDIO_REDIS_URL?.trim() || process.env.REDIS_URL?.trim() || "";
  process.stdout.write(
    `env: DATABASE_URL=${dbEnv ? "set" : "not set"}, REDIS_URL=${redisEnv ? "set" : "not set"}\n`,
  );
  const persistence = createPersistence();
  const server = createServer(persistence);
  const shutdown = async () => {
    server.close();
    await persistence.close();
  };

  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
  });

  server.listen(PORT, HOST, () => {
    process.stdout.write(
      `viral-studio-services listening on http://${HOST}:${PORT} (PORT=${String(process.env.PORT ?? "")})\n`,
    );
  });

  void persistence.init().catch((error) => {
    process.stderr.write(
      `persistence init failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
  });
}
