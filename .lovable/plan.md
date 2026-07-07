
# Reflect group-level session counts on grouped students

Right now `hired_sessions` / `remaining_sessions` are read from the `User` record, which is `0` for members of a group because those numbers live on the `Group` (e.g. Tilin — FEMSA belongs to a group with 10 hired sessions, but her user record has 0). Fix: whenever we display or gate on these two numbers, prefer the group's values when the student is in a group.

## 1. New helper — `effectiveSessionCounts(student)`

Add to `src/lib/groups-store.ts`:

```ts
export function effectiveSessionCounts(studentId: string, fallback: { hired?: number; remaining?: number }) {
  const info = groupOfStudent(studentId);
  if (info) {
    return {
      hired: info.group.hired_sessions ?? 0,
      remaining: info.group.remaining_sessions ?? 0,
      source: "group" as const,
    };
  }
  return { hired: fallback.hired ?? 0, remaining: fallback.remaining ?? 0, source: "individual" as const };
}
```

## 2. Apply in `src/routes/admin.students.tsx`

- **StudentCard** (lines 357–360): replace direct reads with `effectiveSessionCounts(s.id, { hired: s.hired_sessions, remaining: s.remaining_sessions })` so the "Sessions x/y" bar shows the group's totals for grouped members.
- **Overview modal** (line 1132): same swap in the `Info label="Sessions"` row.
- No change to the Register/Edit form fields for individual students; those still edit the user record. For grouped students, editing hired/remaining on the user record is a no-op display-wise since we always fall back to the group — no UX regression.

## 3. Apply in `src/routes/admin.sessions.tsx`

- **Student cards grid** (line 119): use `effectiveSessionCounts(s.id, { hired: s.hired_sessions }).hired` as the "hired" total so the "Scheduled X / hired" and "Remaining" numbers reflect the group contract.
- **BulkScheduler validation** (line 207): use the same helper to compute `remaining`, so the "0 hours remaining" warning stops firing incorrectly for group members whose group has capacity.

Scheduled-count logic stays as-is (`sessions.filter(...student_id===s.id...)`). This fixes the visible "0" that blocks scheduling. A dedicated group-shared session model (one event covers all members) is out of scope for this patch — noted in the earlier Groups plan.

## Files touched
- `src/lib/groups-store.ts` — export `effectiveSessionCounts`.
- `src/routes/admin.students.tsx` — read via helper in StudentCard + Overview.
- `src/routes/admin.sessions.tsx` — read via helper in student cards grid + BulkScheduler.

Nothing else changes.
