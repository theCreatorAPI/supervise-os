import { prisma } from "@/lib/prisma";

export async function notify(userId: string, message: string, link?: string, category: "general" | "meeting" = "general") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsEnabled: true, meetingReminders: true },
  });
  if (!user) return null;
  if (!user.notificationsEnabled) return null;
  if (category === "meeting" && !user.meetingReminders) return null;

  return prisma.notification.create({
    data: { userId, message, link },
  });
}
