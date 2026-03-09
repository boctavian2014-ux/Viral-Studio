// Content generation helpers for viral-studio-services

import { randomUUID } from 'crypto';
import { Script, TrendCandidate } from './contracts';

/**
 * Generate a short-form script for a given trend.
 * Replace with a real LLM call when ready.
 */
export function generateScript(trend: TrendCandidate): Script {
  const lines = [
    `Hook: Everyone is talking about "${trend.topic}" on ${trend.platform}.`,
    `Body: Here's why this trend matters and how you can join the conversation.`,
    `CTA: Follow for more trending content every day!`,
  ];

  return {
    id: randomUUID(),
    trendId: trend.id,
    content: lines.join('\n'),
    durationSeconds: 30,
    createdAt: new Date().toISOString(),
  };
}
