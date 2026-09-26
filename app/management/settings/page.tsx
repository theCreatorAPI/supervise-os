import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotificationToggle } from "@/components/supervise/notification-toggle";
import { SignOutAction } from "@/components/supervise/sign-out-action";
import {
  updateNotificationPreference,
  updateSubmissionUpdatePreference,
  updateMeetingReminderPreference,
} from "@/app/actions/settings";

export default async function ManagementSettingsPage() {
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
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="mt-1 text-sm font-medium">{user.name}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 text-sm font-medium wrap-break-word">{user.email}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="mt-1 text-sm font-medium">Administrator</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Department</p>
            {/* Management oversees the whole department rather than one of them,
                so this reads "All Departments" unless a specific one is set. */}
            <p className="mt-1 text-sm font-medium">{user.department?.name ?? "All Departments"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive administrative updates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 first:pt-0">
            <div>
              <p className="text-sm font-medium">Project Activity</p>
              <p className="text-xs text-muted-foreground">Receive notifications about student project activity.</p>
            </div>
            <NotificationToggle initialEnabled={user.notificationsEnabled} action={updateNotificationPreference} />
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3">
            <div>
              <p className="text-sm font-medium">Submission updates</p>
              <p className="text-xs text-muted-foreground">Get notified about important submission activity.</p>
            </div>
            <NotificationToggle initialEnabled={user.submissionUpdates} action={updateSubmissionUpdatePreference} />
          </div>
          <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
            <div>
              <p className="text-sm font-medium">Meeting updates</p>
              <p className="text-xs text-muted-foreground">
                Receive notifications about department supervision meetings.
              </p>
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
