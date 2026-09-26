import type { Metadata } from "next";

/**
 * Everything under this segment sits behind a session and shows real student
 * data. Even though the route guard redirects crawlers, saying so explicitly
 * keeps these URLs out of search results and link previews.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

import { auth } from "@/auth";
import { AppShell } from "@/components/supervise/app-shell";
import { SessionSwitcher } from "@/components/supervise/session-switcher";
import { getSupervisorSessions } from "@/lib/academic-session";

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // In the layout rather than on each page: the switcher has to be reachable
  // from every supervision screen, and every one of them filters by its value.
  const { sessions, selected } = session?.user
    ? await getSupervisorSessions(session.user.id)
    : { sessions: [], selected: "" };

  return (
    <AppShell
      role="LECTURER"
      userName={session?.user?.name ?? "Lecturer"}
      toolbar={sessions.length > 0 ? <SessionSwitcher sessions={sessions} selected={selected} /> : null}
    >
      {children}
    </AppShell>
  );
}
