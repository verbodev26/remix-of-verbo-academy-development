// Weekly Challenges catalog — the source of truth for Admin > Challenges.
// Navigation: Product > Difficulty > list of challenges. VIP IS included here
// (unlike Courses). Challenges are complementary weekly activities and do NOT
// affect student performance/metrics. Persisted to localStorage and broadcast
// via a custom event so any open tab/route updates in real-time.

export type ChallengeProductId = "go" | "enterprise" | "international" | "vip";

export type DifficultyId = "esencial" | "intermedio" | "avanzado";

export interface Challenge {
  id: string; // e.g. GO-ESENCIAL-C1
  product: ChallengeProductId;
  difficulty: DifficultyId;
  category: string; // empty until admin assigns one
  title: string;
  description: string;
  video_url: string; // optional; empty = no attachment shown to students
}

export const PRODUCT_META: Record<ChallengeProductId, { label: string; description: string }> = {
  go: { label: "GO", description: "Flexible general English for individual learners." },
  enterprise: { label: "Enterprise", description: "Corporate programs for teams and organizations." },
  international: { label: "International", description: "Survival & travel-focused English tracks." },
  vip: { label: "VIP", description: "Premium one-to-one experience for VIP learners." },
};

export const PRODUCT_ORDER: ChallengeProductId[] = ["go", "enterprise", "international", "vip"];

export const DIFFICULTY_META: Record<DifficultyId, { label: string; dots: number }> = {
  esencial: { label: "Esencial", dots: 1 },
  intermedio: { label: "Intermedio", dots: 2 },
  avanzado: { label: "Avanzado", dots: 3 },
};

export const DIFFICULTY_ORDER: DifficultyId[] = ["esencial", "intermedio", "avanzado"];

export const CHALLENGES_PER_DIFFICULTY = 10;

export const CHALLENGES_KEY = "verbo:challenges";
export const CHALLENGES_EVENT = "verbo:challenges-updated";
export const CHALLENGE_CATEGORIES_KEY = "verbo:challenge-categories";
export const CHALLENGE_CATEGORIES_EVENT = "verbo:challenge-categories-updated";

/* ---------------- Challenges ---------------- */

export function loadChallenges(): Challenge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHALLENGES_KEY);
    if (raw) return JSON.parse(raw) as Challenge[];
  } catch { /* noop */ }
  return [];
}

export function persistChallenges(list: Challenge[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(CHALLENGES_EVENT));
  } catch { /* noop */ }
}

export function subscribeChallenges(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === CHALLENGES_KEY) cb(); };
  window.addEventListener(CHALLENGES_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHALLENGES_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function challengesFor(list: Challenge[], product: ChallengeProductId, difficulty: DifficultyId): Challenge[] {
  return list
    .filter((c) => c.product === product && c.difficulty === difficulty)
    .sort((a, b) => challengeNum(a.id) - challengeNum(b.id));
}

export function challengeNum(id: string): number {
  const m = id.match(/-C(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Build up to 10 empty challenge placeholders for a product/difficulty. */
export function buildSkeletonChallenges(
  product: ChallengeProductId,
  difficulty: DifficultyId,
  existing: Challenge[],
): Challenge[] {
  const prefix = `${PRODUCT_META[product].label.toUpperCase()}-${difficulty.toUpperCase()}`;
  const existingNums = new Set(existing.map((c) => challengeNum(c.id)));
  const generated: Challenge[] = [];
  for (let i = 1; i <= CHALLENGES_PER_DIFFICULTY; i++) {
    if (existingNums.has(i)) continue;
    generated.push({
      id: `${prefix}-C${i}`,
      product,
      difficulty,
      category: "",
      title: `Challenge ${i}`,
      description: "",
      video_url: "",
    });
  }
  return generated;
}

export function newChallengeId(
  product: ChallengeProductId,
  difficulty: DifficultyId,
  existing: Challenge[],
): string {
  const prefix = `${PRODUCT_META[product].label.toUpperCase()}-${difficulty.toUpperCase()}`;
  const max = existing.reduce((m, c) => Math.max(m, challengeNum(c.id)), 0);
  return `${prefix}-C${max + 1}`;
}

/* ---------------- Categories (starts completely empty) ---------------- */

export function loadCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHALLENGE_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* noop */ }
  return [];
}

export function persistCategories(cats: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHALLENGE_CATEGORIES_KEY, JSON.stringify(cats));
    window.dispatchEvent(new CustomEvent(CHALLENGE_CATEGORIES_EVENT));
  } catch { /* noop */ }
}

export function subscribeCategories(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === CHALLENGE_CATEGORIES_KEY) cb(); };
  window.addEventListener(CHALLENGE_CATEGORIES_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHALLENGE_CATEGORIES_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

// Deterministic color per category name so badges stay stable across renders.
const CATEGORY_TONES = [
  "bg-[#f38934]/15 text-[#f38934]",
  "bg-[#01304a]/10 text-[#01304a]",
  "bg-emerald-500/15 text-emerald-600",
  "bg-violet-500/15 text-violet-600",
  "bg-rose-500/15 text-rose-600",
  "bg-sky-500/15 text-sky-600",
  "bg-amber-500/15 text-amber-600",
  "bg-teal-500/15 text-teal-600",
];

export function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CATEGORY_TONES[hash % CATEGORY_TONES.length];
}
