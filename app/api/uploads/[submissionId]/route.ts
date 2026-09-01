import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveUploadPath } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submissionId } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { milestone: { include: { project: true } } },
  });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = submission.milestone.project;
  const allowed =
    session.user.role === "MANAGEMENT" ||
    session.user.id === project.studentId ||
    session.user.id === project.supervisorId;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const storedName = submission.fileUrl.split("/").pop() ?? "";
  const filePath = resolveUploadPath(storedName);
  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const contentType = submission.fileName.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${submission.fileName}"`,
    },
  });
}
