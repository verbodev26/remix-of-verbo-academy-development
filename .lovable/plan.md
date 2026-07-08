## Goal

Let teachers close Book Clubs / Insights / Spotlight Sessions with a lightweight "Club Report", surface those pending closures in the Dashboard, and make the remaining three summary cards clickable (one navigates to a new "Rating Trend" modal). Reuses existing stores, existing Session Report send pipeline, existing calendar chips, and the existing urgency-glyph pattern — no parallel infra.

---

## Part A — "Club Report" modal

Applies to Book Clubs, Insights, and Spotlight Sessions (student-linked). Standalone Spotlights (non-users) stay out of scope.

**New store: `src/lib/club-reports-store.ts`** (mirrors `lesson-plans-store` shape)

```ts
type Attendance = "present" | "absent";
interface ClubReport {
  event_id: string;               // club id (or spotlight id when that store lands)
  event_type: "insight" | "book" | "spotlight";
  teacher_id: string;
  attendance: Record<string, Attendance>;  // student_id → present/absent
  comments: string;
  submitted_at: string;           // ISO
}
```
- `loadClubReports() / saveClubReport() / subscribeClubReports()` — localStorage-backed, same pattern as other stores.
- On save, also call `updateClub(id, { status: "completed" })` so Calendar + Manage Clubs reflect completion immediately.

**New component: `src/components/verbo/ClubReportModal.tsx`**
- Header: event title + type badge (Book Club / Insight / Spotlight Session) + formatted date.
- Attendance section: pull the enrolled roster from the same `enrolled_names` field already computed in `src/lib/calendar-events.ts::enrolledNamesFor` (no new query). For Spotlight, single row. Toggle per student: Present / Absent.
- Comments: `textarea`, placeholder "Add any notes about this session (optional)."
- Footer: `Cancel` / `Submit Report`.
- On Submit: build the payload, call `saveClubReport()`, then call the **same send/PDF helper the Session Report already uses** (currently a stubbed sender since email is a Supabase migration follow-up — do not add a new stub). Toast: "Club Report submitted."

**Consistency rules (baked into the modal + store):**
- Marking Absent here is informational only — does NOT touch `strikes-store` and does NOT decrement any monthly quota (that already happens at booking time).
- No 1–5★ rating collected here; club events never contribute to Avg Rating.
- Rendered origin label in Recent Activity and any listing = "Book Club" / "Insight" / "Spotlight Session" — never empty.

**Entry points to the modal:**
1. `src/routes/teacher.calendar.tsx` — when a user clicks a club/insight/spotlight event whose `date + duration < now` and `status !== "completed"`, open `ClubReportModal` instead of the current `ClubQuickModal`. Otherwise keep current behavior.
2. Dashboard (see Part B).

---

## Part B — Dashboard reflection

**File: `src/routes/teacher.index.tsx`**

1. **"Complete your sessions"** — extend the list source. Currently it only pulls `mySessions` (performance sessions). Add a second stream: my clubs (`loadClubs().filter(teacher_id === user.id)`) + eventual spotlights, filtered to `date+duration < now` AND no matching `ClubReport`. Merge and sort by `date_time`. Each club row renders:
   - The same colored chip already used in Calendar for its kind (from `EVENT_KIND_META` in `src/lib/calendar-events.ts`) next to the event name.
   - Button label: **"Fill Report"** (distinct from the performance session's "Fill session report"), opens `ClubReportModal`.

2. **"Needs Your Attention"** — add one entry per pending Club Report using the existing `AttentionItem` shape:
   - Text: `Club Report overdue — {Event Name} ({Date})` when past the 24h window, otherwise `Club Report pending — {Event Name} ({Date})`.
   - Kind chip inline in the row (Insight / Book Club / Spotlight).
   - Icon uses the same countdown/urgency system already wired for Session Reports. **Note on thresholds:** the user's message specifies green ≥12h, yellow <12h & ≥2h, red <2h, red-glow-pulsing when overdue (with a static fallback under `prefers-reduced-motion`). The existing Session-Report thresholds are 15h / 8h. Applying the new 12h / 2h numbers to both keeps the two lists consistent; alternative is to keep the old thresholds for Session Reports and apply 12h / 2h only to Club Reports. **I'll unify on the new 12h / 2h numbers unless you say otherwise.**
   - Add a `@media (prefers-reduced-motion: reduce)` rule in `src/styles.css` disabling `animate-report-glow` and replacing it with a static red drop-shadow so overdue remains visible without motion.
   - CTA: "Open Report" (overdue) / "Fill Report" — opens `ClubReportModal` for that event.

3. **"Plan your upcoming Sessions"** — unchanged (clubs never have a Lesson Plan).

Recent Activity table already renders `origin` — extend the mapping so `insight` / `book` / `spotlight` events surface as "Insight" / "Book Club" / "Spotlight Session" instead of blank. Rating column stays `—` for club rows.

---

## Part C — Clickable summary cards

**File: `src/routes/teacher.index.tsx`** (metric-card block around lines 318–366)

1. **Assigned Students** → wrap the `MetricCard` in `<Link to="/teacher/students">` with the same `hover:shadow-floating` / `cursor-pointer` affordance already on the Performance card.
2. **Upcoming Sessions** → same pattern, `to="/teacher/calendar"`.
3. **Avg Rating** → click opens a new **Rating Trend modal**:
   - New component `src/components/verbo/RatingTrendModal.tsx`.
   - Data source: `sessions-store` filtered to `teacher_id === user.id`, `origin === "course" || "workshop"`, `typeof student_rating === "number"`, `date_time` within last 6 months (same window rule the Money Lab uses).
   - Bucketing: **monthly** buckets over the last 6 months (matches Money Lab's default; if the underlying series is <8 weeks, fall back to weekly for finer resolution).
   - Chart: line chart via the `recharts` version already imported by `PerformanceAnalytics.tsx` — no new dep. Y-axis fixed 1 → 5, tooltip shows `avg (n sessions)`.
   - Empty state: `Not enough data yet.` when zero rated sessions in the window.
   - Explicitly excludes club/spotlight events (per Part A rule).

---

## Out of scope

- Real email delivery for the Club Report PDF — piggybacks on the Session Report stub and lands with the Supabase migration.
- Spotlight standalone (non-users) — not surfaced anywhere in the platform.
- Any rework of the Session Report itself or of Manage Clubs.
- Sub-tab reorganization of the Teacher Panel (its own future prompt).
