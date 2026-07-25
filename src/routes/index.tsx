import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/verbo/Logo";
import { Preloader } from "@/components/verbo/Preloader";
import { ArrowRight, CalendarClock, Trophy, Network } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verbo Language Solutions — The Language of Global Growth" },
      { name: "description", content: "Premium B2B English training for global teams. Private platform with live sessions, structured curriculum and measurable progress." },
      { property: "og:title", content: "Verbo Language Solutions" },
      { property: "og:description", content: "The Language of Global Growth." },
    ],
  }),
  component: Landing,
});


function Landing() {
  return (
    <>
      <Preloader />
      <div className="min-h-screen bg-background">
        {/* Nav */}
        <header className="relative z-20 border-b border-border bg-background">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Logo />
            <Link
              to="/login"
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#01304a] px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97]"
            >
              Sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <main>
          {/* HERO — warm, premium editorial */}
          <section className="relative overflow-hidden bg-background">
            {/* Asymmetric navy panel */}
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-[45%] rounded-l-3xl"
              style={{
                background:
                  "linear-gradient(180deg, var(--navy-800) 0%, var(--navy-700) 100%)",
              }}
              aria-hidden
            />

            <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-32">
              <div className="max-w-2xl">
                <h1
                  className="verbo-fade-up font-display text-5xl font-semibold tracking-tight text-[#01304a] md:text-6xl"
                  style={{ animationDelay: "0ms" }}
                >
                  English fluency that sounds like you.
                </h1>

                <p
                  className="verbo-fade-up mt-6 text-lg leading-relaxed text-[#01304a]/70"
                  style={{ animationDelay: "120ms" }}
                >
                  No more grammar drills that never leave the page. Verbo turns English into
                  something you actually use — in real meetings, real negotiations, and real
                  conversations that move your career forward.
                </p>

                <div
                  className="verbo-fade-up mt-10 flex flex-wrap items-center gap-3"
                  style={{ animationDelay: "240ms" }}
                >
                  <Link
                    to="/login"
                    className="group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-sm shadow-soft transition-opacity transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97]"
                  >
                    Access your account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/"
                    hash="how"
                    className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors transition-transform duration-150 ease-out hover:bg-secondary active:scale-[0.97]"
                  >
                    How it works
                  </Link>
                </div>

                <p
                  className="verbo-fade-up mt-6 text-xs text-[#01304a]/60"
                  style={{ animationDelay: "360ms" }}
                >
                  Access is invitation-only. Credentials are issued by your organization's administrator.
                </p>
              </div>
            </div>
          </section>


          {/* Pillars — dark glassmorphic */}
          <section
            id="how"
            className="relative overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(243,137,52,0.06), transparent 55%), radial-gradient(circle at 50% 100%, rgba(1,48,74,0.5), transparent 60%), linear-gradient(180deg, #01304a 0%, #0a0f14 30%, #0a0f14 100%)",
            }}
          >
            <div className="verbo-tech-grid absolute inset-0 opacity-50" />
            <div className="relative mx-auto max-w-7xl px-6 py-24">
              <div className="mx-auto mb-16 max-w-2xl text-center">
                <div className="verbo-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm shadow-[0_0_24px_rgba(243,137,52,0.15)]">
                  The Student Experience
                </div>
                <h2
                  className="verbo-fade-up mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl"
                  style={{ animationDelay: "120ms" }}
                >
                  Engineered for Your Autonomy and Growth
                </h2>
              </div>

              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-[12%] right-[12%] top-1/2 hidden -translate-y-1/2 md:block"
                  style={{
                    height: 1,
                    backgroundImage:
                      "linear-gradient(90deg, rgba(255,255,255,0.18) 50%, transparent 50%)",
                    backgroundSize: "10px 1px",
                  }}
                />
                <div className="relative grid gap-6 md:grid-cols-3">
                  <Pillar
                    icon={<CalendarClock className="h-5 w-5 text-cyan-300" />}
                    title="01. Total Control, 24/7/365"
                    delay="120ms"
                  >
                    You decide when and how fast you advance. Schedule your sessions, review your
                    personal materials, and manage your learning calendar anytime, anywhere, 365
                    days a year.
                  </Pillar>
                  <Pillar
                    icon={<Trophy className="h-5 w-5" style={{ color: "#f38934" }} />}
                    title="02. Gamified Growth & Prizes"
                    delay="240ms"
                  >
                    Earn custom badges, unlock achievements, and win premium rewards as you level
                    up your communication skills. Monitor your live performance metrics after
                    every single session.
                  </Pillar>
                  <Pillar
                    icon={<Network className="h-5 w-5 text-cyan-300" />}
                    title="03. Connect & Engage"
                    delay="360ms"
                  >
                    Access exclusive conversation clubs and connect with other ambitious
                    professionals in the network. Share insights, practice real-world scenarios,
                    and grow together.
                  </Pillar>
                </div>
              </div>
            </div>
          </section>


          {/* Footer */}
          <footer style={{ backgroundColor: "#0a0f14", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs md:flex-row">
              <Logo />
              <div className="flex flex-col items-center gap-1 md:flex-row md:gap-3" style={{ color: "#64748b" }}>
                <span>© 2026 Verbo Language Solutions. All rights reserved.</span>
                <Link
                  to="/privacy"
                  className="font-medium transition-colors duration-200 hover:text-[#f38934]"
                  style={{ color: "#94a3b8" }}
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}

function Pillar({
  icon,
  title,
  children,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <div
      className="verbo-glass-card verbo-fade-up group relative rounded-2xl p-8"
      style={{ animationDelay: delay }}
    >
      <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
        {icon}
      </div>
      <h3 className="relative mt-5 text-base font-semibold tracking-tight text-white">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
        {children}
      </p>
    </div>
  );
}
