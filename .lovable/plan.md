# Reschedule / Substitution Engine + Availability

Cross-cutting patch. I'll ship it in sequential phases so if something breaks we can isolate. All UI strings in English.

## Data stores (new)

**`src/lib/availability-store.ts`** — per-teacher weekly schedule + monthly change-request quota.
```ts
type Block = { startMin: number; endMin: number }; // minutes from 00:00, within 7*60..22*60
type Weekly = Record<"mon"|"tue"|"wed"|"thu"|"fri"|"sat", Block[]>;
type TeacherAvailability = {
  teacherId: string;
  weekly: Weekly;
  confirmedAt?: string;   // set on first confirm
};
type ChangeRequest = {
  id: string;
  teacherId: string;
  reason?: string;
  proposed: Weekly;
  status: "pending"|"approved"|"rejected";
  createdAt: string;
};
```
Exports: `getAvailability(teacherId)`, `saveAvailability(teacherId, weekly)`, `listChangeRequests(status?)`, `submitChangeRequest(teacherId, proposed, reason)`, `hasPendingRequest(teacherId)`, `approveChangeRequest(id)`, `rejectChangeRequest(id)`, `isTeacherAvailableAt(teacherId, dateISO, durationMin)` (also respects Spotlight blocks — reads from sessions store).

Persisted to localStorage, broadcast via CustomEvent (same pattern as sessions-store).

## A. Teacher Panel — Availability tab

**Nav**: add `{ to: "/teacher/availability", label: "Availability" }` in `src/routes/teacher.tsx`.

**`src/routes/teacher.availability.tsx`** — page "My Availability":
- Header + fixed TZ note: "All times shown in Mexico City time (GMT-6)."
- 6-day grid (Mon-Sat). Each day column has:
  - List of blocks; each block is a time-range row with two `<input type="time">` (min 07:00, max 22:00) + a delete `×`.
  - "Add Time Block" button appends a default block.
- Legend paragraph (exact string).
- Fixed note "Your schedule cannot be changed without prior Admin approval." + `Request Change` button. Disabled + shows "Request pending admin review." if `hasPendingRequest`.
- Bottom: primary Save/Confirm button → opens `ConfirmAvailabilityModal` (double-confirm popup with 3 bullets, buttons Cancel / Confirm Availability). On confirm → `saveAvailability`.
- Request Change flow: opens small modal (optional reason textarea) → `submitChangeRequest` with the current edited grid as `proposed`.

## B. Admin — Availability Change Requests

New sub-tab within `src/routes/admin.teachers.tsx` (tab bar at top: Teachers | Availability Change Requests). Lists pending requests: Teacher Name, current vs proposed (compact weekly view), reason, Approve / Reject buttons. Approve → `saveAvailability(teacherId, proposed)` + mark approved. Reject → mark rejected (frees quota).

## C. Qualified Teacher — reuse

Use existing `qualified_products` field from `teacher-model.ts`. No new field.

## D. Substitute engine

**`src/lib/substitute-engine.ts`** exports `findCandidates(sessionId): Array<{teacher: User; score: number}>`:
1. Filter USERS role=teacher, status active, qualified for session's product.
2. Exclude original teacher_id.
3. `isTeacherAvailableAt(teacherId, session.date_time, duration)` — day-of-week + time window match, and no other scheduled session (or Spotlight) overlaps.
4. Sort by `computeTeacherKpis(teacher).composite` desc.

**Admin Sessions tab**: on rows with `needs_substitute`, add `View Candidates` button → modal listing Teacher Name, Composite Score, `Assign` button. Assign → `updateSession(sessionId, { teacher_id, needs_substitute: false })`. Coverage-notes/lesson-plan access is already keyed by teacher_id on session, so this "just works". Auto-clear of coverage note on completion already exists in `submitSessionReport`.

## E. Group Reschedule (Admin proxy)

In `admin.groups.tsx` group detail view, add `Request Reschedule` action per scheduled session:
- Modal with:
  - Checkbox "All members have agreed to reschedule" (required)
  - Validation vs group's reschedule policy (window hours + quota %). Use existing group policy fields if present; if not, use sensible defaults from access plan tier.
  - Date/time picker filtered by teacher availability (`isTeacherAvailableAt`)
  - `Confirm Reschedule` → `updateSession(id, { date_time: newISO, status: "rescheduled" })`.

If a group teacher cancels and `findCandidates` returns empty → Admin banner offers to reschedule within same teacher's availability (same modal, pre-filtered).

## F. Individual Reschedule (Admin proxy)

Same `RescheduleModal` reused in `admin.students.tsx` per-student card and `admin.sessions.tsx` row action for individual sessions.

## G. Spotlight blocking

`isTeacherAvailableAt` also checks existing sessions of any kind (including Spotlight) for that teacher and rejects overlaps. No changes needed to Spotlight creation itself — the check is at query time.

## H. Performance card note

In `src/routes/teacher.financial.tsx`, add exact string to Performance card footer: "Teachers with strong, consistent performance get priority for new sessions and schedule requests — one more reason to keep your KPIs healthy."

## I. Language

All new strings in English, using the exact vocabulary from the spec.

## Files

New:
- `src/lib/availability-store.ts`
- `src/lib/substitute-engine.ts`
- `src/routes/teacher.availability.tsx`
- `src/components/verbo/ConfirmAvailabilityModal.tsx`
- `src/components/verbo/RescheduleModal.tsx`
- `src/components/verbo/CandidatesModal.tsx`

Edited:
- `src/routes/teacher.tsx` (nav)
- `src/routes/teacher.financial.tsx` (performance note)
- `src/routes/admin.teachers.tsx` (change-requests sub-tab)
- `src/routes/admin.sessions.tsx` (View Candidates, Request Reschedule)
- `src/routes/admin.students.tsx` (Request Reschedule on individual cards)
- `src/routes/admin.groups.tsx` (Request Reschedule per group session)
- `.lovable/plan.md`

## Out of scope

- Real timezone conversion (label only, all times treated as GMT-6).
- Student-facing self-service reschedule (future Student Panel).
- Automatic substitute assignment (Admin always clicks Assign).
- Persisted change-request quota reset cron (derived from `createdAt` at read time).