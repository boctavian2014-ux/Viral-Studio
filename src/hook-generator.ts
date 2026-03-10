import type { GenerateHookRequest, GenerateHookResponse, HookCategory } from "./contracts.js";

const TRIGGERS: Record<HookCategory, string[]> = {
  curiosity: [
    "Nobody talks about",
    "The truth about",
    "What they don't tell you about",
    "Why nobody mentions",
    "The secret behind",
  ],
  shock: [
    "This mistake costs you",
    "Stop doing this",
    "I can't believe",
    "This changed everything",
    "You're doing it wrong",
  ],
  secret: [
    "Nobody knows",
    "The hidden trick to",
    "Insiders never share",
    "The real reason",
    "What experts hide about",
  ],
  money: [
    "This made me",
    "How I made",
    "The fastest way to",
    "This trick saves you",
    "Why this is worth",
  ],
  mistake: [
    "This mistake with",
    "I wasted years before",
    "Don't make this error with",
    "Why most people fail at",
    "The one thing that breaks",
  ],
  challenge: [
    "I tested this for 30 days",
    "I tried this for a week",
    "Can you do this",
    "Nobody expects this result from",
    "What happens when you",
  ],
};

const CURIOSITY_GAPS: string[] = [
  "until you try this",
  "until now",
  "— here's what actually works",
  "— the trick nobody shows",
  "— watch what happens",
];

const DEFAULT_CATEGORY: HookCategory = "curiosity";

function pick<T>(arr: T[], seed?: number): T {
  const i = seed != null ? Math.floor(Math.abs(seed) % arr.length) : Math.floor(Math.random() * arr.length);
  return arr[i]!;
}

/**
 * Hook = Trigger + Topic + Curiosity Gap
 */
export function generateHook(request: GenerateHookRequest): GenerateHookResponse {
  const topic = request.topic?.trim() || "this";
  const category = request.category ?? DEFAULT_CATEGORY;
  const triggers = TRIGGERS[category] ?? TRIGGERS.curiosity;
  const trigger = pick(triggers);
  const gap = pick(CURIOSITY_GAPS);
  const hook = `${trigger} ${topic} ${gap}`.trim();
  return {
    hook,
    trigger,
    topic,
    curiosityGap: gap,
  };
}

export function generateHooks(request: GenerateHookRequest, count: number): GenerateHookResponse[] {
  const seen = new Set<string>();
  const out: GenerateHookResponse[] = [];
  for (let i = 0; i < count; i++) {
    const res = generateHook({ ...request });
    if (!seen.has(res.hook)) {
      seen.add(res.hook);
      out.push(res);
    }
  }
  return out;
}
