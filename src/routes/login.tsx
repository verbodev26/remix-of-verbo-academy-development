import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { USERS } from "@/lib/mock-data";
import { Logo } from "@/components/verbo/Logo";
import { PhotoPlaceholder } from "@/components/verbo/ui";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Verbo Language Solutions" }] }),
  component: LoginPage,
});

const EXECUTIVE_PHRASES = [
  "Fluency isn't about grammar rules. It's about walking into any room, in any language, and being fully yourself.",
  "We built Verbo because your career shouldn't wait for 'someday I'll be fluent.'",
  "The best negotiators aren't the ones with the biggest vocabulary. They're the ones who sound like themselves in any language.",
];

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDevSandbox, setShowDevSandbox] = useState(false);

  useEffect(() => {
    const devFlag =
      new URLSearchParams(window.location.search).get("dev") === "1" ||
      window.localStorage.getItem("verbo_dev") === "1";
    setShowDevSandbox(devFlag);
  }, []);

  const phrase = useMemo(
    () => EXECUTIVE_PHRASES[Math.floor(Math.random() * EXECUTIVE_PHRASES.length)],
    [],
  );

  useEffect(() => {
    if (user) {
      if (user.must_change_password) {
        navigate({ to: "/change-password" });
        return;
      }
      const dest = user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/student";
      navigate({ to: dest });
    }
  }, [user, navigate]);


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setTimeout(() => {
      const res = login(email.trim(), password);
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      const match = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (match?.must_change_password) {
        navigate({ to: "/change-password" });
        return;
      }
      const dest = res.role === "admin" ? "/admin" : res.role === "teacher" ? "/teacher" : "/student";
      navigate({ to: dest });
    }, 900);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col overflow-hidden">
        <div className="relative z-10 flex h-full flex-col bg-white px-6 py-8">
          {/* Decorative orange blob */}
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent/10"
            aria-hidden
          />
        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-2 text-sm text-[#01304a]/60 transition-colors hover:text-[#01304a]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>

        <div className="relative z-10 m-auto w-full max-w-sm">
          <Logo className="mb-10 [&_span]:text-[#01304a] [&_span.text-muted-foreground]:text-[#01304a]/70" />
          <h1 className="text-3xl font-semibold tracking-tight text-[#01304a]">Sign in</h1>
          <p className="mt-1.5 text-sm text-[#01304a]/70">Enter the credentials provided by your administrator.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#01304a]">Email</label>
              <input
                type="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="verbo-login-input mt-1.5 w-full rounded-lg border border-[#01304a]/15 bg-white px-3 py-2.5 text-sm text-[#01304a] placeholder:text-[#01304a]/40 focus:outline-none"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#01304a]">Password</label>
              <input
                type="password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="verbo-login-input mt-1.5 w-full rounded-lg border border-[#01304a]/15 bg-white px-3 py-2.5 text-sm text-[#01304a] placeholder:text-[#01304a]/40 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="verbo-cta-shimmer verbo-btn-glow flex w-full items-center justify-center gap-2 rounded-lg bg-[#f38934] px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-80"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Authenticating...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {showDevSandbox && (
            <div className="verbo-glass-light mt-8 rounded-2xl p-4">
              <div className="inline-flex items-center rounded-md bg-[#01304a]/5 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-[#01304a]/70">
                DEVELOPER SANDBOX
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-[#01304a]/75">
                <li><span className="font-semibold text-[#01304a]">Student:</span> elena@student.com / student123</li>
                <li><span className="font-semibold text-[#01304a]">Teacher:</span> sarah@verbo.com / teacher123</li>
                <li><span className="font-semibold text-[#01304a]">Admin:</span> admin@verbo.com / admin123</li>
              </ul>
            </div>
          )}
        </div>

        <div className="relative z-10 text-center text-xs text-[#01304a]/50">
          Verbo Language Solutions · Private platform · No self-registration
        </div>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden bg-[#01304a] lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Static orange glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 70% 60%, rgba(243,137,52,0.18), transparent 50%)" }}
        />
        {/* Decorative orange block */}
        <div
          className="pointer-events-none absolute -bottom-12 -right-12 h-80 w-64 rounded-[2rem] bg-accent/30"
          aria-hidden
        />


        <div className="relative z-10">
          <Logo className="[&_span]:text-white [&_span.text-muted-foreground]:text-white/60" />
        </div>
        <div className="relative z-10">
          <div className="verbo-fade-up text-xs font-medium uppercase tracking-[0.25em] text-white/60" style={{ animationDelay: "120ms" }}>
            A note from our team
          </div>
          <p
            className="verbo-fade-up mt-4 max-w-md text-2xl font-medium leading-snug tracking-tight text-white antialiased"
            style={{ animationDelay: "320ms", WebkitFontSmoothing: "antialiased" }}
          >
            "{phrase}"
          </p>
          <div className="verbo-fade-up mt-6 flex items-center gap-3" style={{ animationDelay: "520ms" }}>
            <PhotoPlaceholder tone="dark" shape="circle" className="h-12 w-12" />
            <span className="text-sm text-white/70">— The Verbo team</span>
          </div>
        </div>
      </div>
    </div>
  );
}
