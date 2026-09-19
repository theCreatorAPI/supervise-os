import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Makes a transaction-pooler URL safe for Prisma even when it was pasted without
 * the flags it needs.
 *
 * Supabase's transaction pooler (port 6543) hands each query whichever backend
 * connection is free. Prisma names its prepared statements s0, s1, … per
 * connection, so on a reused backend the next request collides with a statement
 * a previous client left behind and fails with `prepared statement "s0" already
 * exists`. `pgbouncer=true` turns prepared statements off. Without it the site
 * fails intermittently — a fresh connection works, a reused one does not — and
 * the only trace is in the database logs. That is exactly how the first
 * production deploy broke, so the URL is corrected here rather than relying on
 * every environment being configured by hand.
 *
 * Only the query string after the database name is touched; the credentials are
 * passed through byte-for-byte. It also repairs the common mistake of appending
 * `&pgbouncer=true` to a URL that had no `?`, which otherwise makes
 * `postgres&pgbouncer=true…` the database name.
 */
export function resolveDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;

  const slash = raw.lastIndexOf("/");
  if (slash === -1) return raw;

  const head = raw.slice(0, slash + 1);
  let tail = raw.slice(slash + 1);

  if (!/:6543\/$/.test(head)) return raw;

  if (!tail.includes("?") && tail.includes("&")) tail = tail.replace("&", "?");

  const params: string[] = [];
  if (!/[?&]pgbouncer=true(&|$)/.test(tail)) params.push("pgbouncer=true");
  if (!/[?&]connection_limit=/.test(tail)) params.push("connection_limit=1");

  const fixed = params.length ? `${head}${tail}${tail.includes("?") ? "&" : "?"}${params.join("&")}` : `${head}${tail}`;

  if (fixed !== raw) {
    console.warn(
      "[prisma] DATABASE_URL points at the transaction pooler without pgbouncer=true; " +
        "added it at runtime. Fix the environment variable to silence this warning."
    );
  }

  return fixed;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
