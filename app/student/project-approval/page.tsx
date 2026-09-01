import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposeTopicForm } from "@/components/supervise/propose-topic-form";
import { DeleteProposalButton } from "@/components/supervise/delete-proposal-button";
import { formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const MAX_PROPOSALS = 3;

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
  const canPropose = !project && proposals.length < MAX_PROPOSALS && !approved;

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
                    {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                  </span>
                  {p.status === "PENDING" && <DeleteProposalButton proposalId={p.id} />}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {(project || approved) && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
