import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/verbo/Logo";
import { Preloader } from "@/components/verbo/Preloader";
import { PhotoPlaceholder } from "@/components/verbo/ui";
import { ArrowRight, ArrowUpRight } from "lucide-react";

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
      <div className="font-marketing min-h-screen bg-background">
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
                    className="absolute bottom-0 right-4 h-[380px] w-[300px] rounded-[2rem] bg-[var(--orange-500)] shadow-elevated"
                    aria-hidden
                  />
                  {/* Photo placeholder */}
                  <PhotoPlaceholder
                    tone="light"
                    className="absolute left-8 top-6 aspect-[3/4] w-[300px] rotate-[-3deg] shadow-elevated"
                  />
                </div>

                {/* Right: text */}
                <div>
                  <div
                    className="verbo-fade-up inline-flex items-center gap-2 rounded-full bg-[var(--orange-100)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orange-700)]"
                    style={{ animationDelay: "80ms" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--orange-500)]" />
                    VERBO ACADEMY
                  </div>

                  <h1
                    className="verbo-fade-up mt-5 text-5xl font-semibold tracking-tight text-[var(--navy-700)] md:text-6xl"
                    style={{ animationDelay: "160ms", textWrap: "balance" }}
                  >
                    Growth has a language.
                    <span className="text-[var(--orange-500)]"> Speak it.</span>
                  </h1>

                  <p
                    className="verbo-fade-up mt-6 text-lg leading-relaxed text-[var(--navy-700)]/70"
                    style={{ animationDelay: "240ms" }}
                  >
                    Forget grammar drills that live and die on a worksheet. Here you rehearse the real
                    thing — the negotiation, the pitch, the toast you finally give in English without
                    translating it in your head first.
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
                    Private access only — your admin sends the invite.
                  </p>
                </div>
              </div>
            </div>
          </section>




          {/* Pillars — vibrant bento grid */}
          <section id="how" className="relative overflow-hidden bg-secondary">
            <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
              <div className="mb-16 text-center">
                <div
                  className="verbo-fade-up inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700"
                  style={{ animationDelay: "0ms" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  HOW IT WORKS
                </div>
                <h2
                  className="verbo-fade-up mt-5 text-3xl font-bold tracking-tight text-navy-700 md:text-4xl"
                  style={{ animationDelay: "80ms" }}
                >
                  Built around you, not the other way around.
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div
                  className="verbo-fade-up group flex h-full flex-col justify-between rounded-[2rem] bg-navy-700 p-8 text-white shadow-elevated transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[6px] hover:shadow-floating"
                  style={{ animationDelay: "160ms" }}
                >
                  <div>
                    <PhotoPlaceholder tone="dark" className="aspect-[4/3] w-full" />
                    <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      YOUR SCHEDULE
                    </div>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
                      Your Schedule, Not Ours
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      Class at 6 a.m. before the gym? Sunday night before a Monday presentation? You
                      call it. Book sessions, revisit your materials, and run your own calendar —
                      every day of the year.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-700 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div
                  className="verbo-fade-up group flex h-full flex-col justify-between rounded-[2rem] bg-lime-500 p-8 text-navy-900 shadow-elevated transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[6px] hover:shadow-floating"
                  style={{ animationDelay: "240ms" }}
                >
                  <div>
                    <PhotoPlaceholder tone="dark" className="aspect-[4/3] w-full" />
                    <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900/70">
                      YOUR PROGRESS
                    </div>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-navy-900">
                      Progress You Can Feel
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-navy-900/80">
                      Badges you actually want to show off. Real prizes, not participation trophies.
                      Watch your numbers move after every single class — because progress you can't
                      see doesn't feel like progress.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-900 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div
                  className="verbo-fade-up group flex h-full flex-col justify-between rounded-[2rem] bg-orchid-500 p-8 text-navy-900 shadow-elevated transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[6px] hover:shadow-floating"
                  style={{ animationDelay: "320ms" }}
                >
                  <div>
                    <PhotoPlaceholder tone="dark" className="aspect-[4/3] w-full" />
                    <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900/70">
                      YOUR PEOPLE
                    </div>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-navy-900">
                      A Room Full of People Like You
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-navy-900/80">
                      Join conversation clubs with people chasing the same fluency you are. Trade
                      stories, practice the scenarios that actually scare you, and stop practicing
                      English alone.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-900 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
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

