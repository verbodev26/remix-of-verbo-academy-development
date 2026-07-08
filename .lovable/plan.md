## Findings

### Point 1 — Admin > Performance Sessions Unit Modal (`src/routes/admin.courses.tsx`, `UnitModal` ~line 299)

**(a) Cápsula toggle:** already present as a two-button grid but with two rough edges:
- The right button is labeled **"Upload Video"**, not **"Upload File"** — inconsistent with the toggle names in VIP and Money Lab.
- The disabled tooltip + fallback text both say `"Available after the Supabase migration"`. Internal rule: never say "Supabase" in user-facing copy.

**(b) Pre/Post-Session Activities:** already separated. This modal only owns Title / Unit Number / Video / PDF. Activities are opened via a separate `ActivityModal` (`src/components/verbo/course-modals.tsx`) that has an explicit `Pre-Session / Post-Session` toggle and a listing grouped `PhaseGroup("Pre-Session")` + `PhaseGroup("Post-Session")`. No fusion.

**Fixes for Point 1:**
1. In `admin.courses.tsx` `UnitModal`: rename button label `"Upload Video"` → `"Upload File"`.
2. Same modal: replace the two "Supabase migration" strings with `"Available after the Cloud storage migration"` (matches VIP wording).

### Point 2 — Activity Logs miss report events

`src/lib/activity-logs-store.ts` currently derives from sessions, clubs, club-reports, strikes, availability, release-requests — but **not** from `student-reports-store` or `financial-issues-store`. So filing a report shows up in the bell but not in Admin > Activity Logs.

**Fixes for Point 2:**
1. In `activity-logs-store.ts`:
   - Add `ActivityKind` value `"report_filed"`.
   - Import `readStudentReportsRaw` pattern + `REPORTS_EVENT` from `student-reports-store`, and `loadFinancialIssues` + `FIN_ISSUES_EVENT` from `financial-issues-store`.
   - Add two derivation branches in `buildActivityLog()` that both push entries with `kind: "report_filed"`:
     - Student report → `action: "Student report filed"`, actor = teacher, personId = student, detail = `Teacher → Student — "text preview"`.
     - Financial issue → `action: "Financial issue reported"`, actor = teacher, detail = `Teacher — "text preview"`.
   - Extend `SOURCE_EVENTS` with `REPORTS_EVENT` and `FIN_ISSUES_EVENT` so the log recomputes when a report is filed.
   - Add `report_filed: "Report filed"` to `ACTIVITY_KIND_LABELS` so the Event type filter in `admin.activity-logs.tsx` picks it up automatically (that page reads the labels map to build the dropdown).
2. No changes needed in `admin.activity-logs.tsx` — its filter is auto-populated from `ACTIVITY_KIND_LABELS`.

Files touched: `src/routes/admin.courses.tsx`, `src/lib/activity-logs-store.ts`.
