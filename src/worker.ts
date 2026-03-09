import { createPersistence } from "./persistence.js";

const POLL_INTERVAL_MS = Number(process.env.VIRAL_STUDIO_WORKER_POLL_MS ?? 1000);
const PROCESSING_DELAY_MS = Number(process.env.VIRAL_STUDIO_WORKER_PROCESS_MS ?? 750);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const persistence = createPersistence();
  let stopped = false;

  const shutdown = async () => {
    stopped = true;
    await persistence.close();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
  });

  await persistence.init();
  process.stdout.write("viral-studio-worker started\n");

  while (!stopped) {
    const job = await persistence.popNextQueuedJob(2);
    if (!job) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    try {
      await persistence.markPipelineJobStatus(job.jobId, "processing");
      await sleep(PROCESSING_DELAY_MS);
      await persistence.markPipelineJobStatus(job.jobId, "completed");
      process.stdout.write(`processed ${job.jobId}\n`);
    } catch (error) {
      await persistence.markPipelineJobStatus(job.jobId, "failed");
      process.stderr.write(
        `failed ${job.jobId}: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
  }
}

void main();
