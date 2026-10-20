const KEYS = [
  "budget", "minBudget", "maxBudget", "duration", "rating", "ratingCount",
  "bids", "country", "urgent", "fulltime", "onsite", "highlight", "ladder",
  "pin", "multi", "lowHire", "successRate",
];

export function buildEvaluator(formula: string | null | undefined) {
  const src = (formula || "").trim();
  if (!src) return (_ctx: Record<string, unknown>) => 0;
  let fn: (...args: unknown[]) => unknown;
  try {
    fn = new Function(...KEYS, `"use strict"; return (${src});`) as (...args: unknown[]) => unknown;
  } catch (err) {
    throw new Error(`Invalid formula: ${(err as Error).message}`);
  }
  return (ctx: Record<string, unknown>) => {
    try {
      const val = fn(...KEYS.map((k) => ctx[k]));
      const n = Number(val);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  };
}

export function evaluateAll<T extends { score: number }>(items: Omit<T, "score">[], formula: string | null, toCtx: (x: any) => Record<string, unknown>): (Omit<T, "score"> & { score: number })[] {
  const evalFn = buildEvaluator(formula);
  return items.map((p) => ({ ...p, score: evalFn(toCtx(p)) }));
}
