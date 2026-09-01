"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export type SettingsState = { error?: string; success?: boolean };

export async function updateNotificationPreference(enabled: boolean): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { notificationsEnabled: enabled },
    });

    revalidatePath("/student/settings");
    revalidatePath("/lecturer/settings");
    return { success: true };
  } catch (err) {
    console.error("[updateNotificationPreference]", err);
    return { error: GENERIC_ERROR };
  }
}

export async function updateMeetingReminderPreference(enabled: boolean): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { meetingReminders: enabled },
    });

    revalidatePath("/student/settings");
    revalidatePath("/lecturer/settings");
    return { success: true };
  } catch (err) {
    console.error("[updateMeetingReminderPreference]", err);
    return { error: GENERIC_ERROR };
  }
}
