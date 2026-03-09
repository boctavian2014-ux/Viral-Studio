import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { enqueuePipeline, generateScripts, generateTrendCandidates } from "./generators.js";
import { createPersistence, type PersistenceLayer } from "./persistence.js";

const PORT = Number(process.env.VIRAL_STUDIO_PORT ?? 4317);
const HOST = process.env.VIRAL_STUDIO_HOST ?? "127.0.0.1";
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

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  persistence: PersistenceLayer,
): Promise<void> {
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
    process.stdout.write(`viral-studio-services listening on http://${HOST}:${PORT}\n`);
  });

  void persistence.init().catch((error) => {
    process.stderr.write(
      `persistence init failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
  });
}
