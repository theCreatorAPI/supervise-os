"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SettingsState = { error?: string; success?: boolean };

export async function updateNotificationPreference(enabled: boolean): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationsEnabled: enabled },
  });

  revalidatePath("/student/settings");
  revalidatePath("/lecturer/settings");
  return { success: true };
}

export async function updateMeetingReminderPreference(enabled: boolean): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { meetingReminders: enabled },
  });

  revalidatePath("/student/settings");
  revalidatePath("/lecturer/settings");
  return { success: true };
}
