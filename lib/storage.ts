import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function saveFile(file: File): Promise<{ url: string; fileName: string; size: number }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || "";
  const id = randomUUID();
  const storedName = `${id}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return { url: `/api/uploads/${storedName}`, fileName: file.name, size: buffer.length };
}

export function resolveUploadPath(storedName: string) {
  return path.join(UPLOAD_DIR, storedName);
}

export function submissionDownloadUrl(submissionId: string) {
  return `/api/uploads/${submissionId}`;
}
