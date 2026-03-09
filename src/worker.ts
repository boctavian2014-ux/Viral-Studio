// Background worker that processes queued pipeline jobs

import { generateScript } from './generators';
import {
  getNextQueuedJob,
  getTrendById,
  saveScript,
  updateJobStatus,
} from './persistence';

const pollMs = parseInt(process.env.VIRAL_STUDIO_WORKER_POLL_MS ?? '5000', 10);
const processMs = parseInt(
  process.env.VIRAL_STUDIO_WORKER_PROCESS_MS ?? '2000',
  10,
);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processNextJob(): Promise<void> {
  const job = getNextQueuedJob();
  if (!job) return;

  updateJobStatus(job.id, 'processing');

  try {
    const trend = getTrendById(job.trendId);
    if (!trend) {
      updateJobStatus(job.id, 'failed');
      return;
    }

    // Simulate processing time
    await sleep(processMs);

    const script = generateScript(trend);
    saveScript(script);
    updateJobStatus(job.id, 'done', script.id);
  } catch (err) {
    console.error(`[worker] Job ${job.id} failed:`, err);
    updateJobStatus(job.id, 'failed');
  }
}

export async function startWorker(): Promise<void> {
  console.log(
    `[worker] Starting — poll every ${pollMs}ms, process delay ${processMs}ms`,
  );

  setInterval(() => {
    void processNextJob();
  }, pollMs);
}
