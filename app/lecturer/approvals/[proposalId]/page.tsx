import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { DetailSummary } from "@/components/supervise/detail-summary";
import { ProposalDecisionPanel } from "@/components/supervise/proposal-decision-panel";
import { formatDate } from "@/lib/utils";

/**
 * Project Approval Review, in all three states the flow sheet draws: pending
 * (decision form), changes requested, and approved.
 *
 * After a decision the form is replaced by what was decided and when, rather
 * than disappearing — the supervisor's own words stay visible on the screen
 * where they were written.
 */

const DECIDED = {
  APPROVED: {
    heading: "Approved",
    tone: "text-success-700",
    description: "This project topic has been approved and the student can proceed with the project.",
    body: "The proposed project topic has been approved. The student can now proceed with the project and begin the approved milestones.",
    dateLabel: "Approved on",
  },
  REJECTED: {
    heading: "Changes Requested",
    tone: "text-critical-700",
    description: "Changes have been requested before this project topic can be approved.",
    body: "The student has been asked to revise the proposed topic and resubmit.",
    dateLabel: "Requested on",
  },
} as const;

export default async function ProposalReviewPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { proposalId } = await params;

  const proposal = await prisma.topicProposal.findUnique({
    where: { id: proposalId },
    include: { student: { include: { department: true } } },
  });

  if (!proposal) notFound();

  // Scoped the same way the action is: a supervisor only ever sees proposals
  // routed to them, so a guessed id is a 404 rather than someone else's student.
  if (proposal.student.pendingSupervisorId !== session.user.id) notFound();

  const decided = proposal.status === "PENDING" ? null : DECIDED[proposal.status];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/lecturer/approvals"
          className="-ml-1 mb-2 inline-flex items-center gap-1 py-1 text-sm text-brand-700 hover:underline"
        >
          <ChevronLeft className="size-4" /> Project Approvals
        </Link>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Project Approval Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the proposed research topic before approving the project.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Project Information</h2>
        <DetailSummary
          fields={[
            { label: "Student", value: proposal.student.name },
            { label: "Department", value: proposal.student.department?.name ?? "—" },
            { label: "Proposed Project Topic", value: proposal.title },
            { label: "Date Submitted", value: formatDate(proposal.createdAt) },
            { label: "Lecturer", value: session.user.name ?? "—" },
            {
              label: "Current Status",
              value: decided ? decided.heading : "Pending",
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Review Decision</h2>

        <Card>
          <CardHeader>
            <CardDescription>
              {decided ? decided.description : "Approve the proposed topic or request changes from the student."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {decided ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Approval Status</p>
                    <p className={`mt-1 font-display text-lg font-bold ${decided.tone}`}>{decided.heading}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{decided.dateLabel}</p>
                    <p className="mt-1 text-sm font-medium">
                      {proposal.decidedAt ? formatDate(proposal.decidedAt) : "—"}
                    </p>
                  </div>
                </div>

                {proposal.feedback ? (
                  <div>
                    <p className="text-sm font-medium">Feedback sent to student</p>
                    <p className="mt-1 text-sm text-muted-foreground">{proposal.feedback}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{decided.body}</p>
                )}
              </div>
            ) : (
              <ProposalDecisionPanel proposalId={proposal.id} topic={proposal.title} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
