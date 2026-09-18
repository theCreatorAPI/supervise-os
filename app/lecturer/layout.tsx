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

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <AppShell role="LECTURER" userName={session?.user?.name ?? "Lecturer"}>
      {children}
    </AppShell>
  );
}
