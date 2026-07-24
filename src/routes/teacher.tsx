import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/verbo/RoleGuard";
import { TopNav, NavItem, NavGroup } from "@/components/verbo/TopNav";
import { AnnouncementBanner } from "@/components/verbo/AnnouncementBanner";
import { useAuth } from "@/lib/auth";
import { ASSIGNMENTS, USERS } from "@/lib/mock-data";

export const Route = createFileRoute("/teacher")({ component: Layout });

function Layout() {
  const { user } = useAuth();
  const assignedStudents = user
    ? USERS.filter((u) => u.role === "student" && ASSIGNMENTS.some((a) => a.teacher_id === user.id && a.student_id === u.id))
    : [];
  const hasVipStudent = assignedStudents.some((u) => u.product === "vip");
  const hasEliteStudent = assignedStudents.some((u) => u.access_plan === "Elite");

  const academicItems: NavItem[] = [
    { to: "/teacher/students", label: "My Students" },
    { to: "/teacher/calendar", label: "Calendar" },
    { to: "/teacher/materials", label: "Materials" },
    { to: "/teacher/workshops", label: "Focus Workshops" },
    ...(hasVipStudent ? [{ to: "/teacher/vip", label: "Course Builder VIP" }] : []),
    ...(hasEliteStudent ? [{ to: "/teacher/tailored-content", label: "Tailored Content" }] : []),
    { to: "/teacher/clubs", label: "Clubs" },
  ];

  const items: (NavItem | NavGroup)[] = [
    { to: "/teacher", label: "Dashboard" },
    { to: "/teacher/availability", label: "Availability" },
    { label: "Academic", items: academicItems },
    { to: "/teacher/financial", label: "Financial" },
  ];

  return (
    <RoleGuard allow="teacher">
      <div className="min-h-screen bg-background">
        <TopNav items={items} />
        <AnnouncementBanner />
        <main className="mx-auto max-w-7xl px-6 py-10">
          <Outlet />
        </main>
      </div>
    </RoleGuard>
  );
}
