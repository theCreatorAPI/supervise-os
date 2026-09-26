import {
  LayoutGrid,
  History,
  CalendarClock,
  Users,
  AlertTriangle,
  Gauge,
  GraduationCap,
  ClipboardCheck,
  FolderKanban,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: typeof LayoutGrid };

export const NAV: Record<"STUDENT" | "LECTURER" | "MANAGEMENT", NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/student", icon: LayoutGrid },
    { label: "Project Approval", href: "/student/project-approval", icon: ClipboardCheck },
    { label: "My Project", href: "/student/project", icon: FolderKanban },
    { label: "Submissions", href: "/student/submissions", icon: History },
    { label: "Meetings", href: "/student/meetings", icon: CalendarClock },
    { label: "Notifications", href: "/student/notifications", icon: Bell },
  ],
  LECTURER: [
    { label: "Dashboard", href: "/lecturer", icon: LayoutGrid },
    { label: "My Students", href: "/lecturer/students", icon: Users },
    { label: "Submissions", href: "/lecturer/submissions", icon: History },
    { label: "Meetings", href: "/lecturer/meetings", icon: CalendarClock },
    { label: "Notifications", href: "/lecturer/notifications", icon: Bell },
    // Not in the supervisor flow spec, but it's the risk engine's whole payoff
    // and already built — kept rather than dropped.
    { label: "At Risk", href: "/lecturer/at-risk", icon: AlertTriangle },
  ],
  MANAGEMENT: [
    { label: "Dashboard", href: "/management", icon: LayoutGrid },
    { label: "Students", href: "/management/students", icon: GraduationCap },
    { label: "Lecturers", href: "/management/lecturers", icon: Users },
    { label: "Projects", href: "/management/projects", icon: FolderKanban },
    { label: "Submissions", href: "/management/submissions", icon: History },
    { label: "Meetings", href: "/management/meetings", icon: CalendarClock },
    { label: "Notifications", href: "/management/notifications", icon: Bell },
    // Not on the admin flow sheet, but the risk engine and capacity view are
    // already built and are the department-level answers management asks for.
    { label: "At Risk", href: "/management/at-risk", icon: AlertTriangle },
    { label: "Workload", href: "/management/workload", icon: Gauge },
  ],
};

/** Utility items pinned at the bottom of the sidebar, separate from the main nav list. */
export const SECONDARY_NAV: Record<"STUDENT" | "LECTURER" | "MANAGEMENT", NavItem[]> = {
  STUDENT: [
    { label: "Settings", href: "/student/settings", icon: Settings },
    { label: "Help & Support", href: "/student/help", icon: HelpCircle },
  ],
  LECTURER: [
    { label: "Settings", href: "/lecturer/settings", icon: Settings },
    { label: "Help & Support", href: "/lecturer/help", icon: HelpCircle },
  ],
  MANAGEMENT: [
    { label: "Settings", href: "/management/settings", icon: Settings },
    { label: "Help & Support", href: "/management/help", icon: HelpCircle },
  ],
};

/** Primary items shown in the mobile bottom tab bar (kept short so it doesn't overcrowd). */
export const MOBILE_NAV_LIMIT = 5;
