/**
 * Pure URL helpers for submission files.
 *
 * Deliberately free of any Supabase import: pages only ever need to build a
 * link, and keeping that separate from `lib/storage.ts` means importing a URL
 * helper can never drag the service-role client into a bundle.
 */

/**
 * Submission files are served through our own authenticated proxy rather than a
 * public storage URL, so that the role checks in the route handler stay the only
 * way to reach a document.
 */
export function submissionDownloadUrl(submissionId: string) {
  return `/api/uploads/${submissionId}`;
}
