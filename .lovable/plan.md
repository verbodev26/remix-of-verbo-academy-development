## Goal

Eliminate the visible "Completed without report" state in the Teacher Dashboard's Recent Activity table. Per the new rule, a session can only reach `completed` status through the Session Report submit flow (which writes `report_submitted_at`), so this label is unreachable and misleading.

## Change

**File:** `src/routes/teacher.index.tsx` (lines ~527–542)

- Simplify the `label` mapping: when `s.status === "completed"`, always render `"Completed"` (drop the `report_submitted_at` ternary).
- Simplify the `tone` mapping: when `s.status === "completed"`, always use `"success"` (drop the warning branch tied to missing report).

No other files touched. The underlying data model (`report_submitted_at`, `submitSessionReport`) is unchanged — this only removes the dead display branch. The 24h window + proportional Report Punctuality KPI decay you described are a separate change; not in scope here (call it out if you'd like it built next).

## Out of scope (flag for a follow-up)

- Enforcing "Class Notes required to submit report" inside the Session Report modal.
- Implementing the Report Punctuality decay curve past the 24h window.
Say the word and I'll queue those as the next patch.