import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { ProfileModal } from "./ProfileModal";
import { AdminProfileModal } from "./AdminProfileModal";
import { useAvatar } from "@/lib/avatar-store";

interface NavItem { to: string; label: string }

export function TopNav({ items, variant = "light" }: { items: NavItem[]; variant?: "light" | "dark" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";
  const canEditProfile = isStudent || isAdmin;
  const avatar = useAvatar(user?.id);
  const isDark = variant === "dark";


  return (
    <header
      className={`sticky top-0 z-40 ${isDark ? "" : "border-b border-border bg-background/85 backdrop-blur-xl"}`}
      style={isDark ? { backgroundColor: "#01304a", borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Logo dark={isDark} />
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to.endsWith("dashboard") }}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ease-out ${
                  isDark
                    ? "text-[#94a3b8] hover:text-white data-[status=active]:bg-white/10 data-[status=active]:text-white"
                    : "text-muted-foreground hover:text-foreground data-[status=active]:text-foreground data-[status=active]:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <div className={`text-sm font-medium ${isDark ? "text-white" : "text-foreground"}`}>{user?.name}</div>
            <div className={`text-xs capitalize ${isDark ? "text-[#94a3b8]" : "text-muted-foreground"}`}>{user?.role}</div>
          </div>
          <button
            type="button"
            onClick={() => canEditProfile && setProfileOpen(true)}
            disabled={!canEditProfile}
            className={`flex h-9 w-9 overflow-hidden items-center justify-center rounded-full text-sm font-bold text-white transition-all ${
              isDark
                ? "bg-[#f38934]"
                : "bg-secondary text-foreground"
            } ${canEditProfile ? "cursor-pointer hover:ring-2 hover:ring-[#f38934]/60 hover:shadow-md" : ""}`}
            aria-label="Open profile"
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0] ?? "?"
            )}
          </button>
          <button
            onClick={() => { logout(); navigate({ to: "/" }); }}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors ${
              isDark
                ? "text-[#94a3b8] hover:text-[#f38934]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      {isStudent && <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />}
      {isAdmin && <AdminProfileModal open={profileOpen} onOpenChange={setProfileOpen} />}
    </header>
  );
}
