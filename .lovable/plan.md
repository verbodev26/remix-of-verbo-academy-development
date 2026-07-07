
# Group Admin nav tabs under dropdown menus

Consolidates 11 flat tabs into 6 top-level items, each single-item entry stays a plain link and each multi-item entry becomes a hover/click dropdown. Rename "Overview" → "Dashboard". Add a new placeholder "The Money Lab" page under Financial.

## Final nav structure

```text
Dashboard                → /admin
Students   ▾             → Students, Groups, Sessions
Teachers   ▾             → Teachers, KPIs
Content    ▾             → Performance Sessions, Focus Workshops, Challenges, Material Complementario
Clubs                    → /admin/clubs   (single item → plain link, label "Clubs")
Financial  ▾             → The Money Lab
```

Active state for a parent tab lights up when any of its child routes is active (matches by prefix), so opening `/admin/sessions` highlights "Students".

## Files changed

### 1. `src/routes/admin.tsx` — replace flat `TABS` with a grouped `NAV_GROUPS` model

```ts
type NavItem = { to: string; label: string; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] }; // single item = plain link
```

Build a small `<NavTab>` component:
- If `items.length === 1` → render a `<Link>` exactly like today (single tap, no dropdown).
- Otherwise → render a button that toggles a dropdown panel. Dropdown:
  - Opens on hover AND on click (click also toggles, so it works on touch).
  - Closes on outside click, `Escape`, and on navigation.
  - Uses `<Link>` for each child so preloading and active-state still work.
  - The parent button gets `data-status="active"` styling when the current pathname starts with any child `to`.

Groups:
```ts
const NAV_GROUPS: NavGroup[] = [
  { label: "Dashboard", items: [{ to: "/admin", label: "Dashboard", exact: true }] },
  { label: "Students", items: [
    { to: "/admin/students", label: "Students" },
    { to: "/admin/groups",   label: "Groups" },
    { to: "/admin/sessions", label: "Sessions" },
  ]},
  { label: "Teachers", items: [
    { to: "/admin/teachers", label: "Teachers" },
    { to: "/admin/kpis",     label: "KPIs" },
  ]},
  { label: "Content", items: [
    { to: "/admin/courses",    label: "Performance Sessions" },
    { to: "/admin/workshops",  label: "Focus Workshops" },
    { to: "/admin/challenges", label: "Challenges" },
    { to: "/admin/materials",  label: "Material Complementario" },
  ]},
  { label: "Clubs", items: [{ to: "/admin/clubs", label: "Clubs" }] },
  { label: "Financial", items: [
    { to: "/admin/financial/money-lab", label: "The Money Lab" },
  ]},
];
```

Visual: same underlined-tab styling as today. Dropdown panel is an absolutely-positioned card (`rounded-xl border bg-card shadow-elevated`) with vertical link stack, matching the existing muted-foreground/foreground hover treatment. `overflow-x-auto` on the nav row stays for narrow viewports.

### 2. New placeholder route — `src/routes/admin.financial.money-lab.tsx`

Route id: `/admin/financial/money-lab`. Minimal page shell reusing `SectionTitle` / `Card` from `@/components/verbo/ui`:

- H1: "The Money Lab"
- Muted subtitle: "Financial workspace — coming soon."
- Empty-state card with a wallet icon and a short "Placeholder — content pending" message.
- `head()` with a distinct title/description so it isn't the template default.

No new store, no data — pure placeholder.

### 3. Nothing else moves

All existing routes (`admin.index`, `admin.students`, `admin.groups`, `admin.sessions`, `admin.teachers`, `admin.kpis`, `admin.courses`, `admin.workshops`, `admin.challenges`, `admin.materials`, `admin.clubs`) stay at their current URLs — this is a nav-only regrouping so no deep links break.

## Language sweep
All new strings in English: `Dashboard`, `Students`, `Teachers`, `Content`, `Clubs`, `Financial`, `The Money Lab`, `Coming soon`, `Placeholder`.

## Files touched
- `src/routes/admin.tsx` — grouped nav model + dropdown component + rename.
- `src/routes/admin.financial.money-lab.tsx` — new placeholder page.
