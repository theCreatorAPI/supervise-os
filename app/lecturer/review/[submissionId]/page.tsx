import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackForm } from "@/components/supervise/feedback-form";
import { submissionDownloadUrl } from "@/lib/storage";
import { formatDateTime, formatBytes } from "@/lib/utils";
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
  const alreadyReviewed = submission.reviews.length > 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link href={`/lecturer/students/${project.id}`} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to {project.student.name}
      </Link>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">Milestone {submission.milestone.order}</Badge>
          <Badge variant="brand">v{submission.version}</Badge>
        </div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{submission.milestone.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.student.name} · {project.title}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" /> {submission.fileName}
            </CardTitle>
            <CardDescription>
              {formatBytes(submission.fileSize)} · Submitted {formatDateTime(submission.submittedAt)}
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
              <CardTitle>{alreadyReviewed ? "Feedback given" : "Leave feedback"}</CardTitle>
              <CardDescription>
                {alreadyReviewed ? "This submission has already been reviewed." : "Your decision updates the milestone status instantly."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alreadyReviewed ? (
                <div className="flex flex-col gap-2">
                  {submission.reviews.map((f) => (
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
                <FeedbackForm submissionId={submission.id} milestoneName={submission.milestone.name} />
              )}
            </CardContent>
          </Card>

          {submission.milestone.submissions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Earlier versions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {submission.milestone.submissions
                  .filter((s) => s.id !== submission.id)
                  .map((s) => (
                    <a
                      key={s.id}
                      href={submissionDownloadUrl(s.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg bg-black/[0.02] px-3 py-2 text-xs hover:bg-black/[0.05]"
                    >
                      <span>v{s.version} · {s.fileName}</span>
                      <Download className="size-3.5 text-muted-foreground" />
                    </a>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
