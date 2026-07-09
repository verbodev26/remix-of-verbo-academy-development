// Mock activities engine — persisted to localStorage so admin edits + student
// progress survive reloads without a backend.
import { loadLevels } from "./courses-store";

export type ExerciseType =
  | "fill_gaps"
  | "drag_drop"
  | "listen_select"
  | "read_select"
  | "record"
  | "read_complete"
  | "match";

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  fill_gaps: "Fill in the gaps",
  drag_drop: "Drag and drop",
  listen_select: "Listen and select",
  read_select: "Read and select",
  record: "Record yourself",
  read_complete: "Read and complete",
  match: "Match",
};

// ----- Categories (independent from Exercise Type) -----
export type ActivityCategory = string; // free-string so admin can extend the list.

export const MANDATORY_CATEGORIES = ["vocabulary", "grammar", "practice"] as const;
export const OPTIONAL_CATEGORIES = ["reading", "writing", "pronunciation"] as const;
export const DEFAULT_CATEGORIES: ActivityCategory[] = [
  ...MANDATORY_CATEGORIES,
  ...OPTIONAL_CATEGORIES,
];
export const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  practice: "Practice",
  reading: "Reading",
  writing: "Writing",
  pronunciation: "Pronunciation",
};
export function categoryLabel(id?: ActivityCategory): string {
  if (!id) return "Uncategorized";
  return CATEGORY_LABELS[id] ?? id.slice(0, 1).toUpperCase() + id.slice(1);
}
export function isMandatoryCategory(id?: ActivityCategory): boolean {
  return !!id && (MANDATORY_CATEGORIES as readonly string[]).includes(id);
}

export interface MatchItem {
  text: string;
  key: string;
}

export type SessionPhase = "pre" | "post";

export interface Activity {
  id: string;
  unit_id: string;
  name: string;
  type: ExerciseType;
  category?: ActivityCategory;
  session_phase?: SessionPhase; // defaults to "pre" for legacy activities
  // fill_gaps / read_complete
  paragraph?: string;
  answer?: string;
  // drag_drop / match
  items?: MatchItem[];
  // read_select / listen_select
  prompt?: string;
  audioName?: string; // listen_select only (mock placeholder)
  question?: string;
  options?: string[];
  correctIndex?: number;
}

const ACTIVITIES_KEY = "verbo:activities";
const COMPLETION_KEY = "verbo:unit-completion";
const ATTEMPTS_KEY = "verbo:unit-attempts";
const SCORES_KEY = "verbo:activity-scores";
const MILESTONE_KEY = "verbo:milestone-unlocks";

function safeRead<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
}
function safeWrite(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ }
}

const SEED: Activity[] = [
  { id: "act-seed-1", unit_id: "A1-U1", name: "Greeting basics", type: "fill_gaps", category: "vocabulary", paragraph: "Hello, my [blank] is Sarah.", answer: "name" },
  { id: "act-seed-2", unit_id: "A1-U1", name: "Pick the greeting", type: "read_select", category: "grammar", prompt: "Morning at the office.", question: "Which greeting fits best?", options: ["Good night", "Good morning", "See you", "Bye"], correctIndex: 1 },
  { id: "act-seed-3", unit_id: "A1-U1", name: "Say it out loud", type: "record", category: "practice", answer: "Nice to meet you." },
];

export function loadActivities(): Activity[] {
  const stored = safeRead<Activity[] | null>(ACTIVITIES_KEY, null);
  if (stored) return stored;
  safeWrite(ACTIVITIES_KEY, SEED);
  return SEED;
}
export function saveActivities(list: Activity[]) { safeWrite(ACTIVITIES_KEY, list); }

export function activitiesForUnit(unitId: string): Activity[] {
  return loadActivities().filter((a) => a.unit_id === unitId);
}

export function phaseOf(a: Activity): SessionPhase {
  return a.session_phase ?? "pre";
}


export function addActivity(a: Activity) {
  const list = loadActivities();
  list.push(a);
  saveActivities(list);
}

export function removeActivity(id: string) {
  saveActivities(loadActivities().filter((a) => a.id !== id));
}

/* ---- Completion + attempts ---- */
export function loadCompletion(): Record<string, boolean> {
  return safeRead<Record<string, boolean>>(COMPLETION_KEY, {});
}
export function setUnitCompleted(unitId: string, value: boolean) {
  const c = loadCompletion();
  c[unitId] = value;
  safeWrite(COMPLETION_KEY, c);
}

export function loadAttempts(): Record<string, number> {
  return safeRead<Record<string, number>>(ATTEMPTS_KEY, {});
}
export function incrementAttempts(unitId: string): number {
  const a = loadAttempts();
  a[unitId] = (a[unitId] ?? 0) + 1;
  safeWrite(ATTEMPTS_KEY, a);
  return a[unitId];
}
export function resetAttempts(unitId: string) {
  const a = loadAttempts();
  delete a[unitId];
  safeWrite(ATTEMPTS_KEY, a);
}

/* ---- Per-activity best scores ---- */
export interface ActivityScore { best: number; attempts: number; lastAt: string }
export function loadActivityScores(): Record<string, ActivityScore> {
  return safeRead<Record<string, ActivityScore>>(SCORES_KEY, {});
}
export function recordActivityScore(activityId: string, score: number): ActivityScore {
  const all = loadActivityScores();
  const cur = all[activityId] ?? { best: 0, attempts: 0, lastAt: "" };
  const next: ActivityScore = {
    best: Math.max(cur.best, Math.round(score)),
    attempts: cur.attempts + 1,
    lastAt: new Date().toISOString(),
  };
  all[activityId] = next;
  safeWrite(SCORES_KEY, all);
  return next;
}
export function bestScoreFor(activityId: string): number {
  return loadActivityScores()[activityId]?.best ?? 0;
}

/* ---- Milestone units (10 / 20 / 30) ---- */
export function unitNumberOf(unitId: string): number {
  const m = unitId.match(/-U(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}
export function isMilestoneUnit(unitId: string): boolean {
  const n = unitNumberOf(unitId);
  return n === 10 || n === 20 || n === 30;
}
function milestoneKey(studentId: string, unitId: string) { return `${studentId}::${unitId}`; }
export function loadMilestoneUnlocks(): Record<string, boolean> {
  return safeRead<Record<string, boolean>>(MILESTONE_KEY, {});
}
export function isMilestoneUnlocked(studentId: string, unitId: string): boolean {
  return !!loadMilestoneUnlocks()[milestoneKey(studentId, unitId)];
}
export function setMilestoneUnlocked(studentId: string, unitId: string, on: boolean) {
  const all = loadMilestoneUnlocks();
  if (on) all[milestoneKey(studentId, unitId)] = true;
  else delete all[milestoneKey(studentId, unitId)];
  safeWrite(MILESTONE_KEY, all);
}

/* ---- Unit pass rule ----
 * A unit is "passed" when every mandatory category present in that unit
 * has at least one activity with best score ≥ 60. Units without any mandatory
 * activity fall back to the legacy completion flag (admin override / seed).
 */
export function unitPassed(unitId: string): boolean {
  const list = activitiesForUnit(unitId);
  const scores = loadActivityScores();
  const byCat = new Map<string, Activity[]>();
  for (const a of list) {
    if (!isMandatoryCategory(a.category)) continue;
    const arr = byCat.get(a.category!) ?? [];
    arr.push(a);
    byCat.set(a.category!, arr);
  }
  if (byCat.size === 0) return !!loadCompletion()[unitId];
  for (const [, arr] of byCat) {
    const ok = arr.some((a) => (scores[a.id]?.best ?? 0) >= 60);
    if (!ok) return false;
  }
  return true;
}

export function unitCategoryProgress(unitId: string): {
  category: string; passed: boolean; best: number; mandatory: boolean;
}[] {
  const list = activitiesForUnit(unitId);
  const scores = loadActivityScores();
  const byCat = new Map<string, Activity[]>();
  for (const a of list) {
    const cat = a.category ?? "uncategorized";
    const arr = byCat.get(cat) ?? [];
    arr.push(a);
    byCat.set(cat, arr);
  }
  return Array.from(byCat.entries()).map(([category, arr]) => {
    const best = arr.reduce((m, a) => Math.max(m, scores[a.id]?.best ?? 0), 0);
    const mandatory = isMandatoryCategory(category);
    return { category, best, mandatory, passed: mandatory ? best >= 60 : true };
  });
}

export function renameUnitReferences(oldUnitId: string, newUnitId: string) {
  const activities = loadActivities();
  let changed = false;
  for (const a of activities) {
    if (a.unit_id === oldUnitId) {
      a.unit_id = newUnitId;
      changed = true;
    }
  }
  if (changed) saveActivities(activities);

  const completion = loadCompletion();
  if (oldUnitId in completion) {
    completion[newUnitId] = completion[oldUnitId];
    delete completion[oldUnitId];
    safeWrite(COMPLETION_KEY, completion);
  }

  const attempts = loadAttempts();
  if (oldUnitId in attempts) {
    attempts[newUnitId] = attempts[oldUnitId];
    delete attempts[oldUnitId];
    safeWrite(ATTEMPTS_KEY, attempts);
  }
}

/**
 * Legacy helper — retained for the old A1..B2 mock course view. New Learning
 * Path uses `computeUnitLocks` in student.courses.tsx which is aware of
 * milestone teacher-locks and per-student state.
 */
export function isUnitUnlocked(unitId: string): boolean {
  if (unitPassed(unitId)) return true;
  for (const lvl of loadLevels()) {
    const idx = lvl.units.findIndex((u) => u.id === unitId);
    if (idx === -1) continue;
    if (idx === 0) return true;
    return unitPassed(lvl.units[idx - 1].id);
  }
  return true;
}
