import type { RawVideoMetric, TrendAlert, ViralPlatform } from "./contracts.js";

const TREND_THRESHOLD = 80;
const VIEW_VELOCITY_WEIGHT = 0.4;
const ENGAGEMENT_WEIGHT = 0.3;
const HASHTAG_WEIGHT = 0.2;
const AUDIO_WEIGHT = 0.1;

/**
 * View velocity = views per minute (growth speed).
 */
function viewVelocity(m: RawVideoMetric): number {
  if (
    m.views_before != null &&
    m.minutes_elapsed != null &&
    m.minutes_elapsed > 0
  ) {
    return Math.max(0, (m.views - m.views_before) / m.minutes_elapsed);
  }
  return 0;
}

/**
 * Engagement rate = (likes + comments + shares) / views.
 * Scaled by 100 for score contribution.
 */
function engagementRate(m: RawVideoMetric): number {
  if (m.views <= 0) return 0;
  const total = m.likes + m.comments + m.shares;
  return (total / m.views) * 100;
}

/**
 * Hashtag growth proxy: more hashtags = more discovery (0–100 scale).
 * Real implementation would track same-hashtag video count over time.
 */
function hashtagGrowthProxy(m: RawVideoMetric): number {
  const count = m.hashtags?.length ?? 0;
  return Math.min(100, count * 15);
}

/**
 * Audio reuse proxy: presence of audio id (0 or 100).
 * Real implementation would track same-audio video count over time.
 */
function audioGrowthProxy(m: RawVideoMetric): number {
  return m.audio?.trim() ? 50 : 0;
}

/**
 * trend_score =
 *   (view_velocity_norm * 0.4) +
 *   (engagement_rate * 0.3) +
 *   (hashtag_growth * 0.2) +
 *   (audio_growth * 0.1)
 * All components 0–100; threshold 80 = trend alert.
 */
export function calculateTrendScore(m: RawVideoMetric): number {
  const vvRaw = viewVelocity(m);
  const vv = Math.min(100, vvRaw); // cap views/min contribution
  const er = Math.min(100, engagementRate(m));
  const hg = hashtagGrowthProxy(m);
  const ag = audioGrowthProxy(m);
  const score =
    vv * VIEW_VELOCITY_WEIGHT +
    er * ENGAGEMENT_WEIGHT +
    hg * (HASHTAG_WEIGHT / 100) +
    ag * (AUDIO_WEIGHT / 100);
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

export function detectTrend(m: RawVideoMetric): { trend: boolean; score: number } {
  const score = calculateTrendScore(m);
  return {
    trend: score > TREND_THRESHOLD,
    score,
  };
}

function growthRatePercent(m: RawVideoMetric): number {
  if (
    m.views_before != null &&
    m.views_before > 0 &&
    m.minutes_elapsed != null &&
    m.minutes_elapsed > 0
  ) {
    const growth = (m.views - m.views_before) / m.views_before;
    return Math.round(growth * 100 * 100) / 100;
  }
  return 0;
}

const DEFAULT_HOOKS = [
  "Nobody talks about this",
  "This changes everything",
  "The internet hides this",
];

function suggestHooks(topic: string): string[] {
  const t = topic.trim().toLowerCase() || "trend";
  return DEFAULT_HOOKS.map((h) => `${h} ${t}`);
}

/**
 * Process a batch of raw metrics: compute scores, filter by threshold, build alerts.
 */
export function processMetrics(metrics: RawVideoMetric[]): TrendAlert[] {
  const alerts: TrendAlert[] = [];
  for (const m of metrics) {
    const { trend, score } = detectTrend(m);
    if (!trend) continue;
    const platform: ViralPlatform =
      (m.platform as ViralPlatform) ?? "tiktok";
    const topic = m.topic ?? m.hashtags?.[0] ?? "viral";
    alerts.push({
      id: `alert-${m.video_id}-${Date.now()}`,
      topic,
      platform,
      score,
      growthRatePercent: growthRatePercent(m),
      videoId: m.video_id,
      detectedAt: new Date().toISOString(),
      suggestedHooks: suggestHooks(topic),
    });
  }
  return alerts;
}

/**
 * Cluster alerts by topic (group same topic for dashboard).
 */
export function clusterByTopic(alerts: TrendAlert[]): Map<string, TrendAlert[]> {
  const map = new Map<string, TrendAlert[]>();
  for (const a of alerts) {
    const key = `${a.platform}:${a.topic}`.toLowerCase();
    const list = map.get(key) ?? [];
    list.push(a);
    map.set(key, list);
  }
  return map;
}
