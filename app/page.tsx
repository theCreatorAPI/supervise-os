import { auth } from "@/auth";
import { LandingPage } from "@/components/supervise/landing-page";

export default async function Home() {
  const session = await auth();
  const dashboardHref = session?.user
    ? session.user.role === "STUDENT"
      ? "/student"
      : session.user.role === "LECTURER"
      ? "/lecturer"
      : "/management"
    : null;

  return <LandingPage dashboardHref={dashboardHref} userName={session?.user?.name ?? null} />;
}

export const dynamic = "force-dynamic";
