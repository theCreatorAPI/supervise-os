# Supabase setup

Supervise OS uses Supabase for two things: **Postgres** (all application data, via
Prisma) and **Storage** (submitted chapter documents). Everything else is
unchanged.

Sessions are **not** Supabase Auth. The app keeps NextAuth with a credentials
provider, because the sign-in flow is tied to university identifiers — matric
numbers, staff IDs, lecturer activation tokens and the account lockout counter —
none of which map onto Supabase's user model without rebuilding the role system.
Supabase is the database and file store here, not the identity provider.

---

## 1. Create the project

In the [Supabase dashboard](https://supabase.com/dashboard), create a project and
choose a region close to where the app will be deployed. Save the database
password shown at creation — it appears in both connection strings below and
cannot be retrieved later, only reset.

## 2. Collect the connection strings

**Project Settings → Database → Connection string.** You need two, both pointing
at the same database:

| Variable       | Port   | Used by            |
| -------------- | ------ | ------------------ |
| `DATABASE_URL` | `6543` | The app at runtime |
| `DIRECT_URL`   | `5432` | Prisma Migrate     |

`DATABASE_URL` must be the **transaction pooler** and must carry
`?pgbouncer=true&connection_limit=1`. Serverless functions open a connection per
invocation, so unpooled traffic exhausts the database's connection limit under
load. The `pgbouncer=true` flag stops Prisma using prepared statements, which the
transaction pooler cannot keep across statements — omit it and you get
intermittent `prepared statement "s0" already exists` errors that only appear
under concurrency.

`DIRECT_URL` must be a **direct session** connection. Prisma Migrate takes
advisory locks and runs DDL, neither of which survives the transaction pooler.
Nothing at request time uses it.

## 3. Create the storage bucket

**Storage → New bucket**, named `submissions`:

- **Private.** Not public — this matters. Submissions are unpublished student
  research, and a public bucket makes every document readable by anyone who has
  or guesses the URL. The app never links to storage directly; it serves files
  through `/api/uploads/[submissionId]`, which checks that the caller is the
  student who owns the work, their supervisor, or management before returning any
  bytes.
- **File size limit:** 25 MB, matching `MAX_FILE_SIZE` in `lib/storage.ts`.
- **Allowed MIME types:** `application/pdf`, `application/msword`,
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

## 4. Collect the API keys

**Project Settings → API** gives the project URL and the service-role key.

The service-role key bypasses Row Level Security completely. It is read only by
`lib/supabase-admin.ts`, which is reachable from Server Actions and Route Handlers
and nothing else. Never give it a `NEXT_PUBLIC_` prefix, and never import
`lib/storage.ts` from a Client Component — pages that only need a download link
import `lib/storage-url.ts`, which has no Supabase dependency, precisely so that
importing a URL helper can't pull the key into a browser bundle.

### How uploads reach the bucket

Students do **not** upload through the server. `requestSubmissionUpload` authorizes
the student, then issues a one-shot signed URL; the browser `PUT`s the file
straight to Supabase and calls `finalizeSubmission` with only the object path.

This is not an optimization. Server Action requests are capped at 1MB by default,
and serverless platforms cap request bodies well below the 25MB this app accepts,
so a real chapter PDF sent through the action would be rejected before any
application code ran.

Because the client is the only party that sees the file, two things are checked
server-side on finalize: the returned path must carry an HMAC the server issued
for that student and milestone (so a submission cannot be pointed at an arbitrary
object), and the recorded file size is read back from storage rather than taken
from the request.

**`SUPABASE_URL` must be set at build time.** The browser now talks directly to
the storage origin, so it has to appear in the Content Security Policy —
`next.config.ts` derives it from that variable, and Next.js bakes headers into the
build output. If it is missing when `next build` runs, the deployed CSP will omit
the origin and every upload fails with a console error and no server-side trace.

## 5. Set environment variables

Copy `.env.example` to `.env` and fill it in. Every variable there is required
except `SUPABASE_STORAGE_BUCKET`, which defaults to `submissions`.

For Vercel, add the same values under **Project Settings → Environment
Variables**, with two changes:

- `NEXTAUTH_SECRET` — generate a **fresh** one with `openssl rand -base64 32`.
  Do not reuse the development value.
- `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` — set both to the real deployed
  origin. If `NEXT_PUBLIC_SITE_URL` is wrong, shared links preview against
  localhost and `robots.txt` and `sitemap.xml` emit localhost URLs.

## 6. Apply the schema

```bash
npm run db:migrate   # prisma migrate deploy
npm run db:seed      # demo data — skip for a real deployment
```

Two migrations apply: the schema itself, and a Row Level Security lockdown.

The lockdown matters. Supabase exposes the `public` schema over PostgREST to
anyone holding the project's anon key, which is public by design, and tables
created by Prisma have RLS disabled. Without
`00000000000001_enable_rls_lockdown`, the whole dataset is readable and writable
from a browser with that key. Enabling RLS with no policies denies the `anon` and
`authenticated` roles while leaving the app unaffected, since Prisma connects as
the table owner. **Any new table needs the same treatment** — add
`ALTER TABLE "NewTable" ENABLE ROW LEVEL SECURITY;` to the migration that creates
it.

`npm run db:seed` writes demo accounts with the password `password123`. Never run
it against an environment real people use.

---

## Deploying to Vercel

`next build` succeeds without a reachable database — verified by building against
a connection string pointing nowhere. Every route that reads Postgres renders on
demand, because each dashboard layout calls `auth()` and `/sign-up` is explicitly
`force-dynamic`.

Next.js still *attempts* those queries while probing whether a route can be
prerendered, so a build log shows connection errors when the database is
unreachable, and a Vercel build will open real connections briefly. Both are
harmless: the results are discarded and the routes render per request either way.

`prisma generate` runs from `postinstall`, which Vercel's dependency caching
otherwise skips.

Migrations are deliberately **not** run during the build. Deploy, then apply them
with `npm run db:migrate` pointed at the production `DIRECT_URL`, so that a schema
change is a decision someone makes rather than a side effect of pushing code.

## Local development

Local development now needs a real Postgres instance; the SQLite file is gone.
Either point `.env` at a Supabase project (a second, free "dev" project keeps
production data clean) or run Postgres locally:

```bash
docker run --name supervise-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

With local Postgres, set both `DATABASE_URL` and `DIRECT_URL` to
`postgresql://postgres:postgres@localhost:5432/postgres`. Leave the Supabase
storage variables unset and the seed will skip its placeholder upload; uploading a
document in the UI will then fail until they are set, but everything else works.
