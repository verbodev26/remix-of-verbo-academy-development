// VIP Course Builder store — per-student, teacher-authored units.
// Unlike Performance Sessions, VIP courses have NO skeleton, NO capsule/video,
// and no fixed unit count: the teacher adds units on demand.

export interface VipUnit {
  id: string; // e.g. VIP-<studentId>-<timestamp>
  student_id: string;
  title: string;
  file_url: string; // downloadable material (upload placeholder)
  file_name?: string;
  created_at: string;
}

const KEY = "verbo:vip-courses";
const EVENT = "verbo:vip-courses-updated";

function safeRead(): VipUnit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VipUnit[]) : [];
  } catch { return []; }
}
function safeWrite(list: VipUnit[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch { /* noop */ }
}

export function loadVipUnits(): VipUnit[] {
  return safeRead();
}

export function unitsForStudent(studentId: string): VipUnit[] {
  return safeRead()
    .filter((u) => u.student_id === studentId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function addVipUnit(studentId: string, title: string, fileUrl: string, fileName?: string): VipUnit {
  const unit: VipUnit = {
    id: `VIP-${studentId}-${Date.now()}`,
    student_id: studentId,
    title,
    file_url: fileUrl,
    file_name: fileName,
    created_at: new Date().toISOString(),
  };
  safeWrite([...safeRead(), unit]);
  return unit;
}

export function updateVipUnit(id: string, patch: Partial<Omit<VipUnit, "id" | "student_id" | "created_at">>) {
  safeWrite(safeRead().map((u) => (u.id === id ? { ...u, ...patch } : u)));
}

export function removeVipUnit(id: string) {
  safeWrite(safeRead().filter((u) => u.id !== id));
}

export function subscribeVipUnits(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

// Count of Completed sessions for this student — read from the real sessions
// engine so the unlock indicator matches what the rest of the app shows.
export function completedSessionCount(studentId: string, sessions: { student_id: string; status: string }[]): number {
  return sessions.filter((s) => s.student_id === studentId && s.status === "completed").length;
}