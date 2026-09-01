import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionUploader } from "@/components/supervise/submission-uploader";
import { formatDate, formatDateTime, formatBytes } from "@/lib/utils";
import { submissionDownloadUrl } from "@/lib/storage";
import { ChevronLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  RETURNED: "Returned",
  APPROVED: "Reviewed",
};

export default async function SubmissionDetailsPage({
  params,
}: {
  params: Promise<{ milestoneId: string }>;
}) {
  const { milestoneId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: true,
      submissions: {
        orderBy: { version: "desc" },
        include: { reviews: { include: { lecturer: true } } },
      },
    },
  });

  if (!milestone) notFound();
  if (milestone.project.studentId !== session.user.id) redirect("/student");

  const latest = milestone.submissions[0];
  const needsUpload = !latest || milestone.status === "RETURNED";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/student/submissions" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to submissions
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Submission Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Milestone {milestone.order} — {milestone.name}
        </p>
      </div>

      {latest && (
        <Card>
          <CardHeader>
            <CardTitle>Submission Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="mt-1 text-sm font-medium">{formatDate(latest.submittedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-medium text-brand-700">{STATUS_LABEL[milestone.status]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Document</p>
              <p className="mt-1 text-sm font-medium">{latest.fileName.split(".").pop()?.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submission</p>
              <p className="mt-1 text-sm font-medium">v{latest.version}</p>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <a
                href={submissionDownloadUrl(latest.id)}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1.5 text-xs text-brand-700 hover:underline"
              >
                <Download className="size-3.5" /> {latest.fileName} · {formatBytes(latest.fileSize)}
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supervisor Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {latest && latest.reviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {latest.reviews.map((f) => (
                <div key={f.id} className="rounded-lg bg-black/[0.03] p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold">{f.lecturer.name}</span>
                    <Badge variant={f.decision === "APPROVED" ? "onSchedule" : f.decision === "RETURNED" ? "overdue" : "outline"}>
                      {f.decision.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-sm">
                {latest ? "Your submission is currently being reviewed by your supervisor." : "You haven't submitted this milestone yet."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {latest
                  ? "Feedback and corrections will appear here once the review is complete."
                  : "Once you submit, feedback will appear here."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Action</CardTitle>
        </CardHeader>
        <CardContent>
          {needsUpload ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold">
                  {latest ? "Resubmission required" : "Submit this milestone"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {latest
                    ? "Your supervisor returned this submission — upload a corrected version."
                    : "Attach your file below to submit for review."}
                </p>
              </div>
              <SubmissionUploader milestoneId={milestone.id} milestoneName={milestone.name} />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">No action required</p>
                <p className="mt-1 text-xs text-muted-foreground">You&apos;ll be notified when your supervisor completes the review.</p>
              </div>
              <Badge variant="brandSoft">Waiting for review</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {milestone.submissions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earlier versions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {milestone.submissions.slice(1).map((s) => (
              <a
                key={s.id}
                href={submissionDownloadUrl(s.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg bg-black/[0.02] px-3 py-2 text-xs hover:bg-black/[0.05]"
              >
                <span>
                  v{s.version} · {s.fileName} · {formatDateTime(s.submittedAt)}
                </span>
                <Download className="size-3.5 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
