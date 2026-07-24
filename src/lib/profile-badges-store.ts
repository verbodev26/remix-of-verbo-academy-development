// Profile Badges catalog — admin-editable list of the badges shown on the
// student Dashboard (equipped badge next to the name) and inside the
// Profile modal (Equipped Badges + Achievements Gallery).
//
// Same declarative rule engine + persistence pattern as badges-store.ts
// (Challenge Badges), but with entirely separate storage keys and metrics.
// Do NOT merge this with badges-store.ts — those two systems are intentionally
// independent.

import type { User } from "./mock-data";
import { unitPassed, levelIsComplete } from "./activities-store";
import { loadCourses } from "./product-courses-store";

export type BadgeMetric =
  | "tenureMonths"
  | "attendancePercentage"
  | "unitsCompletedCount"
  | "levelsCompletedCount";

export const BADGE_METRIC_META: Record<
  BadgeMetric,
  { label: string; numeric: boolean; hint: string }
> = {
  tenureMonths: {
    label: "Months active",
    numeric: true,
    hint: "Number of full months since the student joined Verbo.",
  },
  attendancePercentage: {
    label: "Attendance percentage",
    numeric: true,
    hint: "The student's overall attendance percentage (0–100).",
  },
  unitsCompletedCount: {
    label: "Units completed",
    numeric: true,
    hint: "Number of Learning Path units the student has completed.",
  },
  levelsCompletedCount: {
    label: "Levels completed",
    numeric: true,
    hint: "Number of contracted levels the student has finished 100%.",
  },
};

export interface BadgeRule {
  metric: BadgeMetric;
  /** Required for numeric metrics; ignored for boolean metrics. */
  threshold?: number;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  /** Data URL of the badge image (GIF/PNG/JPG/WebP). Empty = not yet configured. */
  image: string;
  rule: BadgeRule;
}

export interface BadgeContext {
  tenureMonths: number;
  attendancePercentage: number;
  unitsCompletedCount: number;
  levelsCompletedCount: number;
}

export function isBadgeEarned(badge: BadgeDef, ctx: BadgeContext): boolean {
  const { metric, threshold } = badge.rule;
  const value = ctx[metric] as number;
  const t = typeof threshold === "number" ? threshold : 1;
  return value >= t;
}

/* ---------------- Context builder ---------------- */

function monthsBetween(fromISO: string | undefined, now: Date): number {
  if (!fromISO) return 0;
  const from = new Date(fromISO);
  if (Number.isNaN(+from)) return 0;
  const years = now.getFullYear() - from.getFullYear();
  const months = now.getMonth() - from.getMonth();
  const dayAdj = now.getDate() >= from.getDate() ? 0 : -1;
  return Math.max(0, years * 12 + months + dayAdj);
}

/**
 * Compute the 4 numeric metrics for a real student user. Falls back to 0 for
 * every value that does not apply (e.g. VIP students without a Learning Path,
 * or a product not present in the ProductCourse catalog).
 */
export function buildProfileBadgeContext(user: User): BadgeContext {
  const tenureMonths = monthsBetween(user.member_since, new Date());
  const attendancePercentage = Math.max(0, Math.min(100, user.attendance_percentage ?? 0));

  let unitsCompletedCount = 0;
  let levelsCompletedCount = 0;

  const product = user.product;
  if (product && product !== "vip") {
    const catalog = loadCourses();
    const course = catalog.find((c) => c.product === product);
    if (course) {
      for (const level of course.levels) {
        for (const u of level.units) {
          if (unitPassed(user.id, u.id)) unitsCompletedCount++;
        }
      }
      const contracted = new Set(user.contracted_levels ?? []);
      for (const level of course.levels) {
        if (contracted.size > 0 && !contracted.has(level.name)) continue;
        if (levelIsComplete(level, user.id)) levelsCompletedCount++;
      }
    }
  }

  return { tenureMonths, attendancePercentage, unitsCompletedCount, levelsCompletedCount };
}

/* ---------------- Seed ---------------- */

const BADGES_SEED: BadgeDef[] = [
  { id: "member",     name: "Verbo Member",       description: "Active for 3+ months.",                image: "", rule: { metric: "tenureMonths",          threshold: 3 } },
  { id: "veteran",    name: "Verbo Veteran",      description: "Active for 12+ months.",               image: "", rule: { metric: "tenureMonths",          threshold: 12 } },
  { id: "attendance", name: "Perfect Attendance", description: "95% attendance or higher.",            image: "", rule: { metric: "attendancePercentage",  threshold: 95 } },
  { id: "first",      name: "First Steps",        description: "Completed your first 10 units.",       image: "", rule: { metric: "unitsCompletedCount",   threshold: 10 } },
  { id: "explorer",   name: "Explorer",           description: "Completed 50 units.",                  image: "", rule: { metric: "unitsCompletedCount",   threshold: 50 } },
  { id: "master",     name: "Unit Master",        description: "Completed 150 units.",                 image: "", rule: { metric: "unitsCompletedCount",   threshold: 150 } },
  { id: "conqueror",  name: "Level Conqueror",    description: "Completed 100% of a level.",           image: "", rule: { metric: "levelsCompletedCount",  threshold: 1 } },
  { id: "legend",     name: "Level Legend",       description: "Completed 100% of 3 different levels.", image: "", rule: { metric: "levelsCompletedCount",  threshold: 3 } },
];

/* ---------------- Persistence ---------------- */

export const BADGES_KEY = "verbo:profile-badges";
export const BADGES_EVENT = "verbo:profile-badges-updated";

function isValidBadge(b: unknown): b is BadgeDef {
  if (!b || typeof b !== "object") return false;
  const r = b as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.description === "string" &&
    typeof r.image === "string" &&
    !!r.rule &&
    typeof (r.rule as Record<string, unknown>).metric === "string"
  );
}

export function loadBadges(): BadgeDef[] {
  if (typeof window === "undefined") return BADGES_SEED.slice();
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidBadge)) {
        return parsed as BadgeDef[];
      }
    }
  } catch { /* noop */ }
  return BADGES_SEED.slice();
}

export function persistBadges(list: BadgeDef[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BADGES_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(BADGES_EVENT));
  } catch { /* noop */ }
}

export function subscribeBadges(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === BADGES_KEY) cb(); };
  window.addEventListener(BADGES_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(BADGES_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function newBadgeId(existing: BadgeDef[]): string {
  const taken = new Set(existing.map((b) => b.id));
  let i = existing.length + 1;
  while (taken.has(`pbadge-${i}`)) i++;
  return `pbadge-${i}`;
}
