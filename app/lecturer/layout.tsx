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
