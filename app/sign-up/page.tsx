import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuthLayout } from "@/components/supervise/auth-layout";
import { LecturerSignUpForm } from "@/components/supervise/lecturer-signup-form";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

export const metadata: Metadata = {
  title: "Create a lecturer account",
  description:
    "Register as a supervising lecturer on Supervise OS and start tracking your students' milestones, submissions and reviews.",
  alternates: { canonical: "/sign-up" },
  openGraph: {
    title: "Create a lecturer account · Supervise OS",
    description: "Register as a supervising lecturer on Supervise OS.",
    url: "/sign-up",
  },
};

// Rendered per request: the department list is editable data living in Postgres,
// so prerendering it at build time would both freeze the options until the next
// deploy and make every build depend on the database being reachable.
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <AuthLayout
      title="Create your lecturer account"
      subtitle="Students don't sign up here — you add them once you're in, and they activate their own account."
      footer={
        <>
          <span>Already have an account?</span>
          <Link href="/sign-in" className="flex items-center gap-1 font-semibold text-foreground hover:underline">
            Sign in <ArrowRight className="size-3.5" />
          </Link>
        </>
      }
    >
      <LecturerSignUpForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} />

      {/* Listed rather than made clickable: signing in is the sign-in screen's
          job, and duplicating that flow here would mean two places to keep
          working. The credentials are here so nobody has to go hunting. */}
      <div className="mt-6 rounded-xl border border-border-strong bg-black/2 p-4">
        <p className="text-xs font-semibold">Just exploring?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in with a demo account instead — password{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 font-mono">{DEMO_PASSWORD}</code>
        </p>
        <ul className="mt-2.5 flex flex-col gap-1">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email} className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
              <span className="capitalize text-muted-foreground">{account.role.toLowerCase()}</span>
              <code className="font-mono">{account.email}</code>
            </li>
          ))}
        </ul>
        <Link
          href="/sign-in"
          className="mt-3 inline-flex items-center gap-1 py-1 text-xs font-semibold text-brand-700 hover:underline"
        >
          Go to sign in <ArrowRight className="size-3" />
        </Link>
      </div>
    </AuthLayout>
  );
}
