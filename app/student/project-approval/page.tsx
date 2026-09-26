import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposeTopicForm } from "@/components/supervise/propose-topic-form";
import { DeleteProposalButton } from "@/components/supervise/delete-proposal-button";
import { formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/** How many topics may be awaiting a decision at once. */
const MAX_PENDING_PROPOSALS = 3;

/**
 * "Rejected" is the database's word; the supervisor screen calls the same action
 * "Request Changes", and so does the student flow. A student whose topic needs a
 * rewrite has not been rejected — they have been asked for changes.
 */
const PROPOSAL_STATUS_LABEL = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Changes Requested",
} as const;

export default async function ProjectApprovalPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [project, proposals] = await Promise.all([
    prisma.project.findFirst({ where: { studentId: session.user.id } }),
    prisma.topicProposal.findMany({
      where: { studentId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const approved = proposals.find((p) => p.status === "APPROVED");

  // Only undecided topics count toward the cap. Counting closed ones would mean
  // a student asked for changes three times could never propose again — which is
  // the opposite of what requesting changes is asking them to do.
  const pendingCount = proposals.filter((p) => p.status === "PENDING").length;
  const canPropose = !project && !approved && pendingCount < MAX_PENDING_PROPOSALS;

  // The most recent decision, which is what the status card and feedback reflect.
  const lastDecided = proposals.find((p) => p.status !== "PENDING");
  const changesRequested = !approved && !project && lastDecided?.status === "REJECTED" ? lastDecided : null;

  const approvalState = approved || project ? "APPROVED" : changesRequested ? "REJECTED" : pendingCount > 0 ? "PENDING" : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Project Approval</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit your research topic for supervisor review before beginning your project.
        </p>
      </div>

      {canPropose && (
        <Card>
          <CardHeader>
            <CardTitle>Proposed Project Topic</CardTitle>
            <CardDescription>Enter the research topic you want your supervisor to review and approve.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProposeTopicForm inProgress={proposals.length > 0} />
          </CardContent>
        </Card>
      )}

      {changesRequested?.feedback && (
        <Card>
          <CardHeader>
            <CardTitle>Supervisor Feedback</CardTitle>
            <CardDescription>What your supervisor asked you to change before resubmitting.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{changesRequested.feedback}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Proposed Topics</CardTitle>
          <CardDescription>Your submitted topics and their review status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {proposals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No topics proposed yet. Submit one above to get started.
            </p>
          ) : (
            proposals.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={
                      p.status === "APPROVED"
                        ? "text-sm font-medium text-success-700"
                        : p.status === "REJECTED"
                        ? "text-sm font-medium text-critical-700"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {PROPOSAL_STATUS_LABEL[p.status]}
                  </span>
                  {p.status === "PENDING" && <DeleteProposalButton proposalId={p.id} />}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {approvalState && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {approvalState === "APPROVED" ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-success-700">Approved</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your project topic &ldquo;{project?.title ?? approved?.title}&rdquo; has been approved by your
                    supervisor.
                  </p>
                </div>
                <Button asChild className="w-fit">
                  <Link href="/student/project">
                    Go to My Project <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : approvalState === "REJECTED" ? (
              <div>
                <p className="text-sm font-semibold text-critical-700">Changes Requested</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your supervisor has requested changes to your proposed project topic. Review the feedback, make the
                  necessary changes, and resubmit for approval.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Pending</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your proposed project topic has been submitted and is awaiting review from your supervisor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
