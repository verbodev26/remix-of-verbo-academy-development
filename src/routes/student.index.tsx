import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { LEVELS, userById } from "@/lib/mock-data";
import { effectiveSessionCounts, groupOfStudent } from "@/lib/groups-store";
import { persistSessions, subscribeSessions, getSessionsSnapshot, getServerSessionsSnapshot, submitStudentRating, studentAttendance, type ExtSession } from "@/lib/sessions-store";
import {
  getPerformanceSnapshot,
  getServerPerformanceSnapshot,
  subscribePerformance,
  type PerformanceRating,
} from "@/lib/performance-store";
import { unitPassed, getUnitAccessOverride, isMilestoneUnit } from "@/lib/activities-store";
import { loadCourses, subscribeCourses, type ProductId, type CourseLevel } from "@/lib/product-courses-store";
import { unitsForStudent, vipUnitDoneMap, subscribeVipUnits, subscribeVipUnitCompletion } from "@/lib/vip-courses-store";
import { useComputedMacros } from "@/components/verbo/PerformanceAnalytics";
import { GhostButton, Pill, PrimaryButton, SectionTitle, StatRing, SuccessButton } from "@/components/verbo/ui";
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarClock,
  Download,
  ShieldAlert,
  Sparkles,
  Star,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  loadBadges as loadProfileBadges,
  subscribeBadges as subscribeProfileBadges,
  isBadgeEarned,
  buildProfileBadgeContext,
  type BadgeDef as ProfileBadgeDef,
} from "@/lib/profile-badges-store";
import {
  loadEquippedBadgeIds,
  subscribeEquippedBadges,
} from "@/lib/equipped-profile-badges-store";
import { RatingModal } from "@/components/verbo/RatingModal";
import { ReportConductModal } from "@/components/verbo/ReportConductModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/student/")({
  component: StudentDashboard,
});

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function PremiumCard({ children, className = "", hover = false, style }: { children: React.ReactNode; className?: string; hover?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={style} className={`rounded-2xl border border-border p-6 verbo-card ${hover ? "verbo-card-hover" : ""} ${className}`}>
      {children}
    </div>
  );
}

const ProgressRing = StatRing;

const SKILL_COLORS: Record<string, string> = {
  Speaking: "#f38934",
  Writing: "#7e22ce",
  Listening: "#01304a",
  Reading: "oklch(0.6 0.104 185)",
};

const PRODUCT_TO_COURSE: Record<string, ProductId> = {
  enterprise: "enterprise",
  go: "go",
  international: "international",
};

// Mirrors levelIsComplete() in student.courses.tsx: a level is complete when
// every unit is passed (respecting explicit access overrides and milestones).
function levelIsCompleteFor(level: CourseLevel, studentId: string): boolean {
  if (level.units.length === 0) return false;
  for (const u of level.units) {
    const ov = getUnitAccessOverride(studentId, u.id);
    if (ov === "locked") return false;
    if (isMilestoneUnit(u.id) && ov !== "unlocked" && !unitPassed(studentId, u.id)) return false;
    if (!unitPassed(studentId, u.id)) return false;
  }
  return true;
}

interface CurrentProgress {
  isVip: boolean;
  levelName: string;
  progressPct: number;
  currentUnitTitle: string | null;
  currentUnitId?: string;
  levelId?: string;
}

function computeCurrentProgress(
  studentId: string,
  product: string | undefined,
  contractedLevels: string[],
  // included so React re-runs this when stores emit updates
  _rev: number,
): CurrentProgress | null {
  void _rev;
  if (product === "vip") {
    const units = unitsForStudent(studentId);
    const done = vipUnitDoneMap();
    const total = units.length;
    const doneCount = units.filter((u) => done[u.id]).length;
    const currentUnit = units.find((u) => !done[u.id]) ?? units[units.length - 1];
    return {
      isVip: true,
      levelName: "VIP Course",
      progressPct: total === 0 ? 0 : Math.round((doneCount / total) * 100),
      currentUnitTitle: currentUnit?.title ?? null,
      currentUnitId: currentUnit?.id,
    };
  }
  const productId = product ? PRODUCT_TO_COURSE[product] : undefined;
  if (!productId) return null;
  const course = loadCourses().find((c) => c.product === productId);
  const levels = course?.levels ?? [];
  const contracted = new Set(contractedLevels);
  const currentLevel =
    levels.find((l) => contracted.has(l.name) && !levelIsCompleteFor(l, studentId)) ??
    levels.find((l) => contracted.has(l.name)) ??
    null;
  if (!currentLevel) return null;
  const total = currentLevel.units.length;
  const passed = currentLevel.units.filter((u) => unitPassed(studentId, u.id)).length;
  const currentUnit =
    currentLevel.units.find((u) => !unitPassed(studentId, u.id)) ??
    currentLevel.units[currentLevel.units.length - 1];
  return {
    isVip: false,
    levelName: currentLevel.name,
    progressPct: total === 0 ? 0 : Math.round((passed / total) * 100),
    currentUnitTitle: currentUnit?.title ?? null,
    currentUnitId: currentUnit?.id,
    levelId: currentLevel.id,
  };
}

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const sessions = useSyncExternalStore(
    subscribeSessions,
    getSessionsSnapshot,
    getServerSessionsSnapshot,
  );
  const performance = useSyncExternalStore(
    subscribePerformance,
    getPerformanceSnapshot,
    getServerPerformanceSnapshot,
  );
  // Real macro-skill scoring, scoped to this student (single source of
  // truth shared with Student > Performance and Teacher > Mis Alumnos).
  const macros = useComputedMacros(user?.id ?? "");
  const [perfDetail, setPerfDetail] = useState<{ session: ExtSession; rating: PerformanceRating } | null>(null);

  const [cancelCount, setCancelCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try { return Number(localStorage.getItem("verbo:cancel-count") ?? "1"); } catch { return 1; }
  });

  const [toCancel, setToCancel] = useState<ExtSession | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const [coursesRev, setCoursesRev] = useState(0);
  useEffect(() => subscribeCourses(() => setCoursesRev((r) => r + 1)), []);
  useEffect(() => subscribeVipUnits(() => setCoursesRev((r) => r + 1)), []);
  useEffect(() => subscribeVipUnitCompletion(() => setCoursesRev((r) => r + 1)), []);

  if (!user) return null;

  const mySessions = sessions.filter((s) => s.student_id === user.id);
  const upcoming = mySessions
    .filter((s) => s.status === "scheduled" || s.status === "rescheduled" || s.status === "ready")
    .sort((a, b) => +new Date(a.date_time) - +new Date(b.date_time));
  const history = mySessions
    .filter((s) => !["scheduled", "rescheduled", "ready"].includes(s.status))
    .sort((a, b) => +new Date(b.date_time) - +new Date(a.date_time));

  // Level Progress + Current Course — mirror Learning Path (/student/courses)
  // for GO/Enterprise/International and My Course (/student/my-course) for VIP.
  // The legacy LEVELS catalog / user.current_level are no longer used here.
  const progress = computeCurrentProgress(user.id, user.product, user.contracted_levels ?? [], coursesRev);
  const levelProgress = progress?.progressPct ?? 0;
  const currentUnitTitle = progress?.currentUnitTitle ?? null;
  const currentLevelName = progress?.levelName ?? null;

  // Legacy tile ("Current Level") still uses the LEVELS catalog by design —
  // the request scoped this migration to Level Progress and Current Course.
  const level = LEVELS.find((l) => l.id === user.current_level);


  // Overall Attendance — shared helper (studentAttendance) so Admin, Teacher
  // and Student always show the exact same % for a given student.
  const { pct: attendancePct } = studentAttendance(mySessions, user);

  // Quick Review Dock — real teacher notes (report_comments) from completed
  // sessions. No synthetic tips. Empty state kept when no session has one.
  const recentFeedback = useMemo(() => {
    return history
      .filter((s) => typeof s.report_comments === "string" && s.report_comments.trim().length > 0)
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        teacher: userById(s.teacher_id)?.name ?? "Teacher",
        date: new Date(s.date_time).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        tip: (s.report_comments ?? "").trim(),
      }));
  }, [history]);


  // Rating popup logic (untouched)
  const [ratingSession, setRatingSession] = useState<ExtSession | null>(null);
  const [handled, setHandled] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("verbo:rated-sessions");
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  });
  const persistHandled = (next: Set<string>) => {
    setHandled(next);
    try { localStorage.setItem("verbo:rated-sessions", JSON.stringify([...next])); } catch { /* noop */ }
  };

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      for (const s of upcoming) {
        if (handled.has(s.id)) continue;
        const start = +new Date(s.date_time);
        const end = start + s.duration_minutes * 60_000;
        const triggerAt = end - 10 * 60_000;
        if (now >= triggerAt && now <= end) { setRatingSession(s); return; }
      }
      setRatingSession(null);
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [upcoming, handled]);

  const handleSubmit = (rating: number, note: string) => {
    if (!ratingSession) return;
    submitStudentRating(ratingSession.id, rating, note ? note : undefined);
    persistHandled(new Set(handled).add(ratingSession.id));
    setRatingSession(null);
  };

  const handleClose = () => {
    if (!ratingSession) return;
    persistHandled(new Set(handled).add(ratingSession.id));
    setRatingSession(null);
  };

  const confirmCancel = () => {
    if (!toCancel) return;
    const next = sessions.filter((s) => s.id !== toCancel.id);
    persistSessions(next);
    const nc = cancelCount + 1;
    setCancelCount(nc);
    try { localStorage.setItem("verbo:cancel-count", String(nc)); } catch { /* noop */ }
    setToCancel(null);
  };

  const ordinal = (n: number) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}th`;
    const s = ["th", "st", "nd", "rd"][n % 10] || "th";
    return `${n}${s}`;
  };

  // Status badge tone classes (polished).
  const statusBadge = (status: string) => {
    const base = "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide capitalize";
    switch (status) {
      case "completed":
        return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`;
      case "absent":
        return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200`;
      case "delayed":
        return `${base} bg-amber-50 text-amber-800 ring-1 ring-amber-200`;
      case "rescheduled":
      case "rearranged":
        return `${base} bg-sky-50 text-sky-700 ring-1 ring-sky-200`;
      default:
        return `${base} bg-slate-100 text-slate-700 ring-1 ring-slate-200`;
    }
  };

  return (
    <div className="space-y-10">
      <header className="verbo-fade-up motion-reduce:animate-none flex flex-wrap items-center justify-between gap-4" style={{ animationDelay: "0ms" }}>
        <div>
          <div className="text-sm text-muted-foreground">Welcome back</div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight" style={{ color: "#01304a" }}>
              {user.name.split(" ")[0]}
            </h1>
            <FeaturedProfileBadge user={user} />
            {user.access_plan === "Elite" && <Pill tone="elite">Elite</Pill>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.product_type === "performance" && (() => {
            const c = effectiveSessionCounts(user.id, { hired: user.hired_sessions, remaining: user.remaining_sessions });
            const grp = groupOfStudent(user.id);
            return (
              <div
                className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                title={grp ? "Shared with your group" : undefined}
              >
                {c.remaining} of {c.hired} sessions remaining
                {grp && <span className="ml-1 font-normal text-muted-foreground">· group</span>}
              </div>
            );
          })()}
          <GhostButton onClick={() => setReportOpen(true)}>
            <ShieldAlert className="h-4 w-4" /> Report
          </GhostButton>
        </div>
      </header>

      {/* KPI Metrics with circular SVG progress — Level Progress is the hero */}
      <section
        className="verbo-fade-up motion-reduce:animate-none grid gap-4 md:grid-cols-[1fr_1.6fr_1fr]"
        style={{ animationDelay: "60ms" }}
      >
        <PremiumCard hover className="verbo-card-hover">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Level</div>
              <div className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight" style={{ color: "#01304a" }}>
                {user.current_level ?? "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{level?.title}</div>
            </div>
            <StatRing value={levelProgress} label={user.current_level ?? "—"} />
          </div>
        </PremiumCard>
        <PremiumCard
          hover
          className="verbo-card-hover ring-1 ring-primary/10"
          style={{ background: "rgba(1, 48, 74, 0.045)" }}
        >
          <div className="flex items-center justify-between gap-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">Level Progress</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] text-6xl font-semibold leading-none tracking-tight" style={{ color: "#01304a" }}>{levelProgress}</span>
                <span className="font-[family-name:var(--font-display)] text-2xl font-medium" style={{ color: "#01304a" }}>%</span>
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">of {user.current_level}</div>
            </div>
            <StatRing value={levelProgress} size={104} stroke={9} />
          </div>
        </PremiumCard>
        <PremiumCard hover className="verbo-card-hover">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overall Attendance</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight" style={{ color: "#01304a" }}>{attendancePct}%</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">last 90 days</div>
            </div>
            <StatRing value={attendancePct} />
          </div>
        </PremiumCard>
      </section>

      {/* Linguistic Asset Performance — replaces Performance Metrics + Quote of the Week */}
      <section className="verbo-fade-up motion-reduce:animate-none" style={{ animationDelay: "120ms" }}>
        <PremiumCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold tracking-tight" style={{ color: "#01304a" }}>
              Linguistic Asset Performance
            </h3>
            <Link
              to="/student/performance"
              className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: "#f38934" }}
            >
              View Detailed Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {macros.map((m) => {
              const Icon = m.icon;
              const color = SKILL_COLORS[m.key] ?? "#01304a";
              const pct = m.overall === null ? 0 : m.overall;
              return (
                <div
                  key={m.key}
                  className="flex flex-col gap-2.5 rounded-xl border border-border/70 bg-white/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in oklab, ${color} 12%, transparent)`, color }}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.key}</div>
                      <div className="text-base font-semibold tabular-nums" style={{ color: "#01304a" }}>
                        {m.overall === null ? "--" : `${m.overall}%`}
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-[3px] w-full overflow-hidden rounded-full"
                    style={{ background: `color-mix(in oklab, ${color} 12%, transparent)` }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </PremiumCard>
      </section>

      {/* Two-column productivity layout */}
      <section className="grid gap-6 lg:grid-cols-[1.85fr_1fr]">
        {/* LEFT COLUMN ~65% */}
        <div className="verbo-fade-up motion-reduce:animate-none space-y-8" style={{ animationDelay: "180ms" }}>
          {/* Current Course */}
          <div>
            <SectionTitle>Current Course</SectionTitle>
            <PremiumCard hover className="verbo-card-hover flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <Pill tone="muted">{currentLevelName ?? "Learning Path"}</Pill>
                <h3 className="mt-3 text-xl font-semibold tracking-tight" style={{ color: "#01304a" }}>
                  {currentUnitTitle ?? "No unit available yet"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick up exactly where you left off. Video, materials and practice activities included.
                </p>
              </div>
              <PrimaryButton
                className="verbo-btn-glow"
                disabled={!progress || (!progress.isVip && !progress.currentUnitId)}
                onClick={() => {
                  if (!progress) return;
                  if (progress.isVip) {
                    navigate({ to: "/student/my-course" });
                  } else if (progress.levelId && progress.currentUnitId) {
                    navigate({
                      to: "/student/courses",
                      search: { levelId: progress.levelId, unitId: progress.currentUnitId },
                    });
                  }
                }}
              >
                Continue unit
              </PrimaryButton>
            </PremiumCard>
          </div>



          {/* Upcoming Sessions */}
          <div className="verbo-fade-up motion-reduce:animate-none" style={{ animationDelay: "200ms" }}>
            <SectionTitle>Upcoming Sessions</SectionTitle>
            {upcoming.length === 0 ? (
              <PremiumCard className="verbo-card-hover"><div className="text-sm text-muted-foreground">No upcoming sessions scheduled.</div></PremiumCard>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((s) => {
                  const teacher = userById(s.teacher_id);
                  return (
                    <PremiumCard key={s.id} hover className="verbo-card-hover flex flex-col gap-4 border-l-4">
                      <div
                        className="-m-6 mb-0 rounded-t-2xl p-4"
                        style={{ background: "linear-gradient(135deg, #01304a, #014a6e)" }}
                      >
                        <div className="flex items-center gap-3 text-white">
                          <CalendarClock className="h-5 w-5" />
                          <div>
                            <div className="text-sm font-semibold capitalize">{fmtDay(s.date_time)}</div>
                            <div className="text-xs opacity-80">{fmt(s.date_time)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 pt-2">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Teacher</div>
                        <div className="text-sm font-semibold" style={{ color: "#01304a" }}>{teacher?.name}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{fmtTime(s.date_time)} · {s.duration_minutes} min</span>
                        <Pill tone="muted">{s.status}</Pill>
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        <GhostButton className="flex-1" onClick={() => setToCancel(s)}>
                          <X className="h-3.5 w-3.5" /> Can't attend
                        </GhostButton>
                        <SuccessButton className="flex-1 verbo-btn-glow bg-lime-500" onClick={() => window.open(s.teams_link, "_blank")}>
                          <Video className="h-4 w-4" /> Connect
                        </SuccessButton>
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR ~35% */}
        <aside className="space-y-6">
          {/* Verbo Experiences */}
          <PremiumCard hover className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{ background: "radial-gradient(circle at top right, #f38934, transparent 65%)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: "rgba(243, 137, 52, 0.12)", color: "#f38934" }}
                >
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold tracking-tight" style={{ color: "#01304a" }}>
                  Verbo Experiences
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Join today's live conversation clubs and immerse yourself with peers across the network.
              </p>
              <PrimaryButton
                className="verbo-btn-glow mt-4 w-full"
                onClick={() => navigate({ to: "/student/insights" })}
              >
                <Sparkles className="h-3.5 w-3.5" /> View Active Clubs
              </PrimaryButton>
            </div>
          </PremiumCard>

          {/* Quick Review Dock */}
          <PremiumCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight" style={{ color: "#01304a" }}>
                Quick Review Dock
              </h3>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Latest</span>
            </div>
            {recentFeedback.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Your teacher's notes and vocabulary tips will appear here after your first rated session.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentFeedback.map((f) => (
                  <li key={f.id} className="rounded-lg border border-border/70 bg-white/70 p-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>{f.teacher}</span>
                      <span>{f.date}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground">{f.tip}</p>
                  </li>
                ))}
              </ul>
            )}
          </PremiumCard>
        </aside>
      </section>

      {/* History */}
      <section className="verbo-fade-up motion-reduce:animate-none" style={{ animationDelay: "250ms" }}>
        <SectionTitle>Session History</SectionTitle>
        <PremiumCard className="verbo-card-hover !p-0 overflow-hidden">
          <TooltipProvider delayDuration={200}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Teacher</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Rating</th>
                  <th className="px-6 py-3 font-medium">My Performance</th>
                  <th className="px-6 py-3 font-medium text-right">Report</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => {
                  const teacher = userById(s.teacher_id);
                  const rating = performance[s.id];
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-6 py-4 text-foreground">{fmt(s.date_time)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{teacher?.name}</td>
                      <td className="px-6 py-4">
                        <span className={statusBadge(s.status)}>{s.status}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{s.student_rating ? `${s.student_rating}★` : "—"}</td>
                      <td className="px-6 py-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              disabled={!rating}
                              onClick={() => rating && setPerfDetail({ session: s, rating })}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border transition-all duration-150 ease-out hover:bg-secondary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
                              style={{ color: rating ? "#f38934" : undefined }}
                              aria-label="View performance breakdown"
                            >
                              <BarChart3 className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>View performance breakdown</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              disabled={!s.report_pdf_url}
                              onClick={() => s.report_pdf_url && window.open(s.report_pdf_url, "_blank")}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-150 ease-out hover:bg-secondary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Download report"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Download report</TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TooltipProvider>
        </PremiumCard>
      </section>


      {ratingSession && (
        <RatingModal
          session={ratingSession as any}
          onSubmit={(rating, note) => handleSubmit(rating, note)}
          onClose={handleClose}
        />
      )}

      <ReportConductModal
        studentId={user.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      {/* Cancellation Modal */}
      <Dialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "#01304a" }}>Session Cancellation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground">
            We're sorry you can't be there 😢 Remember that consistency is key to mastering your
            professional and corporate English.
          </p>
          <div
            className="rounded-lg border p-3 text-xs leading-relaxed"
            style={{
              backgroundColor: "rgba(243, 137, 52, 0.08)",
              borderColor: "rgba(243, 137, 52, 0.35)",
              color: "#01304a",
            }}
          >
            <strong>WARNING!:</strong> Your membership allows you to cancel or reschedule up to
            15% of your booked sessions without penalty. This action will affect your attendance
            metrics and will be recorded as your {ordinal(cancelCount + 1)} canceled session.
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <GhostButton onClick={confirmCancel}>Confirm Cancellation</GhostButton>
            <PrimaryButton className="verbo-btn-glow" onClick={() => setToCancel(null)}>Return</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Performance Breakdown Modal */}
      <Dialog open={!!perfDetail} onOpenChange={(o) => !o && setPerfDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "#01304a" }}>Session Performance Breakdown</DialogTitle>
          </DialogHeader>
          {perfDetail && (
            <>
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                <div className="font-medium text-foreground">{fmt(perfDetail.session.date_time)}</div>
                <div className="mt-0.5 text-muted-foreground">
                  with {userById(perfDetail.session.teacher_id)?.name}
                </div>
              </div>
              <div className="mt-2 space-y-3">
                <PerfStars label="Fluency" value={perfDetail.rating.fluency} />
                <PerfStars label="Vocabulary Range" value={perfDetail.rating.vocabulary} />
                <PerfStars label="Confidence" value={perfDetail.rating.confidence} />
                <PerfStars label="Grammar Accuracy" value={perfDetail.rating.grammar} />
              </div>
            </>
          )}
          <DialogFooter>
            <PrimaryButton className="verbo-btn-glow" onClick={() => setPerfDetail(null)}>Close</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PerfStars({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium" style={{ color: "#01304a" }}>{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= value;
          return (
            <Star
              key={n}
              className="h-4 w-4"
              style={{
                color: active ? "#f38934" : "#e5e7eb",
                fill: active ? "#f38934" : "transparent",
              }}
            />
          );
        })}
        <span className="ml-2 text-xs tabular-nums text-muted-foreground">{value}/5</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * FeaturedProfileBadge — replaces the old fixed "On Fire" flame in the
 * dashboard header. Renders the student's currently featured profile badge
 * (equipped-first, else highest-threshold earned) or nothing at all if the
 * student has not earned any badge yet.
 * ------------------------------------------------------------------------ */
function FeaturedProfileBadge({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const un1 = subscribeProfileBadges(bump);
    const un2 = subscribeEquippedBadges(bump);
    const un3 = subscribeCourses(bump);
    return () => { un1(); un2(); un3(); };
  }, []);

  // The subscriptions above bump `tick`, which invalidates the memo below.
  const featured = useMemo<ProfileBadgeDef | null>(() => {
    const badges = loadProfileBadges();
    const ctx = buildProfileBadgeContext(user);
    const earned = badges.filter((b) => isBadgeEarned(b, ctx));
    if (earned.length === 0) return null;
    const equipped = loadEquippedBadgeIds(user.id);
    for (const id of equipped) {
      const hit = earned.find((b) => b.id === id);
      if (hit) return hit;
    }
    return earned.slice().sort((a, b) => (b.rule.threshold ?? 1) - (a.rule.threshold ?? 1))[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tick]);

  if (!featured) return null;

  return (
    <div
      title={`Equipped: ${featured.name}`}
      className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full shadow-md"
      style={{ background: "linear-gradient(135deg, #01304a, #0a4a6e)" }}
    >
      {featured.image ? (
        <img src={featured.image} alt={featured.name} className="h-full w-full object-cover" />
      ) : (
        <Award className="h-5 w-5 text-white" />
      )}
    </div>
  );
}
