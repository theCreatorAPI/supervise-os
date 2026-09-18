import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client, authenticated with the service-role key.
 *
 * The service-role key bypasses Row Level Security, so this module must never
 * be imported from a Client Component. Everything that touches it lives behind
 * a Server Action or a Route Handler; the pure URL helpers a page needs are in
 * `lib/storage-url.ts` precisely so that no client-side module has a reason to
 * reach for this one.
 */

let client: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Resolved lazily rather than at module scope: `next build` imports this file
  // while collecting page data, and a build machine legitimately has no runtime
  // secrets. Failing here surfaces the problem on the first real request instead
  // of breaking an otherwise valid build.
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
