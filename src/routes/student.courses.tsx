import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LEVELS, type Level, type Unit } from "@/lib/mock-data";
import { Card, Pill, SectionTitle } from "@/components/verbo/ui";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Lock,
  Play,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/student/courses")({ component: Page });

type View =
  | { kind: "levels" }
  | { kind: "units"; level: Level }
  | { kind: "unit"; level: Level; unit: Unit };

// Static mock progress data to keep the UI feeling alive without a backend
const UNIT_PROGRESS: Record<string, number> = {
  "A1-U1": 100, "A1-U2": 100,
  "A2-U1": 100, "A2-U2": 60,
  "B1-U1": 100, "B1-U2": 45, "B1-U3": 0,
  "B2-U1": 0,
};

function Page() {
  const { user } = useAuth();
  const [view, setView] = useState<View>({ kind: "levels" });

  if (view.kind === "unit") {
    return <PreUnitView level={view.level} unit={view.unit} onBack={() => setView({ kind: "units", level: view.level })} />;
  }
  if (view.kind === "units") {
    return <UnitsView level={view.level} currentLevel={user?.current_level} onBack={() => setView({ kind: "levels" })} onOpen={(unit) => setView({ kind: "unit", level: view.level, unit })} />;
  }
  return <LevelsView currentLevel={user?.current_level} onOpen={(level) => setView({ kind: "units", level })} />;
}

/* ---------------- Levels ---------------- */

function LevelsView({ currentLevel, onOpen }: { currentLevel?: string; onOpen: (l: Level) => void }) {
  const currentIdx = useMemo(() => LEVELS.findIndex((l) => l.id === currentLevel), [currentLevel]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your learning path</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Choose a level to explore its units and start your activities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {LEVELS.map((lvl, idx) => {
          const isCurrent = lvl.id === currentLevel;
          const isLocked = currentIdx !== -1 && idx > currentIdx;
          const completion = lvl.units.reduce((s, u) => s + (UNIT_PROGRESS[u.id] ?? 0), 0) / lvl.units.length;
          return (
            <button
              key={lvl.id}
              onClick={() => !isLocked && onOpen(lvl)}
              disabled={isLocked}
              className={`group relative overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-soft transition-all ${
                isLocked
                  ? "border-border opacity-60 cursor-not-allowed"
                  : "border-border hover:border-accent/40 hover:shadow-elevated"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold tracking-tight ${
                    isCurrent ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"
                  }`}>
                    {lvl.id}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-foreground">{lvl.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{lvl.units.length} units</div>
                  </div>
                </div>
                {isLocked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : isCurrent ? (
                  <Pill tone="success">Current</Pill>
                ) : completion === 100 ? (
                  <Pill tone="success">Completed</Pill>
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-medium text-foreground">{Math.round(completion)}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Units ---------------- */

function UnitsView({ level, currentLevel, onBack, onOpen }: { level: Level; currentLevel?: string; onBack: () => void; onOpen: (u: Unit) => void }) {
  return (
    <div className="space-y-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All levels
      </button>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Level {level.id}</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{level.title}</h1>
        </div>
        {level.id === currentLevel && <Pill tone="success">Current level</Pill>}
      </div>

      <SectionTitle>Units</SectionTitle>
      <div className="space-y-3">
        {level.units.map((u, idx) => {
          const progress = UNIT_PROGRESS[u.id] ?? 0;
          const done = progress === 100;
          return (
            <button
              key={u.id}
              onClick={() => onOpen(u)}
              className="group flex w-full items-center gap-5 rounded-xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:border-accent/40 hover:shadow-elevated"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                done ? "bg-success/10 text-success" : "bg-secondary text-foreground"
              }`}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : String(idx + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{u.title}</div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Play className="h-3 w-3" /> Video</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> PDF guide</span>
                  <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Activities</span>
                </div>
              </div>
              <div className="hidden w-40 md:block">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Pre-unit ---------------- */

function PreUnitView({ level, unit, onBack }: { level: Level; unit: Unit; onBack: () => void }) {
  const progress = UNIT_PROGRESS[unit.id] ?? 0;

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {level.id} units
      </button>

      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {level.id} · Pre-unit
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{unit.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Watch the introduction video, review the PDF guide, then start the interactive activities. Take your time — the lesson is yours to revisit.
          </p>
        </div>
        <Pill tone={progress === 100 ? "success" : "muted"}>{progress === 100 ? "Completed" : `${progress}% complete`}</Pill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Video player */}
        <Card className="p-0 overflow-hidden">
          <div className="group relative aspect-video w-full bg-primary">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-black/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                aria-label="Play video"
                className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_10px_30px_-8px_rgba(243,137,52,0.55)] transition-all hover:bg-[#d9731f] hover:scale-105 active:scale-100"
              >
                <Play className="h-8 w-8 translate-x-0.5 fill-current" />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[18%] rounded-full bg-accent" />
              </div>
              <span className="text-xs font-medium text-white/80">02:14 / 12:30</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-semibold text-foreground">Introduction · {unit.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">HD · English subtitles available</div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">12 min</span>
          </div>
        </Card>

        {/* Right column — guide + CTA */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">PDF Guide</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Complete unit reference — 14 pages</div>
              </div>
            </div>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
            >
              <Download className="h-4 w-4" /> Download PDF Guide
            </button>
          </Card>

          <Card>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What's inside</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> 12-minute video lesson</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Vocabulary &amp; key phrases</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> 8 interactive exercises</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Speaking practice prompts</li>
            </ul>
          </Card>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-accent-foreground shadow-[0_8px_24px_-6px_rgba(243,137,52,0.5)] transition-all hover:bg-[#d9731f] hover:shadow-[0_10px_28px_-6px_rgba(243,137,52,0.6)] active:scale-[0.99]"
          >
            Start Activities <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[11px] text-muted-foreground">Estimated time: 20–25 minutes</p>
        </div>
      </div>
    </div>
  );
}
