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
    { label: "Students", href: "/lecturer/students", icon: Users },
    { label: "At Risk", href: "/lecturer/at-risk", icon: AlertTriangle },
    { label: "Meetings", href: "/lecturer/meetings", icon: CalendarClock },
  ],
  MANAGEMENT: [
    { label: "Overview", href: "/management", icon: LayoutGrid },
    { label: "Workload", href: "/management/workload", icon: Gauge },
    { label: "At Risk", href: "/management/at-risk", icon: AlertTriangle },
    { label: "Students", href: "/management/students", icon: GraduationCap },
  ],
};

/** Utility items pinned at the bottom of the sidebar, separate from the main nav list. */
export const SECONDARY_NAV: Record<"STUDENT" | "LECTURER" | "MANAGEMENT", NavItem[]> = {
  STUDENT: [
    { label: "Settings", href: "/student/settings", icon: Settings },
    { label: "Help & Support", href: "/student/help", icon: HelpCircle },
  ],
  LECTURER: [],
  MANAGEMENT: [],
};

/** Primary items shown in the mobile bottom tab bar (kept short so it doesn't overcrowd). */
export const MOBILE_NAV_LIMIT = 5;
