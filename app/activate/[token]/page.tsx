import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuthLayout } from "@/components/supervise/auth-layout";
import { ActivateForm } from "@/components/supervise/activate-form";

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const student = await prisma.user.findUnique({ where: { activationToken: token } });
  if (!student || student.status !== "PENDING_ACTIVATION") notFound();

  return (
    <AuthLayout
      title="Activate your account"
      subtitle="Set a password and you're ready to submit your first milestone."
      footer={
        <>
          <span>Already activated?</span>
          <Link href="/sign-in" className="flex items-center gap-1 font-semibold text-foreground hover:underline">
            Sign in <ArrowRight className="size-3.5" />
          </Link>
        </>
      }
    >
      <ActivateForm token={token} studentName={student.name} />
    </AuthLayout>
  );
}
