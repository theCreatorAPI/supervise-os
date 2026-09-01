import { auth } from "@/auth";
import { AppShell } from "@/components/supervise/app-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <AppShell role="STUDENT" userName={session?.user?.name ?? "Student"}>
      {children}
    </AppShell>
  );
}
