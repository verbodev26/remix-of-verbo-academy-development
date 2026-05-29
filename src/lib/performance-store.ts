// Per-session teacher → student performance ratings (4 criteria, 1-5).
export interface PerformanceRating {
  fluency: number;
  vocabulary: number;
  confidence: number;
  grammar: number;
}

export type PerformanceMap = Record<string, PerformanceRating>;

export const PERFORMANCE_KEY = "verbo:performance";
export const PERFORMANCE_EVENT = "verbo:performance-updated";

// Seed averages so the dashboard has data on first load.
const SEED: PerformanceMap = {
  s5: { fluency: 5, vocabulary: 4, confidence: 5, grammar: 4 },
  s6: { fluency: 4, vocabulary: 4, confidence: 3, grammar: 4 },
  s8: { fluency: 4, vocabulary: 5, confidence: 4, grammar: 3 },
};

let cached: PerformanceMap | null = null;

export function loadPerformance(): PerformanceMap {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(PERFORMANCE_KEY);
    if (raw) return JSON.parse(raw) as PerformanceMap;
  } catch { /* noop */ }
  try { localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(SEED)); } catch { /* noop */ }
  return SEED;
}

export function getPerformanceSnapshot(): PerformanceMap {
  if (cached === null) cached = loadPerformance();
  return cached;
}

export function getServerPerformanceSnapshot(): PerformanceMap {
  return SEED;
}

export function savePerformance(sessionId: string, rating: PerformanceRating) {
  if (typeof window === "undefined") return;
  const current = { ...getPerformanceSnapshot(), [sessionId]: rating };
  cached = current;
  try {
    localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(PERFORMANCE_EVENT));
  } catch { /* noop */ }
}

export function subscribePerformance(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const invalidate = () => { cached = null; cb(); };
  const onStorage = (e: StorageEvent) => { if (e.key === PERFORMANCE_KEY) invalidate(); };
  window.addEventListener(PERFORMANCE_EVENT, invalidate);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PERFORMANCE_EVENT, invalidate);
    window.removeEventListener("storage", onStorage);
  };
}

export function averagePerformance(sessionIds: string[], map: PerformanceMap): PerformanceRating & { count: number } {
  const ratings = sessionIds.map((id) => map[id]).filter(Boolean) as PerformanceRating[];
  const count = ratings.length;
  if (count === 0) return { fluency: 0, vocabulary: 0, confidence: 0, grammar: 0, count: 0 };
  const sum = ratings.reduce(
    (a, r) => ({
      fluency: a.fluency + r.fluency,
      vocabulary: a.vocabulary + r.vocabulary,
      confidence: a.confidence + r.confidence,
      grammar: a.grammar + r.grammar,
    }),
    { fluency: 0, vocabulary: 0, confidence: 0, grammar: 0 },
  );
  return {
    fluency: sum.fluency / count,
    vocabulary: sum.vocabulary / count,
    confidence: sum.confidence / count,
    grammar: sum.grammar / count,
    count,
  };
}
