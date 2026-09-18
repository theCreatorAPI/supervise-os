import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Submission file storage, backed by a private Supabase Storage bucket.
 *
 * The bucket is private on purpose. Reads go through `/api/uploads/[submissionId]`,
 * which checks that the caller is the student, their supervisor, or management
 * before streaming any bytes — the same authorization the app enforces everywhere
 * else. A public bucket would make every submission reachable by anyone holding
 * the URL, which is not acceptable for unpublished student research.
 *
 * This module reaches for the service-role key, so it must only be imported from
 * Server Actions and Route Handlers. Pages that just need a link import
 * `lib/storage-url.ts` instead.
 */

export const SUBMISSIONS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "submissions";

export const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Issues a one-shot signed URL the browser can upload straight to.
 *
 * Large files never pass through the server: a Server Action request is capped
 * at 1MB by default, and serverless platforms cap request bodies well below the
 * 25MB this app accepts, so routing a chapter PDF through the action would fail
 * on any realistic submission.
 */
export async function createSignedUpload(storedName: string): Promise<{ signedUrl: string; token: string }> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(SUBMISSIONS_BUCKET)
    .createSignedUploadUrl(storedName);

  if (error || !data) {
    throw new Error(`Could not create an upload URL: ${error?.message ?? "unknown error"}`);
  }

  return { signedUrl: data.signedUrl, token: data.token };
}

/**
 * Returns the stored size of an object, or null when it does not exist.
 *
 * The browser uploads directly, so the client is the only one that has seen the
 * file. Reading the size back from storage means the recorded size is what was
 * actually stored rather than what the client claimed, and doubles as proof the
 * upload really happened before a submission row is written.
 */
export async function statObject(storedName: string): Promise<number | null> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(SUBMISSIONS_BUCKET)
    .list("", { search: storedName, limit: 1 });

  if (error || !data) return null;

  const match = data.find((entry) => entry.name === storedName);
  if (!match) return null;

  return (match.metadata?.size as number | undefined) ?? 0;
}

/**
 * Fetches a stored object. Returns null when the object is missing, so callers
 * can answer 404 rather than surfacing a storage error to the user.
 */
export async function downloadFile(storedName: string): Promise<Buffer | null> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(SUBMISSIONS_BUCKET)
    .download(storedName);

  if (error || !data) return null;

  return Buffer.from(await data.arrayBuffer());
}

export { submissionDownloadUrl } from "./storage-url";
