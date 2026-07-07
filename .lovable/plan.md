# Groups for Performance Sessions — Implementation Plan

Adds group registration/management on top of the existing Individual student model. Payment and progress live at group level; attendance, skills evaluation, ratings and Insights/Book Clubs/Spotlight counters stay individual per member. VIP is untouched. All UI text in English.

## 1. Data layer — new `src/lib/groups-store.ts`

Types:
```
Group {
  id, name, company_client, max_capacity,
  product_type, product, access_plan, initial_level,
  hired_sessions, remaining_sessions,
  sessions_per_week, duration_minutes, rescheduling_policy,
  payment_day, cycle_start, last_paid_at,
  video_call_link, teacher_id, addons: string[],
  created_at
}
GroupMember { student_id, group_id, status: "active"|"pending_removal"|"archived",
  removal_started_at?, archived_at?, joined_at }
```
Persisted to `localStorage` (`verbo:groups`, `verbo:group-members`) with cross-tab event `verbo:groups-updated`, mirroring `sessions-store` / `clubs-store` conventions.

Helpers: `loadGroups`, `loadGroupMembers`, `subscribeGroups`, `createGroup`, `updateGroup`, `addMember`, `removeMember` (→ pending_removal, frees capacity immediately), `restoreMember`, `archiveMember`, `moveMember(studentId, targetGroupId)`, `markGroupAsPaid`, `groupOfStudent`, `activeMembersOf`, `pendingCountdownDays`. A tiny effect ("tick on mount") auto-archives members whose 30d grace expired.

Each member is still a real `User` in `USERS` (via `students-store`) so existing per-student surfaces (Skills, Insights counters, Session Report PDF) keep working unchanged. Group-level fields are read from the group, not duplicated on the user.

## 2. Sessions — reuse, don't fork
Extend `ExtSession` with optional `group_id?: string` and `member_statuses?: Record<studentId, ExtSessionStatus>` and `member_absent_cause?`. When `group_id` is present the session represents the shared slot for the whole group.

`submitSessionReport` (in `sessions-store`) gains a group path: accepts `perMember: { studentId, attendance, absentCause?, subskills }[]` and shared fields (session_type, topic, comments). It writes per-member statuses, calls `saveSubskillEvaluation` per completed member (each gets its own performance record → own PDF), decrements `remaining_sessions` on the group exactly once, and clears coverage note per member.

Admin > Sessions creation flow: when the selected student is a group member, create one shared session with `group_id` set (same teacher/date/time/link) instead of N sessions. No new engine.

## 3. Admin > Students

`src/routes/admin.students.tsx`:
- **Register Student modal**: add "Registration Type" toggle (Individual / Group). Group form shows Group Name, Company / Client, Max Capacity (default 4), repeatable Group Members cards (min 2, "+ Add Member" respects capacity), then the standard shared block once. Submitting creates the Group + N Users + memberships.
- **List view**: chips "All" / "Individual" / "Groups". Groups render as one card (Group Name, Company/Client, product/plan/level badges, Hired/Remaining bar, payment glow + "Mark as Paid", "N/M members"). Individual cards unchanged. Click on a group card → Group Detail.
- **Group Detail view** (in-page panel or `/admin/students/group/$id`): editable shared fields + payment block on top; roster table below with each member's Insights/Book Clubs/Spotlight badges (X/3), status, and "Remove from Group" / "Move to Group" buttons; "+ Add Member" (respects capacity). Uses a custom `<Modal>` for confirms (no `window.confirm`).
- **Remove flow**: confirmation modal → status `pending_removal`, capacity freed now, "23 days left to restore" pill, "Restore" and "Archive Now" buttons. Restore checks capacity; if full, show "No spots left in this group" and surface Move to Group.
- **Move to Group** dropdown: only groups with same `company_client` AND active members < max_capacity. On move, adopts new group's teacher/link/plan/rescheduling/add-ons; keeps own history and counters.
- **Recycle Bin link** at top ("Recycle Bin (N)") → new sub-view listing all Archived members read-only (name, prior company/group, full attendance + skills history from existing performance-store/session reports); "Restore" here requires picking an existing group with capacity. Nothing is ever hard-deleted.

Auth: `pending_removal` and `archived` members are blocked from login in `src/lib/auth.tsx` (return an "Access revoked" message on sign-in attempt).

## 4. Admin > Sessions
When admin selects a student who is a group member, the created session record automatically carries `group_id` and applies to all active members of that group (single event). Existing per-session UI is unchanged; the row just shows "Group: [Name]" instead of a single student name.

## 5. Teacher Panel

- **Calendar** (`teacher.calendar.tsx` + `CalendarView`): keep existing "1:1" badge; add "G" badge (same style) for events where `session.group_id` is present. Tooltip/click title shows the Group Name.
- **My Students** (`teacher.students.tsx`): each group member still listed individually (KPIs unchanged) with a new chip "Group: [Group Name]". No payment info exposed.
- **Session Report modal** (extend existing PlanModal/SessionReport component): if `session.group_id`, show a per-member status row at top (Completed / Absent per person, absent cause per person). For each Completed member, a tab labeled with the member's real name renders the existing Skills/Sub-skills grid. Shared fields (Session Type, Topic, Teacher's comments, attachments) render once above the tabs. 1–5★ / Flagged Review is asked per Completed member. Submit calls the group-aware `submitSessionReport`.

## 6. Language
Every visible label in English, using the exact strings from the brief. Sweep after each file edit.

---

## Technical notes (implementation)

- New files: `src/lib/groups-store.ts`, `src/routes/admin.students.group.$id.tsx` (Group Detail), `src/routes/admin.students.recycle.tsx` (Recycle Bin), `src/components/verbo/GroupSessionReport.tsx` (per-member tabs wrapper reusing the existing Skills grid).
- Edited files: `src/routes/admin.students.tsx` (register modal + list + chips + Recycle Bin link), `src/lib/sessions-store.ts` (`group_id`, per-member statuses, group-aware `submitSessionReport`), `src/lib/calendar-events.ts` (pass group info through), `src/components/verbo/CalendarView.tsx` (G badge + group title), `src/routes/teacher.calendar.tsx`, `src/routes/teacher.students.tsx` (Group chip), `src/routes/teacher.index.tsx` (session report entrypoint routes to group modal when `group_id`), `src/lib/auth.tsx` (block non-active members).
- No changes to VIP, KPIs, Financial (per brief).
- Grace-period auto-archive: pure derived — computed on read via `pendingCountdownDays`; a mount effect flips status to `archived` when it hits ≤ 0, no cron needed (mock/localStorage app).
- All confirms use existing custom modal primitives; no browser `confirm()`.
- Per-member PDFs already fall out of the existing single-student report generator — we just call it once per Completed member with the shared comments merged in.

## Out of scope for this patch
Teacher KPI weighting for group sessions, per-size teacher pay adjustments, Financial changes — deferred to Phase 7 per brief.
