import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewPanel } from "@/components/supervise/review-panel";
import { submissionDownloadUrl } from "@/lib/storage-url";
import { formatDate, formatDateTime, formatBytes } from "@/lib/utils";
import { ChevronLeft, Download, FileText } from "lucide-react";

export default async function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      milestone: {
        include: {
          project: { include: { student: true } },
          submissions: { orderBy: { version: "desc" }, include: { reviews: true } },
        },
      },
      reviews: { include: { lecturer: true } },
    },
  });

  if (!submission) notFound();
  const project = submission.milestone.project;
  if (project.supervisorId !== session.user.id) redirect("/lecturer");

  const isPdf = submission.fileName.toLowerCase().endsWith(".pdf");

  /** The closing decision on a submission, if one has been taken. */
  function decisionOf(reviews: { decision: string; createdAt: Date }[]) {
    const closing = [...reviews]
      .filter((r) => r.decision === "APPROVED" || r.decision === "RETURNED")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return (closing?.decision as "APPROVED" | "RETURNED" | undefined) ?? null;
  }

  const decided = decisionOf(submission.reviews);
  const headerStatus = decided === "APPROVED"
    ? { label: "Approved", variant: "onSchedule" as const }
    : decided === "RETURNED"
      ? { label: "Correction Required", variant: "overdue" as const }
      : { label: "Under Review", variant: "brandSoft" as const };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link href={`/lecturer/students/${project.id}`} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to {project.student.name}
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Review Submission</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and provide feedback on student submissions
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold">{submission.milestone.name}</h2>
        <Badge variant={headerStatus.variant}>{headerStatus.label}</Badge>
        <Badge variant="outline">v{submission.version}</Badge>
        <p className="w-full text-sm text-muted-foreground">
          {project.student.name} · Submitted {formatDate(submission.submittedAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" /> Document Preview
            </CardTitle>
            <CardDescription>
              {submission.fileName} · {formatBytes(submission.fileSize)} · Submitted{" "}
              {formatDateTime(submission.submittedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPdf ? (
              <iframe
                src={submissionDownloadUrl(submission.id)}
                className="h-[560px] w-full rounded-xl border border-border-strong bg-black/5"
                title={submission.fileName}
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong">
                <p className="text-sm text-muted-foreground">Preview isn&apos;t available for this file type.</p>
              </div>
            )}
            <a
              href={submissionDownloadUrl(submission.id)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-fit items-center gap-1.5 text-xs text-brand-700 hover:underline"
            >
              <Download className="size-3.5" /> Download original file
            </a>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Review &amp; Comments</CardTitle>
              <CardDescription>
                {decided
                  ? "This submission has been reviewed."
                  : "Add comments as you read, then take a decision."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewPanel
                submissionId={submission.id}
                milestoneName={submission.milestone.name}
                decided={decided}
                reviews={submission.reviews.map((r) => ({
                  id: r.id,
                  comment: r.comment,
                  decision: r.decision,
                  author: r.lecturer.name,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
          <CardDescription>Every version of this milestone, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {submission.milestone.submissions.map((version) => {
            const versionDecision = decisionOf(version.reviews);
            const label = versionDecision === "APPROVED"
              ? "Approved"
              : versionDecision === "RETURNED"
                ? "Correction Required"
                : "Under Review";
            const variant = versionDecision === "APPROVED"
              ? ("onSchedule" as const)
              : versionDecision === "RETURNED"
                ? ("overdue" as const)
                : ("brandSoft" as const);
            return (
              <div
                key={version.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-strong bg-black/2 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">Version {version.version}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDate(version.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={variant}>{label}</Badge>
                  <a
                    href={submissionDownloadUrl(version.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-700 hover:underline"
                  >
                    <Download className="size-3.5" /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
