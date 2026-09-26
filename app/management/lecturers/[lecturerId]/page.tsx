import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DetailSummary, ActivityFeed } from "@/components/supervise/detail-summary";
import { summariseProject, statusBadgeVariant } from "@/lib/project-status";
import { formatDate } from "@/lib/utils";

export default async function ManagementLecturerDetailPage({
  params,
}: {
  params: Promise<{ lecturerId: string }>;
}) {
  const { lecturerId } = await params;

  const lecturer = await prisma.user.findFirst({
    where: { id: lecturerId, role: "LECTURER" },
    include: {
      department: true,
      projectsSupervised: {
        include: { student: true, milestones: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lecturer) notFound();

  const assigned = lecturer.projectsSupervised.map((p) => ({
    id: p.id,
    student: p.student.name,
    title: p.title,
    summary: summariseProject(p, p.milestones),
  }));

  const activity = await prisma.auditEvent.findMany({
    where: { project: { supervisorId: lecturer.id } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Lecturer Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View lecturer information and supervision activities.
        </p>
      </div>

      <DetailSummary
        fields={[
          { label: "Lecturer", value: lecturer.name },
          { label: "Department", value: lecturer.department?.name ?? "—" },
          { label: "Students", value: `${assigned.length} of ${lecturer.maxLoad} capacity` },
          {
            label: "Active Projects",
            value: lecturer.projectsSupervised.filter((p) => p.status === "ACTIVE").length,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Assigned Students</CardTitle>
          <CardDescription>Students currently assigned to this lecturer.</CardDescription>
        </CardHeader>

        {assigned.length === 0 ? (
          <CardContent>
            <p className="py-2 text-sm text-muted-foreground">No students are assigned to this lecturer.</p>
          </CardContent>
        ) : (
          <>
            <CardContent className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Project</th>
                    <th className="px-6 py-4 font-medium">Progress</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assigned.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-4 font-medium">{r.student}</td>
                      <td className="max-w-70 truncate px-6 py-4 text-muted-foreground">{r.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex min-w-32 items-center gap-2">
                          <ProgressBar value={r.summary.progress} className="flex-1" />
                          <span className="shrink-0 text-xs text-muted-foreground">{r.summary.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/management/students/${r.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>

            <CardContent className="flex flex-col gap-3 md:hidden">
              {assigned.map((r) => (
                <Link
                  key={r.id}
                  href={`/management/students/${r.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border-strong bg-black/2 p-3 transition-colors hover:bg-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.student}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.title}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={r.summary.progress} className="flex-1" />
                    <span className="shrink-0 text-xs text-muted-foreground">{r.summary.progress}%</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </>
        )}
      </Card>

      <ActivityFeed
        title="Supervision Activity"
        description="Recent activity across assigned student projects."
        emptyLabel="No recorded activity for this lecturer yet."
        items={activity.map((e) => ({
          id: e.id,
          text: e.description,
          when: formatDate(e.createdAt),
          href: e.projectId ? `/management/projects/${e.projectId}` : undefined,
        }))}
      />
    </div>
  );
}
