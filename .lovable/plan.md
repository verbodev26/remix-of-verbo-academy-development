
# Group members in /admin/students + Overview enhancements

Small, purely presentational patch to `src/routes/admin.students.tsx`. No new stores, no data-model changes. Reuses `groups-store.ts` (already tracks memberships) and the existing add-on fields on the `User` model to describe Clubs access.

## 1. Stop filtering group members out of the list

Currently `filteredStudents` excludes anyone whose id appears in `groupsByStudentId()` (line 147: `!groupMap.has(s.id)`). Remove that exclusion so students belonging to a group show up as their own individual `StudentCard`, mixed in with individuals. Ordering, search, company filter and the "Individual / Groups" chips remain unchanged; the Groups tab (`/admin/groups`) is untouched.

## 2. Detect "grouped" students inside the card + modal

Add a helper `useGroupInfo(studentId)` that reads `groupOfStudent(studentId)` from `groups-store` and subscribes via `subscribeGroups` so changes propagate live. Returns `{ group, member } | null`.

Use it in both `StudentCard` (for a small badge — see §3) and `StudentDetailOverlay` (to gate footer buttons + inject Overview info).

## 3. StudentCard — mark grouped students visually

- Add a subtle tag `Group: {group.name}` next to the existing product/plan/level tags so admins can spot them without opening the card.
- No behavior change on the card itself; click still opens the same `StudentDetailOverlay`.

## 4. StudentDetailOverlay — tailored footer for grouped students

When `useGroupInfo` returns a group:

- **Remove "Mark as paid" button** (line 1245–1250). Payment lives on the Group card in `/admin/groups` for these students.
- **Rewire the "Suspend" button** (line 1225) to call `removeMember(student.id)` from `groups-store` and close the overlay. Label stays exactly `Suspend` per the request. If the member is already `pending_removal`/`archived`, show the button as disabled with the same styling (edge case; auth already blocks login).
- All other footer actions (Edit profile, Reset password, Reassign teacher, Freeze, Unlock Insights, Unlock Book Clubs) stay identical — rules, metrics and evaluations apply the same way as individual students.

For non-grouped students the footer is unchanged (Mark as paid + Suspend behave exactly as today).

## 5. Overview tab — new info fields

Add to the Overview grid (around line 1119–1130), only when applicable:

- **Group** — `group.name` (only if grouped). Rendered as an `<Info>` row.
- **Company** — `group.company_client` when grouped, otherwise fall back to `student.company` when present (so enterprise individuals also see it here). Rendered as an `<Info>` row.
- **Clubs access** — always shown. A new sub-section under the grid titled `Clubs access` that lists, as Tags:
  - `Insights · N/month` when `addon_insights_per_month > 0`
  - `Book Clubs · N/month` when `addon_bookclubs_per_month > 0`
  - `Spotlight · N/month` when `addon_spotlight_per_month > 0`
  - `Workshops` when `addon_workshops_enabled === true`
  - When none of the above are set, render `No clubs access` in muted text.

  This is the natural read of "how many and which clubs they can access" given the current data model — the add-on entitlements. No per-club attendance tracking is introduced.

## 6. Language sweep

All new strings in English, matching existing convention: `Group`, `Company`, `Clubs access`, `Insights`, `Book Clubs`, `Spotlight`, `Workshops`, `/month`, `No clubs access`.

## Files touched
- `src/routes/admin.students.tsx` — remove group-exclusion filter, add `useGroupInfo` hook, add Group tag on card, adjust Overview grid + add Clubs access section, gate footer buttons for grouped students (drop Mark as paid, rewire Suspend to `removeMember`).

Nothing else changes — `groups-store`, `admin.groups.tsx`, sessions, teacher panel, KPIs and Financial are all untouched.
