import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuthLayout } from "@/components/supervise/auth-layout";
import { LecturerSignUpForm } from "@/components/supervise/lecturer-signup-form";

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
    </AuthLayout>
  );
}
