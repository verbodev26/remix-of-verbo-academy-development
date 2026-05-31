import { useEffect, useState } from "react";
import logoSrc from "@/assets/verbo-logo.png";

const SESSION_KEY = "verbo_preloader_shown";

export function Preloader() {
  const [phase, setPhase] = useState<"icon" | "slogan" | "exit" | "done">("icon");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase("done");
      return;
    }
    setMounted(true);
    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setPhase("slogan"), 1600);
    const t2 = setTimeout(() => setPhase("exit"), 3000);
    const t3 = setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 3700);

    return () => {
      [t1, t2, t3].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-transform duration-700"
      style={{
        backgroundColor: phase === "slogan" || phase === "exit" ? "#01304a" : "#0a0f14",
        transition: "background-color 700ms ease, transform 700ms cubic-bezier(0.7,0,0.3,1)",
        transform: phase === "exit" ? "translateY(-100%)" : "translateY(0)",
        opacity: mounted ? 1 : 0,
      }}
    >
      {/* Icon */}
      <div
        className="relative"
        style={{
          transform:
            phase === "icon"
              ? "translateX(0) scale(1)"
              : "translateX(0) scale(0.6) translateY(-40px)",
          opacity: phase === "icon" ? 1 : 0,
          transition: "transform 900ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease",
          animation: phase === "icon" ? "verbo-pre-swoosh 1s cubic-bezier(0.16,1,0.3,1) both" : undefined,
        }}
      >
        <div className="relative overflow-hidden rounded-2xl">
          <img src={logoSrc} alt="Verbo" className="h-32 w-32 object-cover" />
          <div className="verbo-pre-flare pointer-events-none absolute inset-0" />
        </div>
      </div>

      {/* Slogan */}
      <div
        className="absolute inset-0 flex items-center justify-center px-6"
        style={{
          opacity: phase === "slogan" ? 1 : 0,
          transition: "opacity 700ms ease 150ms",
        }}
      >
        <h2
          className="text-center text-3xl font-semibold text-white md:text-5xl"
          style={{
            letterSpacing: phase === "slogan" ? "0.08em" : "0em",
            transition: "letter-spacing 1200ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          The Language of Global Growth.
        </h2>
      </div>
    </div>
  );
}
