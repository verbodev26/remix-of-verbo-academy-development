import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { RoleGuard } from "@/components/verbo/RoleGuard";
import { TopNav } from "@/components/verbo/TopNav";

export const Route = createFileRoute("/admin")({ component: Layout });

type NavItem = { to: string; label: string; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

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

const tabCls =
  "inline-flex items-center gap-1 border-b-2 border-transparent px-3 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-foreground data-[status=active]:text-foreground";

function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((it) =>
    it.exact ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + "/"),
  );
}

function NavTab({ group }: { group: NavGroup }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape / route change.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => { setOpen(false); }, [pathname]);

  if (group.items.length === 1) {
    const it = group.items[0];
    return (
      <Link to={it.to} activeOptions={{ exact: !!it.exact }} className={tabCls}>
        {group.label}
      </Link>
    );
  }

  const active = isGroupActive(pathname, group);
  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-status={active ? "active" : undefined}
        aria-expanded={open}
        className={tabCls}
      >
        {group.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 min-w-[220px] rounded-xl border border-border bg-card p-1.5 shadow-elevated">
          {group.items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: !!it.exact }}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Layout() {
  return (
    <RoleGuard allow="admin">
      <div className="min-h-screen bg-background">
        <TopNav items={[{ to: "/admin", label: "Admin Panel" }]} />
        <div className="border-b border-border bg-background">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
            {NAV_GROUPS.map((g) => <NavTab key={g.label} group={g} />)}
          </nav>
        </div>
        <main className="mx-auto max-w-7xl px-6 py-10">
          <Outlet />
        </main>
      </div>
    </RoleGuard>
  );
}
