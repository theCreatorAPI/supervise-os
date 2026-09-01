import { notFound } from "next/navigation";
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
    <AuthLayout title="Activate your account" subtitle="One step before you can sign in.">
      <ActivateForm token={token} studentName={student.name} />
    </AuthLayout>
  );
}
