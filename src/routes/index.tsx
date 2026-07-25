import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/verbo/Logo";
import { Preloader } from "@/components/verbo/Preloader";
import { PhotoPlaceholder } from "@/components/verbo/ui";
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
        <header className="relative z-20 bg-secondary">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Logo />
            <Link
              to="/login"
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97]"
            >
              Sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <main>
          {/* HERO — vibrant, brand-aligned */}
          <section className="relative overflow-hidden bg-secondary">
            <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <div className="grid items-center gap-12 lg:grid-cols-2">
                {/* Left: photo composition */}
                <div
                  className="verbo-fade-up relative mx-auto h-[520px] w-full max-w-[480px]"
                  style={{ animationDelay: "0ms" }}
                >
                  {/* Decorative navy circle */}
                  <div
                    className="absolute -left-6 top-8 h-32 w-32 rounded-full bg-[var(--navy-100)]"
                    aria-hidden
                  />
                  {/* Orange shape */}
                  <div
                    className="absolute bottom-0 right-4 h-[380px] w-[300px] rounded-[2rem] bg-[var(--orange-500)]"
                    aria-hidden
                  />
                  {/* Photo placeholder */}
                  <PhotoPlaceholder
                    tone="light"
                    className="absolute left-8 top-6 aspect-[3/4] w-[300px] rotate-[-3deg] shadow-xl"
                  />
                </div>

                {/* Right: text */}
                <div>
                  <div
                    className="verbo-fade-up inline-flex items-center gap-2 rounded-full bg-[var(--orange-100)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orange-700)]"
                    style={{ animationDelay: "80ms" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--orange-500)]" />
                    Verbo Academy
                  </div>

                  <h1
                    className="verbo-fade-up mt-5 text-5xl font-black tracking-tight text-[var(--navy-700)] md:text-6xl"
                    style={{ animationDelay: "160ms", textWrap: "balance" }}
                  >
                    English fluency{" "}
                    <span className="text-[var(--orange-500)]">that sounds like you.</span>
                  </h1>

                  <p
                    className="verbo-fade-up mt-6 text-lg leading-relaxed text-[var(--navy-700)]/70"
                    style={{ animationDelay: "240ms" }}
                  >
                    No more grammar drills that never leave the page. Verbo turns English into
                    something you actually use — in real meetings, real negotiations, and real
                    conversations that move your career forward.
                  </p>

                  <div
                    className="verbo-fade-up mt-10 flex flex-wrap items-center gap-3"
                    style={{ animationDelay: "320ms" }}
                  >
                    <Link
                      to="/login"
                      className="group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-sm transition-opacity transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97]"
                    >
                      Access your account
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      to="/"
                      hash="how"
                      className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[var(--navy-700)]/15 bg-white px-6 py-3 text-sm font-medium text-[var(--navy-700)] transition-colors transition-transform duration-150 ease-out hover:bg-white/70 active:scale-[0.97]"
                    >
                      How it works
                    </Link>
                  </div>

                  <p
                    className="verbo-fade-up mt-6 text-xs text-[var(--navy-700)]/60"
                    style={{ animationDelay: "400ms" }}
                  >
                    Access is invitation-only. Credentials are issued by your organization's administrator.
                  </p>
                </div>
              </div>
            </div>
          </section>




          {/* Pillars — editorial list on solid navy */}
          <section
            id="how"
            className="relative overflow-hidden"
            style={{ backgroundColor: "var(--navy-900)" }}
          >
            <div className="relative mx-auto max-w-4xl px-6 py-24">
              <div className="mb-16 text-center">
                <div className="verbo-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/80">
                  The Student Experience
                </div>
                <h2
                  className="verbo-fade-up mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl"
                  style={{ animationDelay: "80ms" }}
                >
                  Engineered for Your Autonomy and Growth
                </h2>
              </div>

              <div className="flex flex-col gap-14 md:gap-16">
                <div
                  className="verbo-fade-up flex items-start gap-5"
                  style={{ animationDelay: "160ms" }}
                >
                  <CalendarClock className="mt-0.5 h-6 w-6 shrink-0 text-cyan-300" />
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-white">
                      Total Control, 24/7/365
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      You decide when and how fast you advance. Schedule your sessions, review your
                      personal materials, and manage your learning calendar anytime, anywhere, 365
                      days a year.
                    </p>
                  </div>
                </div>

                <div
                  className="verbo-fade-up flex items-start gap-5"
                  style={{ animationDelay: "240ms" }}
                >
                  <Trophy className="mt-0.5 h-6 w-6 shrink-0" style={{ color: "#f38934" }} />
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-white">
                      Gamified Growth & Prizes
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Earn custom badges, unlock achievements, and win premium rewards as you level
                      up your communication skills. Monitor your live performance metrics after
                      every single session.
                    </p>
                  </div>
                </div>

                <div
                  className="verbo-fade-up flex items-start gap-5"
                  style={{ animationDelay: "320ms" }}
                >
                  <Network className="mt-0.5 h-6 w-6 shrink-0 text-cyan-300" />
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-white">
                      Connect & Engage
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Access exclusive conversation clubs and connect with other ambitious
                      professionals in the network. Share insights, practice real-world scenarios,
                      and grow together.
                    </p>
                  </div>
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

