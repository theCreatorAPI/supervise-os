"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { revalidatePath } from "next/cache";

const registerLecturerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staffId: z.string().min(2, "Enter your staff ID"),
  departmentId: z.string().min(1, "Choose a department"),
});

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registerLecturer(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerLecturerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    staffId: formData.get("staffId"),
    departmentId: formData.get("departmentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, staffId, departmentId } = parsed.data;

  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingEmail) return { error: "An account with that email already exists." };

  const existingStaffId = await prisma.user.findUnique({ where: { staffId } });
  if (existingStaffId) return { error: "That staff ID is already registered." };

  const passwordHash = await bcrypt.hash(password, 10);

  const lecturer = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "LECTURER",
      status: "ACTIVE",
      staffId,
      departmentId,
      maxLoad: 15,
    },
  });

  await logAudit({
    actorId: lecturer.id,
    action: "LECTURER_REGISTERED",
    description: `${name} registered as a lecturer (staff ID ${staffId}).`,
  });

  return { success: true };
}

const createStudentSchema = z.object({
  name: z.string().min(2, "Enter the student's full name"),
  email: z.string().email("Enter a valid email"),
  matricNumber: z.string().min(2, "Enter a matric number"),
});

export type CreateStudentState = { error?: string; success?: boolean; activationUrl?: string };

export async function createStudent(_prev: CreateStudentState, formData: FormData): Promise<CreateStudentState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "LECTURER") {
    return { error: "Only lecturers can add students." };
  }

  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    matricNumber: formData.get("matricNumber"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { name, email, matricNumber } = parsed.data;

  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingEmail) return { error: "A user with that email already exists." };
  const existingMatric = await prisma.user.findUnique({ where: { matricNumber } });
  if (existingMatric) return { error: "That matric number is already registered." };

  const lecturer = await prisma.user.findUnique({ where: { id: session.user.id } });

  const activationToken = randomBytes(24).toString("hex");

  const student = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      matricNumber,
      role: "STUDENT",
      status: "PENDING_ACTIVATION",
      departmentId: lecturer?.departmentId,
      pendingSupervisorId: session.user.id,
      activationToken,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "STUDENT_CREATED",
    description: `${session.user.name} added ${name} (${matricNumber}) as a student, pending activation.`,
  });

  revalidatePath("/lecturer/students");

  return { success: true, activationUrl: `/activate/${activationToken}?student=${encodeURIComponent(student.id)}` };
}

const activateSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type ActivateState = { error?: string; success?: boolean };

export async function activateStudent(_prev: ActivateState, formData: FormData): Promise<ActivateState> {
  const parsed = activateSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { token, password } = parsed.data;

  const student = await prisma.user.findUnique({ where: { activationToken: token } });
  if (!student || student.status !== "PENDING_ACTIVATION") {
    return { error: "This activation link is invalid or has already been used." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: student.id },
    data: { passwordHash, status: "ACTIVE", activationToken: null },
  });

  await logAudit({
    actorId: student.id,
    action: "STUDENT_ACTIVATED",
    description: `${student.name} activated their account.`,
  });

  if (student.pendingSupervisorId) {
    const supervisor = await prisma.user.findUnique({ where: { id: student.pendingSupervisorId } });
    if (supervisor) {
      await notify(
        student.id,
        `You're all set — ${supervisor.name} is your supervisor. Create your project to get started.`,
        "/student"
      );
    }
  }

  return { success: true };
}
