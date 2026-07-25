// Student > Live Sessions.
//
// Reuses the same CalendarView + calendar-events adapter used by the Teacher
// Panel (see teacher.calendar.tsx). The student sees their own 1:1 sessions
// plus Insights / Book Clubs / Spotlights. Focus Workshops live on a separate
// route for workshop-only students.
//
// The 4-branch "Can't Attend" flow is driven by the student's Reschedule
// Policy (parseReschedulePolicy → notice hours + monthly cap %).
//   a) inside the notice window  → Late Cancellation Warning (Absent).
//   b) enough notice, quota used → Late Cancellation Warning with
//      "You've used all the reschedules allowed by your plan this cycle."
//   c) enough notice + quota OK  → Session Cancellation modal with two
//      actions: Reschedule (opens Reschedule Request flow) or
//      Cancel Without Rescheduling.
//   d) Groups: strict unanimity — a member's decision only affects THEIR
//      `member_statuses[studentId]` and always counts against their monthly
//      quota. The class keeps running for the remaining members. The session
//      only auto-cancels top-level when every roster member has cancelled or
//      requested a reschedule (handled inside `applyGroupMemberCancellation`).
//
// The Spotlight Session flow ("Request a Spotlight Session") is a separate
// modal chain: explainer (5s Understood delay) → slot picker + context text
// → publish as a Spotlight Request (or convert an overlapping regular session
// into "Converted to Spotlight" if the picked slot already has one).

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { USERS, userById } from "@/lib/mock-data";
import { adjustRemainingSessions } from "@/lib/students-store";
import {
  loadSessions, subscribeSessions, updateSession,
  SUB_STATUS_META, lastCoveredSummaryFor,
  type ExtSession, type ExtSessionStatus,
} from "@/lib/sessions-store";
import { CalendarView } from "@/components/verbo/CalendarView";
import {
  studentCalendarEvents, CALENDAR_STATUS_META, EVENT_KIND_META,
  type CalendarEvent, type CalendarEventKind,
} from "@/lib/calendar-events";
import { Card, PrimaryButton, GhostButton } from "@/components/verbo/ui";
import { X, Video, AlertTriangle, Sparkles, CalendarClock, RefreshCcw, ArrowLeft, Users as UsersIcon } from "lucide-react";
import {
  addStudentRequest,
  convertSessionToSpotlight,
  parseReschedulePolicy,
  reschedulesUsedThisMonth,
  rescheduleQuota,
  spotlightRequestsThisMonth,
} from "@/lib/student-requests-store";

import {
  CantAttendRouter, RescheduleRequestModal, SlotPickerGrid,
  todayYMD, hoursUntil,
} from "@/components/verbo/CancelSessionFlow";

import { ClubReservationModal } from "@/components/verbo/ClubReservationModal";
import type { Club } from "@/lib/clubs-store";
import { resolvedRemainingSeats, resolvedMonthlyCap } from "@/lib/club-bookings-store";
import { groupOfStudent, incrementGroupRemaining, effectiveSessionCounts, sessionProgressFor } from "@/lib/groups-store";
import { useCoreFreemiumGate } from "@/components/verbo/CoreFreemiumFlow";
import { isSilenced, hasCreditUsed as freemiumUsed, markCreditUsed as markFreemiumUsed } from "@/lib/core-freemium-store";
import { effectiveHourlyRate, appendTeacherAdjustment } from "@/lib/teacher-tiers";



export const Route = createFileRoute("/student/sessions")({
  validateSearch: (search: Record<string, unknown>) => ({
    focus: search.focus === "clubs" ? ("clubs" as const) : undefined,
  }),
  component: Page,
});

const ALL_STUDENT_KINDS: CalendarEventKind[] = ["class", "insight", "book_club", "spotlight"];
const CLUB_KINDS: CalendarEventKind[] = ["insight", "book_club"];



function fmtDT(iso: string) {
  return new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Page() {
  const { user } = useAuth();
  const { focus: focusParam } = Route.useSearch();

  const [, tick] = useState(0);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [cantAttendFor, setCantAttendFor] = useState<ExtSession | null>(null);
  const [cancelSpotlightFor, setCancelSpotlightFor] = useState<ExtSession | null>(null);
  const [rescheduleFor, setRescheduleFor] = useState<ExtSession | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [clubModal, setClubModal] = useState<Club | null>(null);

  useEffect(() => subscribeSessions(() => tick((n) => n + 1)), []);


  const events = useMemo<CalendarEvent[]>(() => {
    if (!user) return [];
    return studentCalendarEvents(user.id, {
      teacherNameOf: (id) => userById(id)?.name,
    });
  }, [user]);

  if (!user) return null;

  const policy = parseReschedulePolicy(user);
  const quota = rescheduleQuota(user);
  const used = reschedulesUsedThisMonth(user.id);
  const isSignature = user.access_plan === "Signature";
  const isCore = user.access_plan === "Core";
  const spotlightCapNum = resolvedMonthlyCap(user.id, "spotlight");
  const spotlightUsedNum = spotlightRequestsThisMonth(user.id);
  const spotlightRemaining = resolvedRemainingSeats(user.id, "spotlight");
  const spotlightCapDisplay = isSignature ? "∞" : String(spotlightCapNum);
  const spotlightVisible = isSignature || spotlightCapNum > 0;

  // Dynamic kinds — for Advance/Elite/Signature, only include a consumable
  // kind when the student has effective access to it. Core keeps all three
  // visible while their freemium credit is live, and each type gets removed
  // once the student silences it (Modal 3). "class" is always included.
  const insightSilenced = isCore && isSilenced(user.id, "insight");
  const bookSilenced = isCore && isSilenced(user.id, "book");
  const spotSilenced = isCore && isSilenced(user.id, "spotlight");
  const studentKinds: CalendarEventKind[] = ["class"];
  const hasInsight = isCore ? !insightSilenced : (isSignature || resolvedRemainingSeats(user.id, "insight") > 0 || resolvedMonthlyCap(user.id, "insight") > 0);
  const hasBook = isCore ? !bookSilenced : (isSignature || resolvedRemainingSeats(user.id, "book") > 0 || resolvedMonthlyCap(user.id, "book") > 0);
  const hasSpot = isCore ? !spotSilenced : (isSignature || spotlightCapNum > 0);
  const canRequestSpotlight = isCore ? !spotSilenced : (isSignature || spotlightRemaining > 0);
  if (hasInsight) studentKinds.push("insight");
  if (hasBook) studentKinds.push("book_club");
  if (hasSpot) studentKinds.push("spotlight");

  const freemium = useCoreFreemiumGate(user);

  const handleEventClick = (ev: CalendarEvent) => {
    if (ev.club && (ev.kind === "insight" || ev.kind === "book_club")) {
      const club = ev.club;
      const kind = ev.kind === "book_club" ? "book" : "insight";
      freemium.tryOpen(kind, () => setClubModal(club));
      return;
    }
    setSelected(ev);
  };



  const onCantAttend = (session: ExtSession) => {
    setSelected(null);
    setCantAttendFor(session);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sessions &amp; Events</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Your next class, your next conversation club, your next win — all in one place.
          </p>
        </div>
        <NextEventChip events={events} />
      </div>


      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SessionsRemainingCard studentId={user.id} />
        {hasSpot && (
          <div className="card-gradient-teal relative overflow-visible rounded-3xl border border-border p-6 shadow-elevated">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/35" style={{ color: "#01304a" }}>
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold tracking-tight" style={{ color: "#01304a" }}>
                Spotlight Session
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "rgba(1, 48, 74, 0.75)" }}>
              An extra 60-minute 1:1 with any available qualified teacher, focused on one specific challenge.
            </p>
            <button
              type="button"
              onClick={() => { if (canRequestSpotlight) freemium.tryOpen("spotlight", () => setSpotlightOpen(true)); }}
              disabled={!canRequestSpotlight}
              title={!canRequestSpotlight ? "You've used all your Spotlight requests for this month." : undefined}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-sm font-semibold transition-transform duration-200 ${canRequestSpotlight ? "cursor-pointer active:scale-[0.97]" : "cursor-not-allowed opacity-60"}`}
              style={{ color: "#01304a" }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Request a Spotlight Session
            </button>
          </div>
        )}
      </div>

      <Card>
        <CalendarView
          events={events}
          onEventClick={handleEventClick}
          availableKinds={studentKinds}
          initialEnabledKinds={focusParam === "clubs" ? CLUB_KINDS : undefined}
          pulseKinds={focusParam === "clubs" ? CLUB_KINDS : undefined}
        />

      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatPill
          icon={<CalendarClock className="h-4 w-4" />}
          label="Reschedule Policy"
          value={`${policy.noticeHours}h notice · up to ${policy.maxPct}% of monthly sessions`}
        />
        <StatPill
          icon={<RefreshCcw className="h-4 w-4" />}
          label="Used this cycle"
          value={`${used} of ${quota} reschedules`}
        />
        {spotlightVisible && (
          <StatPill
            icon={<Sparkles className="h-4 w-4" />}
            label="Spotlight"
            value={isSignature
              ? `${spotlightUsedNum} used this month`
              : `${spotlightUsedNum} of ${spotlightCapDisplay} used this month`}
          />
        )}
      </div>



      {selected && (
        <EventDetailsModal
          event={selected}
          onClose={() => setSelected(null)}
          onCantAttend={(s) => onCantAttend(s)}
          onCancelSpotlight={(s) => { setSelected(null); setCancelSpotlightFor(s); }}
        />
      )}

      {cantAttendFor && (
        <CantAttendRouter
          session={cantAttendFor}
          user={user}
          onClose={() => setCantAttendFor(null)}
          onReschedule={() => { const s = cantAttendFor; setCantAttendFor(null); setRescheduleFor(s); }}
        />
      )}

      {cancelSpotlightFor && (
        <CancelSpotlightModal
          session={cancelSpotlightFor}
          onClose={() => setCancelSpotlightFor(null)}
        />
      )}

      {rescheduleFor && (
        <RescheduleRequestModal
          session={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
        />
      )}

      {spotlightOpen && (
        <SpotlightRequestFlow
          studentId={user.id}
          onClose={() => setSpotlightOpen(false)}
        />
      )}

      {clubModal && (
        <ClubReservationModal
          club={clubModal}
          studentId={user.id}
          onClose={() => setClubModal(null)}
        />
      )}

      {freemium.node}

    </div>

  );
}

// ---------------------------------------------------------------------------
// Next upcoming event — derived from the already-loaded `events` list.
// Purely presentational: no store reads, no mutations.
// ---------------------------------------------------------------------------
function NextEventChip({ events }: { events: CalendarEvent[] }) {
  const next = useMemo(() => {
    const now = Date.now();
    const skip = new Set(["cancelled", "absent", "completed"]);
    return [...events]
      .filter((e) => +new Date(e.date) > now && !(e.status && skip.has(e.status)))
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0] ?? null;
  }, [events]);

  if (!next) return null;

  const kindMeta = EVENT_KIND_META[next.kind];
  const teacherName = next.session ? userById(next.session.teacher_id)?.name : undefined;
  const withWho = next.kind === "book_club"
    ? "Book Club"
    : next.kind === "insight"
      ? "Verbo Insight"
      : (teacherName ?? kindMeta.label);

  return (
    <div className="card-gradient-lime flex w-full items-center gap-4 rounded-3xl border border-border px-5 py-3 shadow-elevated lg:w-auto">
      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(1, 48, 74, 0.7)" }}>
        Next up
      </div>
      <div className="h-8 w-px" style={{ background: "rgba(1, 48, 74, 0.2)" }} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold" style={{ color: "#01304a" }}>
          {kindMeta.label} · {withWho}
        </div>
        <div className="truncate text-xs" style={{ color: "rgba(1, 48, 74, 0.75)" }}>
          {fmtDT(next.date)}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--navy-100)] bg-[var(--navy-50)] px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#01304a]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-xs font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}



// ---------------------------------------------------------------------------
// Session details modal — student view.
// Logistics only (no Lesson Plan surface here).
// ---------------------------------------------------------------------------
function EventDetailsModal({
  event, onClose, onCantAttend, onCancelSpotlight,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onCantAttend: (session: ExtSession) => void;
  onCancelSpotlight: (session: ExtSession) => void;
}) {
  const isClass = event.kind === "class";
  const isSpotlight = event.kind === "spotlight";
  const session = event.session;
  const teacherName = session ? userById(session.teacher_id)?.name : undefined;
  const status = event.status as ExtSessionStatus | undefined;
  const statusMeta = status ? CALENDAR_STATUS_META[status] : null;
  const kindMeta = EVENT_KIND_META[event.kind];
  const canAct =
    isClass && session &&
    (status === "scheduled" || status === "ready" || status === "rescheduled");
  const canConnectSpotlight =
    isSpotlight && session &&
    (status === "scheduled" || status === "ready" || status === "rescheduled");
  const connect = () => {
    if (session?.teams_link) window.open(session.teams_link, "_blank");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-floating">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white" style={{ background: kindMeta.color }}>
            {kindMeta.label}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          {isSpotlight && teacherName ? `Spotlight with ${teacherName}` : isClass && teacherName ? `Session with ${teacherName}` : event.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {fmtDT(event.date)} · {event.duration_minutes} min
        </p>

        {(isClass || isSpotlight) && session && (
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Teacher" value={teacherName ?? "—"} />
            <Row
              label="Status"
              value={
                session.attendance_sub_status
                  ? `${statusMeta?.label ?? ""} · ${SUB_STATUS_META[session.attendance_sub_status].label}`.trim().replace(/^·\s*/, "")
                  : (statusMeta?.label ?? "—")
              }
              accent={
                session.attendance_sub_status
                  ? SUB_STATUS_META[session.attendance_sub_status].color
                  : statusMeta?.color
              }
            />
            {session.teams_link && <Row label="Video Call" value="Ready" />}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {canAct ? (
            <>
              <PrimaryButton className="flex-1" onClick={connect}>
                <Video className="h-4 w-4" /> Connect
              </PrimaryButton>
              <GhostButton className="flex-1" onClick={() => session && onCantAttend(session)}>
                Can't Attend
              </GhostButton>
            </>
          ) : canConnectSpotlight ? (
            <>
              <PrimaryButton className="flex-1" onClick={connect}>
                <Video className="h-4 w-4" /> Connect
              </PrimaryButton>
              {status === "scheduled" && (
                <GhostButton className="flex-1" onClick={() => session && onCancelSpotlight(session)}>
                  Cancel Spotlight
                </GhostButton>
              )}
            </>
          ) : (
            <GhostButton className="w-full" onClick={onClose}>Close</GhostButton>
          )}
        </div>
      </div>
    </div>
  );
}
function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}



// ---------------------------------------------------------------------------
// Spotlight Request flow — explainer (5s Understood delay) → slot + context.
// Special case: if the picked slot exactly matches an existing regular 1:1
// with the student's own teacher, we convert instead of claiming.
// ---------------------------------------------------------------------------
function SpotlightRequestFlow({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [step, setStep] = useState<"explain" | "form">("explain");
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (step !== "explain") return;
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [step, secondsLeft]);

  if (step === "explain") {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-floating">
          <div className="flex items-center gap-2 text-[#0d9488]">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-base font-semibold text-foreground">What is a Spotlight Session?</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A Spotlight Session is an additional 1:1 session of up to 60 minutes with any available qualified teacher on the platform. Use it to work on a specific challenge — a presentation coming up, a mock interview, a difficult negotiation, a document review — outside your regular schedule.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You'll describe what you need in the next step so the teacher who claims it can arrive prepared.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              disabled={secondsLeft > 0}
              onClick={() => setStep("form")}
              className="cursor-pointer rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {secondsLeft > 0 ? `Understood (${secondsLeft})` : "Understood"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <SpotlightFormModal studentId={studentId} onClose={onClose} />;
}

function SpotlightFormModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [dateYMD, setDateYMD] = useState<string>(todayYMD());
  const [slotISO, setSlotISO] = useState<string>("");
  const [context, setContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOverlap, setConfirmOverlap] = useState<{ session: ExtSession; iso: string } | null>(null);

  // Spotlight duration is ALWAYS 60 minutes, regardless of the student's
  // regular session_duration.
  const SPOTLIGHT_DURATION = 60;
  const studentUser = userById(studentId);
  const product = studentUser?.product;
  const qualifiedIds = useMemo(
    () => USERS.filter((u) => u.role === "teacher" && u.teacher_status === "active"
      && (!product || (u.qualified_products ?? []).includes(product)))
      .map((t) => t.id),
    [product],
  );

  const submit = () => {
    if (resolvedRemainingSeats(studentId, "spotlight") <= 0) {
      setError("You've used all your Spotlight requests for this month.");
      return;
    }
    if (!slotISO) { setError("Pick one of the available start times."); return; }
    if (context.trim().length === 0) { setError("Please describe what you need for your Spotlight."); return; }
    // Overlap check with an existing regular 1:1 for this student at the
    // exact same start.
    const overlap = loadSessions().find((s) =>
      s.student_id === studentId &&
      !s.origin && // regular 1:1
      s.status !== "completed" && s.status !== "absent" && s.status !== "cancelled" &&
      +new Date(s.date_time) === +new Date(slotISO),
    );
    if (overlap) {
      setConfirmOverlap({ session: overlap, iso: slotISO });
      return;
    }
    publishSpotlightRequest(slotISO, context);
  };

  const publishSpotlightRequest = (iso: string, ctx: string) => {
    addStudentRequest({
      kind: "spotlight",
      student_id: studentId,
      assigned_teacher_id: undefined,
      proposed_datetime: iso,
      duration_minutes: SPOTLIGHT_DURATION,
      spotlight_context: ctx.trim(),
      last_report_summary: lastCoveredSummaryFor(loadSessions(), studentId),
    });
    // Core freemium: consume the one-shot courtesy credit on real submit.
    if (studentUser?.access_plan === "Core" && !freemiumUsed(studentId, "spotlight")) {
      markFreemiumUsed(studentId, "spotlight");
    }
    toast.success("Spotlight Request published. Teachers have been notified.");
    onClose();
  };



  if (confirmOverlap) {
    const teacherName = userById(confirmOverlap.session.teacher_id)?.name ?? "your teacher";
    const overlapIso = confirmOverlap.iso;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-floating">
          <h3 className="text-base font-semibold text-foreground">Overlaps with an existing class</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This overlaps with your already-scheduled class with <strong>{teacherName}</strong> at that time — would you like to replace it with this Spotlight instead?
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The original session will change to <strong>Converted to Spotlight</strong>. It won't count as a cancellation or a strike, and the credit is returned to your Hired / Remaining Sessions.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <GhostButton onClick={() => setConfirmOverlap(null)}>Return</GhostButton>
            <PrimaryButton onClick={() => {
              convertSessionToSpotlight({
                originalSessionId: confirmOverlap.session.id,
                spotlightContext: context.trim(),
              });
              // Refund the credit (as if never scheduled). Group students
              // share a single counter on the Group, individual students have
              // it on their own User record.
              const g = groupOfStudent(studentId);
              if (g) {
                incrementGroupRemaining(g.group.id);
              } else {
                adjustRemainingSessions(studentId, 1);
              }
              // Core freemium: consume the one-shot courtesy credit.
              if (studentUser?.access_plan === "Core" && !freemiumUsed(studentId, "spotlight")) {
                markFreemiumUsed(studentId, "spotlight");
              }
              toast.success("Session replaced with a Spotlight in the same slot.");
              onClose();
              void overlapIso;
            }}>

              Replace with Spotlight
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-floating">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-2 text-[#0d9488]">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-base font-semibold text-foreground">Request a Spotlight Session</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Pick one of the available start times. Spotlight sessions are always <strong>60 min</strong>, and require at least 24h notice.
        </p>
        <div className="mt-4">
          <label className="text-xs font-medium text-foreground">Date</label>
          <input
            type="date"
            value={dateYMD}
            min={todayYMD()}
            onChange={(e) => { setDateYMD(e.target.value); setSlotISO(""); setError(null); }}
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-foreground">Available start times</label>
          <SlotPickerGrid
            dateYMD={dateYMD}
            durationMin={SPOTLIGHT_DURATION}
            qualifiedTeacherIds={qualifiedIds}
            selectedISO={slotISO}
            onSelect={(iso) => { setSlotISO(iso); setError(null); }}
          />
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-foreground">What do you need this Spotlight for? <span className="text-destructive">*</span></label>
          <textarea
            value={context}
            onChange={(e) => { setContext(e.target.value); setError(null); }}
            rows={4}
            placeholder="e.g. Prepare for a Q&A with our US investors next week — focus on hedging language and confident pushback."
            className="mt-1.5 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Return</GhostButton>
          <PrimaryButton onClick={submit}>Publish Request</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// Ensures the UsersIcon import is referenced (linter placation for tree-shake).
void UsersIcon;

// ---------------------------------------------------------------------------
// Sessions Remaining — shared source of truth for the balance. Reads from
// `effectiveSessionCounts` so group members see the group's shared counter
// automatically, and hides itself for non-performance products.
// ---------------------------------------------------------------------------
function SessionsRemainingCard({ studentId }: { studentId: string }) {
  const u = USERS.find((x) => x.id === studentId);
  if (!u) return null;
  if (u.product_type !== "performance") return null;
  const { hired, remaining } = effectiveSessionCounts(studentId, {
    hired: u.hired_sessions,
    remaining: u.remaining_sessions,
  });
  const { done, pct } = sessionProgressFor(hired, remaining);
  const g = groupOfStudent(studentId);
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sessions remaining</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{remaining} <span className="text-sm font-normal text-muted-foreground">of {hired} sessions</span></div>
          {g && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">Shared with your group</div>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">{done} used</div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-secondary">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Cancel Spotlight — student-side cancellation with 24h-notice pay rule.
// The Spotlight credit is always forfeited (no reschedule, no refund).
// If cancelled inside 24h, the teacher is paid 1 hour at their effective rate.
// ---------------------------------------------------------------------------
function CancelSpotlightModal({ session, onClose }: { session: ExtSession; onClose: () => void }) {
  const teacherName = userById(session.teacher_id)?.name ?? "your teacher";
  const confirm = () => {
    const hours = hoursUntil(session.date_time);
    const late = hours < 24;
    const note = late
      ? "Cancelled by student with less than 24h notice — teacher paid."
      : "Cancelled by student with 24h+ notice — no payment.";
    updateSession(session.id, { status: "cancelled", cancellation_note: note });
    if (late) {
      const teacher = USERS.find((u) => u.id === session.teacher_id);
      if (teacher) {
        appendTeacherAdjustment(
          teacher.id,
          Math.round(effectiveHourlyRate(teacher)),
          "Spotlight Session — late cancellation (paid, <24h notice)",
        );
      }
    }
    toast.success("Spotlight Session cancelled.");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-floating">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Cancel Spotlight Session?</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This Spotlight with <strong>{teacherName}</strong> will be cancelled. It cannot be rescheduled or made up.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Go Back</GhostButton>
          <button
            onClick={confirm}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90"
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}
