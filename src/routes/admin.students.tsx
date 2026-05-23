import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { USERS, SESSIONS, userById, type User } from "@/lib/mock-data";
import { Card, GhostButton, Pill, PrimaryButton } from "@/components/verbo/ui";
import { Plus, Lock, Unlock, X, Eye, EyeOff, KeyRound, Mail, Building2, CalendarDays, GraduationCap, History } from "lucide-react";

export const Route = createFileRoute("/admin/students")({ component: Page });

const CANCEL_LIMIT = 3;
const STORAGE_KEY = "verbo:club-cancels-v2";
const PROFILE_KEY = "verbo:student-profile-overrides";

function readCancels(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCancels(map: Record<string, number>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }
}

function readProfileOverrides(): Record<string, Partial<User>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeProfileOverrides(map: Record<string, Partial<User>>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(map));
  }
}

const PLAN_OPTIONS = [
  "Trial",
  "Standard Quarterly",
  "Standard Annual",
  "Premium Quarterly",
  "Premium Annual",
  "Enterprise",
];

function Page() {
  const [, forceTick] = useState(0);
  const [cancels, setCancels] = useState<Record<string, number>>(readCancels);
  const [editing, setEditing] = useState<User | null>(null);

  // Apply persisted overrides to the in-memory USERS array on mount
  useEffect(() => {
    const overrides = readProfileOverrides();
    USERS.forEach((u) => {
      if (overrides[u.id]) Object.assign(u, overrides[u.id]);
    });
    setCancels(readCancels());
    forceTick((n) => n + 1);
  }, []);

  const students = USERS.filter((u) => u.role === "student");

  const resetStudent = (studentId: string) => {
    const next = { ...cancels, [studentId]: 0 };
    setCancels(next);
    writeCancels(next);
  };

  const handleSave = (updated: User) => {
    const idx = USERS.findIndex((u) => u.id === updated.id);
    if (idx >= 0) USERS[idx] = updated;
    const overrides = readProfileOverrides();
    overrides[updated.id] = {
      name: updated.name,
      email: updated.email,
      password: updated.password,
      company: updated.company,
      hired_plan: updated.hired_plan,
      member_since: updated.member_since,
      hired_sessions: updated.hired_sessions,
      remaining_sessions: updated.remaining_sessions,
    };
    writeProfileOverrides(overrides);
    setEditing(null);
    forceTick((n) => n + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register, list and suspend students.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-40 shadow-sm">
          <Plus className="h-4 w-4" /> Register student
        </button>
      </div>

      <Card className="!p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Company</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium">Sessions</th>
              <th className="px-6 py-3 font-medium">Level</th>
              <th className="px-6 py-3 font-medium">Club Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const count = cancels[s.id] ?? 0;
              const blocked = count >= CANCEL_LIMIT;
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setEditing(s)}
                      className="text-left font-medium text-foreground transition-colors hover:text-[#f38934]"
                    >
                      {s.name}
                    </button>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{s.company ?? "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{s.hired_plan ?? "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {(s.remaining_sessions ?? 0)}/{(s.hired_sessions ?? 0)}
                  </td>
                  <td className="px-6 py-4"><Pill tone="muted">{s.current_level}</Pill></td>
                  <td className="px-6 py-4">
                    {blocked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                        <Lock className="h-3 w-3" />
                        {count}/{CANCEL_LIMIT} — BLOCKED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                        <Unlock className="h-3 w-3" />
                        {count}/{CANCEL_LIMIT} — Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {blocked && (
                        <button
                          onClick={() => resetStudent(s.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
                          style={{ backgroundColor: "#f38934" }}
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Unlock Clubs
                        </button>
                      )}
                      <GhostButton className="!py-1.5 !text-xs">Suspend</GhostButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {editing && (
        <StudentModal
          student={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ---------- Modal ----------
function StudentModal({
  student,
  onClose,
  onSave,
}: {
  student: User;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [form, setForm] = useState<User>({ ...student });
  const [showPassword, setShowPassword] = useState(false);

  const teacherHistory = useMemo(() => {
    const map = new Map<string, { name: string; count: number; last: string }>();
    SESSIONS.filter((s) => s.student_id === student.id).forEach((s) => {
      const t = userById(s.teacher_id);
      if (!t) return;
      const prev = map.get(t.id);
      if (prev) {
        prev.count += 1;
        if (s.date_time > prev.last) prev.last = s.date_time;
      } else {
        map.set(t.id, { name: t.name, count: 1, last: s.date_time });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [student.id]);

  const set = <K extends keyof User>(k: K, v: User[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleRecover = () => {
    alert(`A password recovery email has been sent to ${form.email}.`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-floating"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5" style={{ background: "linear-gradient(135deg, #01304a 0%, #02466b 100%)" }}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Student profile</div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{form.name}</h2>
            <p className="text-xs text-white/70">{form.company ?? "—"}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Student Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Company" icon={<Building2 className="h-3.5 w-3.5" />}>
              <input
                type="text"
                value={form.company ?? ""}
                onChange={(e) => set("company", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Email" icon={<Mail className="h-3.5 w-3.5" />}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Password" icon={<KeyRound className="h-3.5 w-3.5" />}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className={`${inputCls} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRecover}
                  className="rounded-lg border border-border bg-secondary px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70"
                >
                  Recover
                </button>
              </div>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Edit the field to change, or send a recovery email.
              </p>
            </Field>

            <Field label="Hired Plan" icon={<GraduationCap className="h-3.5 w-3.5" />}>
              <select
                value={form.hired_plan ?? ""}
                onChange={(e) => set("hired_plan", e.target.value)}
                className={inputCls}
              >
                <option value="">Select a plan</option>
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>

            <Field label="Member since" icon={<CalendarDays className="h-3.5 w-3.5" />}>
              <input
                type="date"
                value={form.member_since ?? ""}
                onChange={(e) => set("member_since", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Hired Sessions">
              <input
                type="number"
                min={0}
                value={form.hired_sessions ?? 0}
                onChange={(e) => set("hired_sessions", Number(e.target.value))}
                className={inputCls}
              />
            </Field>

            <Field label="Remaining Sessions">
              <input
                type="number"
                min={0}
                value={form.remaining_sessions ?? 0}
                onChange={(e) => set("remaining_sessions", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Teacher history */}
          <div className="mt-7">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              Teacher History
            </div>
            {teacherHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No past sessions on record.
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {teacherHistory.map((t) => (
                  <li key={t.name} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Last session: {new Date(t.last).toLocaleDateString()}
                      </div>
                    </div>
                    <Pill tone="muted">{t.count} session{t.count > 1 ? "s" : ""}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/30 px-6 py-4">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => onSave(form)}>Save changes</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
