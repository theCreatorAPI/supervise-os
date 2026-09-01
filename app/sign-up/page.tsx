import { prisma } from "@/lib/prisma";
import { AuthLayout } from "@/components/supervise/auth-layout";
import { LecturerSignUpForm } from "@/components/supervise/lecturer-signup-form";

export default async function SignUpPage() {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <AuthLayout
      title="Register as a lecturer"
      subtitle="Students don't self-register — once you're in, you add them and they activate their own account."
    >
      <LecturerSignUpForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
    </AuthLayout>
  );
}
