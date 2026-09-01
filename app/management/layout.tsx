import { auth } from "@/auth";
import { AppShell } from "@/components/supervise/app-shell";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <AppShell role="MANAGEMENT" userName={session?.user?.name ?? "Management"}>
      {children}
    </AppShell>
  );
}
