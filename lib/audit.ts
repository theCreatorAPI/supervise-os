import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  actorId?: string;
  projectId?: string;
  action: string;
  description: string;
}) {
  return prisma.auditEvent.create({
    data: {
      actorId: params.actorId,
      projectId: params.projectId,
      action: params.action,
      description: params.description,
    },
  });
}
