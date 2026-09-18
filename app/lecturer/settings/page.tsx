import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotificationToggle } from "@/components/supervise/notification-toggle";
import { SignOutAction } from "@/components/supervise/sign-out-action";
import { updateNotificationPreference, updateMeetingReminderPreference } from "@/app/actions/settings";

export default async function LecturerSettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: true },
  });
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and notification preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="mt-1 text-sm font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 break-words text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="mt-1 text-sm font-medium">Lecturer / Supervisor</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="mt-1 text-sm font-medium">{user.department?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Staff ID</p>
            <p className="mt-1 text-sm font-medium">{user.staffId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Supervision capacity</p>
            <p className="mt-1 text-sm font-medium">{user.maxLoad} students</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive supervision updates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 first:pt-0">
            <div>
              <p className="text-sm font-medium">Project updates</p>
              <p className="text-xs text-muted-foreground">Receive notifications about student project activity.</p>
            </div>
            <NotificationToggle initialEnabled={user.notificationsEnabled} action={updateNotificationPreference} />
          </div>
          <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
            <div>
              <p className="text-sm font-medium">Meeting reminders</p>
              <p className="text-xs text-muted-foreground">Get notified about upcoming supervision meetings.</p>
            </div>
            <NotificationToggle initialEnabled={user.meetingReminders} action={updateMeetingReminderPreference} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <SignOutAction />
        </CardContent>
      </Card>
    </div>
  );
}
