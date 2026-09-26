import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupervisorSessions } from "@/lib/academic-session";
import { formatDate } from "@/lib/utils";

/**
 * Topic proposals waiting on this supervisor.
 *
 * Deciding happens on the review screen rather than here: approving a topic
 * creates the student's project and its whole milestone set, which is not a
 * thing to do from a list row without reading the proposal first.
 */
export default async function LecturerApprovalsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { selected } = await getSupervisorSessions(session.user.id);

  const proposals = await prisma.topicProposal.findMany({
    where: {
      status: "PENDING",
      student: { pendingSupervisorId: session.user.id, academicSession: selected },
    },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Project Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review research topics submitted by your students.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>

        {proposals.length === 0 ? (
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">
              No topics are waiting on you right now.
            </p>
          </CardContent>
        ) : (
          <>
            {/* Desktop: the table from the flow sheet */}
            <CardContent className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Proposed Project</th>
                    <th className="px-6 py-4 font-medium">Submitted</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="whitespace-nowrap px-6 py-4 font-medium">{p.student.name}</td>
                      <td className="max-w-90 px-6 py-4 text-muted-foreground">{p.title}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="atRisk">Pending</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/lecturer/approvals/${p.id}`}>Review</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>

            {/* Mobile: the same rows stacked */}
            <CardContent className="flex flex-col gap-3 md:hidden">
              {proposals.map((p) => (
                <Link
                  key={p.id}
                  href={`/lecturer/approvals/${p.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border-strong bg-black/2 p-3 transition-colors hover:bg-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm font-medium">{p.student.name}</p>
                    <Badge variant="atRisk">Pending</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">Submitted {formatDate(p.createdAt)}</p>
                </Link>
              ))}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
