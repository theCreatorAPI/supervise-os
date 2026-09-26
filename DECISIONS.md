# Decisions & Deviations

This documents every place the implementation deviates from the original spec, and why.

## Stack substitutions

- **Database: SQLite instead of PostgreSQL.** No Postgres server was provisionable in this
  environment. The Prisma schema is provider-agnostic in structure; switching back to Postgres
  is a one-line change in `prisma/schema.prisma` (`provider = "postgresql"`) plus a
  `DATABASE_URL` pointing at a real Postgres instance, followed by `prisma migrate dev`.
- **Prisma pinned to v6.x, not v7.** v7 (current latest at build time) moved the datasource
  `url` out of `schema.prisma` and into a separate `prisma.config.ts` with driver adapters —
  a significant, very recent breaking change with thinner ecosystem documentation. v6 keeps the
  classic, widely-documented `datasource { url = env(...) }` pattern the spec assumes.
- **Next.js 16 / React 19** instead of "14+" — the spec said 14+, so the current stable major
  was used. `middleware.ts` was written using the new `proxy.ts` convention Next 16 recommends
  (functionally identical to Next.js middleware, just the current file-naming convention).
- **shadcn/ui:** the shadcn CLI (`shadcn init`) is fully interactive in its current version and
  isn't scriptable non-interactively in this environment. Since the brief explicitly asks for a
  "heavily customized, not-default-shadcn" look anyway, the UI primitives (`components/ui/*`)
  were hand-built directly on Radix UI primitives + `class-variance-authority`, styled to the
  glassmorphic/gradient system in `app/globals.css`. This gives the same accessible,
  composable-primitive foundation shadcn would have, without the generic default look.
- **Tailwind v4** (CSS-first `@theme` config, no `tailwind.config.ts`) — this is what
  `create-next-app`'s current template ships. Animation utilities (`animate-in`/`fade-in`/etc.)
  come from `tw-animate-css`, the v4-compatible successor to `tailwindcss-animate`.

## Product simplifications

- **Supervisor assignment is self-service, not a request/accept workflow.** The spec mentions
  "admin or self-service request + lecturer accept." For MVP scope, a student without a project
  picks a lecturer and a title and is immediately assigned (`app/actions/projects.ts`) —
  there's no pending/accept state in the schema. Extending this to a real request → notify
  lecturer → accept/decline flow would mean adding a `PENDING` project status and two more
  server actions; the notification plumbing already in place makes that a small follow-up.
- **Meeting completion:** any project member (student or lecturer) can call
  `toggleMeetingComplete`, but only the lecturer's UI (`/lecturer/meetings`) exposes the button,
  matching "lecturer marks complete" from the spec while keeping the action itself simple.
- **File preview:** submitted files are proxied through `/api/uploads/[submissionId]`, which
  resolves the submission from the DB, checks the requester is the project's student,
  supervisor, or an admin, then streams the file from local disk. This is the "clean
  abstraction" the spec asks for in `lib/storage.ts` — swapping to S3/Cloudinary means changing
  `saveFile`/`resolveUploadPath` and nothing else.
- **Admin read access to projects** uses its own route (`/admin/students/[projectId]`) rather
  than reusing the lecturer's project page, since the lecturer route is authorization-gated to
  the supervising lecturer only. The admin view is intentionally read-only (no review/due-date
  editing) — admins observe, lecturers act.

## Risk engine

Implemented exactly to the spec's four AT_RISK triggers and two OVERDUE escalation rules
(`lib/risk-engine.ts`). One nuance worth flagging: the "no submission in 21 days" rule is
evaluated against the single most recent submission across *all* of a project's milestones, not
per-milestone — a student who is quiet because they're simply not yet due on their next
milestone will still trip this after 21 days, per the spec's literal wording (it doesn't
condition staleness on a due date having passed). The seed data was tuned so this reads as
intended: only projects that are genuinely inactive get flagged, not students who wrapped up a
milestone early and haven't started the next one yet.

---

## Phase 2 — 2026-08-24: Cream/lemon rebrand + BRD alignment

### Rebrand

The original dark navy/electric-gradient theme was replaced twice in this phase. The first pass
followed the phase-2 brief's literal cream-background/bright-lemon-accent spec, but the result
read as loud and unpolished once actually rendered — heavy gradients, saturated yellow washes,
and glassmorphic blur don't read as "professional." On direct feedback, the palette was rebuilt
a second time around **golemon.co** as a concrete reference: clean white backgrounds, dark
charcoal ink (`#292D32`) for text, muted slate for secondary text, minimal shadows, no
glassmorphism, and a single restrained gold/lemon accent used sparingly (solid buttons, active
nav states, small icon tints) rather than as a dominant wash. `app/globals.css` now defines
`lemon`, `success`, `warn`, and `critical` color scales (each with light/base/dark shades) that
every component consumes — no hardcoded hex values remain outside the chart components, which
need literal values for Recharts' `fill` props.

### Roles & naming (BRD 2.1)

`ADMIN` → `MANAGEMENT` end-to-end: the Prisma `Role` enum value, the NextAuth session/JWT types,
`proxy.ts`'s route guard, `app/admin/*` → `app/management/*`, nav labels, and both docs. Done as
a straight rename with no compatibility shim — there's no deployed data depending on the old
value.

### Auth flow (BRD 2.2) — replaces the phase-1 self-service assignment

Rebuilt per spec: a lecturer self-registers with a staff ID and department
(`registerLecturer`), then creates student records with a matric number and email
(`createStudent`) — no password is set at creation, and the student's `User.status` is
`PENDING_ACTIVATION`. Because this environment has no outbound email, the activation link
(`/activate/[token]`) is returned directly to the lecturer in the "Add student" dialog instead of
being emailed — copy-and-share stands in for a mail server. Activating
(`activateStudent`) sets a password and flips status to `ACTIVE`. The student then creates their
own project (`createProject`) with no supervisor picker, since `User.pendingSupervisorId` — set
when the lecturer created the record — already fixes who supervises them.

### Data model (BRD 2.3)

Added `Department` (with `User.departmentId` and `Project.departmentId` relations, replacing the
old free-text `department: String?`), renamed `Feedback` → `Review` throughout, and added two new
persisted models: `RiskIndicator` (one row per active/resolved indicator per project, with
`type`, `triggeredAt`, and `status`) and `AuditEvent` (actor, project, action, description,
timestamp), logged from every mutating server action.

**Deliberately not done:** splitting `User` into separate `Student`/`Lecturer` 1:1 profile
tables. The BRD's entity list implies this, but the flat `User` model with nullable
role-specific columns (`matricNumber`, `staffId`, `maxLoad`, `pendingSupervisorId`,
`activationToken`) already captures everything the app actually queries. A real split would
touch every `include: { student: true }` / `include: { supervisor: true }` across ~15 files and
every `.name` / `.email` access on those objects, for no behavioral difference — this app never
needs to query "all Students" independent of their `User` row. Flagging it here rather than
silently skipping it: if a future requirement needs student- or lecturer-only fields that don't
belong on a shared `User` (e.g., distinct audit history, different auth providers per role),
that's the trigger to revisit this.

### Risk engine (BRD 2.4)

Rewritten to the exact five indicators and three-level scale
(`NORMAL` → `AT_RISK` → `CRITICAL`, where `AT_RISK` is exactly one active indicator and
`CRITICAL` is two-or-more or any single indicator active 35+ days). `detectIndicators` is pure
and returns each indicator's natural threshold-crossing date (e.g., a milestone's `dueDate`
itself, or `submittedAt + 21 days`) rather than "whenever a recompute happened to notice it" —
so "how long has this been active" is accurate regardless of how often recompute runs, and
survives the lack of a cron scheduler in this environment. `recomputeProjectRisk` diffs against
previously-persisted `RiskIndicator` rows to resolve cleared ones and create/refresh active ones.

One overlap worth naming: `STALE_SUBMISSION` (no submission 21+ days) and `REVIEW_OVERDUE` (a
submission under review 21+ days) share the same 21-day threshold and, when a project has only
one milestone in flight, trigger from the *same* submission event — so a lecturer who sits on a
review for 3+ weeks produces two co-occurring indicators and the project jumps straight to
`CRITICAL` rather than pausing at `AT_RISK`. That's a faithful reading of the BRD's literal rules
(both conditions really are true simultaneously), not a bug, but it means the seed data doesn't
showcase `REVIEW_OVERDUE` in isolation — demonstrating that cleanly would require a project with
a second, newer submission on a later milestone to decouple "most recent submission" from "the
stale one," which isn't worth the seed-script complexity for a demo.

### Dashboards, notifications, search, audit trail (BRD 2.5–2.8)

- Every dashboard stat card (lecturer, student, management) is now a `Link` into its underlying
  filtered list rather than static text.
- Risk-level escalation now fires notifications: `recomputeProjectRisk` compares the new level
  against the previous one and notifies the supervisor when a project's risk level increases, and
  notifies both parties when `MILESTONE_OVERDUE` or `MEETING_MISSED` newly trigger. Students also
  get a self-confirmation on submission and a supervisor-assignment notice on activation.
  Bulk/seed recomputation passes `{ silent: true }` so seeding 64+ projects doesn't flood the
  demo accounts' notification bells on first login — this is the one place escalation
  notifications are deliberately suppressed.
  Still not built: meeting edit/cancellation (no such feature exists) and pure time-based
  reminders (milestone approaching due date, upcoming meeting) — both would need a cron
  scheduler this environment doesn't have; today they only fire as a side effect of someone
  triggering a recompute (submitting, reviewing, scheduling, or changing a due date).
- Added risk-level and supervisor filters to the lecturer and management at-risk views, and a
  student/project-title search plus risk filter on the lecturer roster. Department and programme
  filters on the management side were not added — there's currently only one department
  (Computer Science) in the seed data, so a department filter would have nothing to demonstrate.
- Added a per-project activity log (`AuditLog` component) on the student and lecturer project
  views, sourced from `AuditEvent`. Management gets an aggregated 7-day activity count by action
  type instead of a raw per-project feed, per BR-010.

---

## Phase 3 — 2026-09-01: Production-readiness hardening

A full audit against a "production grade" bar surfaced 8 concrete gaps; all were fixed, in
priority order:

- **Sign-in brute-force protection.** `auth.ts`'s `authorize()` now tracks
  `User.failedLoginAttempts`/`lockedUntil` (new columns, migrated) and locks an account for 15
  minutes after 5 consecutive failures, resetting on a successful login. A dummy `bcrypt.compare`
  runs against a fixed hash when the email doesn't exist, so authorize()'s timing doesn't leak
  account existence. This is DB-backed (not in-memory), so it survives restarts and works across
  multiple server instances — the tradeoff other than a fixed lockout policy is one extra write
  per failed attempt, which is negligible.
- **Security headers.** `next.config.ts` now sets `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, and a CSP
  (`default-src 'self'`, with `'unsafe-inline'` on `script-src`/`style-src` since Next.js
  hydration relies on inline scripts and Framer Motion sets inline styles — a nonce-based CSP
  would remove this but requires per-request nonce injection in `proxy.ts`, which wasn't judged
  worth the complexity here). `poweredByHeader: false` removes the `X-Powered-By: Next.js` header.
- **Error boundaries + safe failure messages.** Added `app/error.tsx` and `app/global-error.tsx`.
  Every Server Action in `app/actions/*.ts` (14 functions across 7 files) now wraps its
  Prisma/business logic in try/catch, logging the real error server-side (`console.error`) and
  returning the existing `{ error: "..." }` state shape with a generic message — so a DB hiccup
  surfaces as a normal inline form error instead of an uncaught exception hitting the framework's
  default error UI.
- **`proxy.ts` now also gates `/api/notifications` and `/api/uploads`**, requiring a session
  before the route handler runs (both already had their own manual `auth()` checks, so this is
  defense-in-depth, not a fix for an actual hole) — `/api/auth/*` is deliberately excluded from
  the matcher since that's NextAuth's own route.
- **`trustHost: true` in `auth.ts`.** Discovered via the new e2e smoke tests: running the app with
  `next start` (production mode) instead of `next dev` throws `UntrustedHost` on every request
  unless this is set, because NextAuth v5 validates the incoming `Host` header strictly outside
  dev mode. Standard for any self-hosted/non-Vercel deployment; safe as long as the platform in
  front of the app (reverse proxy, PaaS) sets accurate Host headers rather than trusting the
  public internet directly.
- **`session.maxAge` set to 7 days** (was framework-default 30 days, unbounded in practice since
  nothing else capped it).
- **`npm audit` (3 high-severity, via `prisma`'s CLI dependency on a vulnerable `deepmerge-ts`)**:
  fixed via a package.json `overrides` pin (`deepmerge-ts: ^8.0.2`) rather than downgrading
  `prisma`/`@prisma/client` 7 minor versions to 6.12.0 (npm's suggested fix) — the vulnerable
  code path is only reachable through the `prisma` CLI's config-merging (`prisma generate`/
  `migrate`), not through `@prisma/client`, which never depends on `deepmerge-ts` and is the only
  one of the two actually running in the deployed server process. Verified `prisma generate`/
  `validate` still work correctly under the override.
- **`.env.example`** added, documenting the three required variables and the SQLite→Postgres
  swap path already described above.
- **Minimal CI** (`.github/workflows/ci.yml`): a `build` job (install, `prisma generate`,
  `tsc --noEmit`, lint, `next build`) on every push/PR, and an `e2e` job that seeds a throwaway
  SQLite DB and runs the new Playwright smoke suite against a production build.
- **First real automated tests** (`tests/smoke.spec.ts`, `playwright.config.ts`): landing page
  loads, an unknown login gets a generic rejection, all three roles can sign in and land on their
  own dashboard, a student is redirected away from a lecturer-only route, and a signed-out visitor
  is redirected to sign-in from a protected route. `playwright.config.ts` deliberately runs with
  `workers: 1` (not parallel) — running the suite in parallel against the SQLite dev datastore
  produced intermittent login failures from `SQLITE_BUSY`-style write contention under concurrent
  `authorize()` calls hitting the same file, not a real app bug. This is exactly the class of
  problem the SQLite→Postgres swap (documented above) resolves; once the app runs on Postgres in
  CI/production, `fullyParallel: true` can be restored safely.

**Two bugs surfaced by users of this phase's changes, fixed same-day:**

- The CSP's `script-src` had no `'unsafe-eval'`, which broke `next dev` outright — React's
  development-mode debugging/HMR relies on `eval()`, and the browser reported
  `eval() is not supported ... Content-Security-Policy header`. `next.config.ts` now only adds
  `'unsafe-eval'` (and `ws:` to `connect-src`, for the HMR websocket) when
  `NODE_ENV !== "production"`; the production CSP is unchanged and stays free of `unsafe-eval`.
- CI failed with `error TS2304: Cannot find name 'LayoutProps'` from the standalone
  `npx tsc --noEmit` step. `LayoutProps` (and similar route-typing helpers) are ambient types
  Next.js writes to `.next/types/` while `next build` runs — on a fresh checkout there's no
  `.next` directory yet, so a `tsc` run *before* the build can't see them. `next build` already
  performs a full type-check as part of building (visible as its own "Running TypeScript" step),
  so the fix was to delete the now-redundant standalone type-check step from
  `.github/workflows/ci.yml` rather than reorder around it. Reproduced locally by deleting both
  `.next/` and the cached `tsconfig.tsbuildinfo` before running `tsc --noEmit` — the stale
  `.tsbuildinfo` had been masking this locally, since incremental mode skipped the failing
  re-check once `.next/types` existed from an earlier build.

**Deliberately not done, and why:** a Dockerfile/`docker-compose.yml` (the natural target for a
Next.js app like this is Vercel or a similar platform that doesn't need one — adding one
speculatively for an unspecified host would be dead weight); structured error tracking/monitoring
(Sentry or equivalent) and centralized logging (needs a real third-party account/DSN this
environment can't provision); a nonce-based CSP (see above); and file-upload magic-byte sniffing
(the upload validator currently trusts the client-supplied MIME type plus a server-side extension
allowlist and random-UUID storage filenames — good enough against path traversal and drive-by
uploads, but not a substitute for a real antivirus/content-inspection pipeline if this ever
accepts uploads from untrusted external parties rather than authenticated students).

---

## Phase 4 — 2026-09-18: Supervisor flow, SEO, and a production-readiness pass

### The supervisor flow spec

A 12-screen PDF of the lecturer experience was supplied and implemented in full, on the
project's existing moss-green palette rather than the spec's blue — the blue reads as a
wireframe default, and changing the accent would have broken every other surface.

Five screens didn't exist and were built: the submissions index, meeting details,
notifications, settings, and help. Four that did exist were restructured to the spec: the
dashboard (four named stat cards, a students table, recent activity), the roster (spec filter
vocabulary, sort, current chapter, pagination), the project page (summary bar, submissions
panel), and the review screen.

The review screen was the substantive change. The spec separates *commenting* from *deciding* —
a supervisor leaves as many notes as they need, then takes one decision that closes the review.
The old `FeedbackForm` coupled the two into a single submit, so it was replaced by
`ReviewPanel` and deleted. All three buttons post one form and rely on `name="decision"` on each
submit button to put its own value into the FormData, so no client state tracks which was
pressed. `giveFeedback` now accepts a decision with no typed comment, defaulting to
"Approved." / "Corrections required.", because the spec's flow decides after commenting.

`lib/project-status.ts` centralises the three derived values every supervisor screen shows —
progress %, current chapter, and the status label. They must agree: a project reading
"82% · On Track" on one screen and "In Progress" on another is worse than either label alone.

`Meeting.actionItems` was added (nullable, migration `20260915170035_add_meeting_action_items`)
along with an `updateMeetingRecord` action and an editable form. The spec shows an Action Items
panel and there was no field for it; adding the column without a write path would have shipped
a column nothing could fill.

### Bugs found by testing the flows rather than reading them

- **The review screen's document preview never rendered.** The global CSP applied
  `frame-ancestors 'none'` to every path including `/api/uploads/*`, so the browser silently
  blocked the PDF iframe — the spec's "Document Preview" pane was dead on arrival. `next.config.ts`
  now relaxes framing to `'self'` for that one route (and `X-Frame-Options: SAMEORIGIN` alongside
  it, since browsers that still honour the older header would keep blocking). Safe there
  specifically: the route requires a session, checks the requester is the project's student, its
  supervisor, or management, and pins Content-Type to `application/pdf` or `octet-stream`, so it
  can never return HTML for the framed document to execute.
- **"Add student" wiped the form on any error.** The inputs were uncontrolled with no
  `defaultValue`, and React 19 resets a form once its action runs — so one mistyped field cleared
  all three. `createStudent` now echoes the submitted values back in its state and the dialog
  refills from them.
- **The mobile tab bar overflowed at 320px.** Five items sized by their own padding pushed the
  last one off-screen, where it couldn't be tapped. Each item now takes an equal share and
  truncates.
- **The student submissions row overflowed at 320px.** A `shrink-0` status block refused to
  compress and widened the page; the row now wraps.

### SEO and metadata

`metadataBase` plus a title template, Open Graph and Twitter card tags, keywords, canonical
links, and a `viewport` export carrying `themeColor`. `maximumScale` is deliberately 5 rather
than 1 — capping zoom locks out anyone who needs to magnify.

`app/robots.ts` and `app/sitemap.ts` expose only the three unauthenticated pages; every
dashboard segment is disallowed in robots.txt *and* carries `robots: { index: false }` on its
layout, because those URLs contain student names and project data. `app/manifest.ts` makes the
dashboards installable to a phone home screen, which is how a supervisor checking submissions
between lectures actually reaches them.

Icons are `app/icon.svg` (one SVG, crisp at every size) plus `app/apple-icon.tsx` and
`app/opengraph-image.tsx` generated from JSX at build time, so the wording and brand colours
stay in sync with the app instead of drifting from a stale binary export. Both marks are drawn
from bordered divs rather than a glyph: `ImageResponse` ships only a basic Latin font, so a
symbol character like ◎ sends it looking for a dynamic font at build time and renders tofu when
that lookup fails — which it did, visibly, on the first build.

### Security

`next` was patched 16.3.1 → 16.3.5, closing a **critical** unauthenticated RCE affecting
Windows-hosted servers (GHSA-p293-qw3h-jr36) and an RCE in the Image Optimization API via AVIF
(GHSA-2xp9-vwfh-vxw4), plus high-severity advisories in transitive `js-yaml` and `sharp`.
`npm audit` reports 0 vulnerabilities.

### Accessibility

Tap targets across the supervisor screens were measured, not eyeballed: filter chips sat at
29px, sort links at 28px, and pagination numbers were squashed to 25px wide by their flex
parent. All now clear 32px. The landing page skipped from `h1` to `h3` because the insight
section has no visible title, so it gained a screen-reader-only `h2` rather than a design change.

## Phase 5 — 2026-09-18: Supabase backend

Two things blocked deployment: the app ran on SQLite, and uploaded documents were written to
local disk. Both assume a persistent filesystem that serverless hosting does not have. Supabase
now provides Postgres and object storage; the rest of the architecture is unchanged.

### Sessions stay on NextAuth

Supabase Auth was not adopted. Sign-in is tied to university identifiers — matric numbers, staff
IDs, lecturer activation tokens, the failed-login lockout counter — and the three-role model is
enforced throughout the route tree. Moving identity to Supabase would mean rebuilding all of it
for no gain, since the database and file store are what actually needed replacing. Supabase is
infrastructure here, not the identity provider.

### Migration history was regenerated, not converted

The six SQLite migrations could not be replayed against Postgres: their DDL is SQLite-specific
(`TEXT NOT NULL PRIMARY KEY`, enums stored as free text). They were replaced by a single
Postgres baseline generated offline with `prisma migrate diff --from-empty`, which needs no live
database. No information was lost — `schema.prisma` is the source of truth and the generated
baseline reproduces it exactly, now with native Postgres enum types. The originals are recoverable
from git history.

The query layer needed no changes at all. There is no raw SQL anywhere in the codebase, and no
`contains` / `startsWith` filters — which matters, because those are case-insensitive on SQLite
and case-sensitive on Postgres, and would have silently changed search behaviour.

### Row Level Security is a deployment requirement, not an optional hardening step

Supabase publishes the `public` schema over PostgREST to anyone holding the project's anon key,
which is public by design, and tables created by Prisma Migrate have RLS disabled. Left alone,
every submission and review would have been readable and writable from a browser. Migration
`00000000000001_enable_rls_lockdown` enables RLS on all eleven tables with no policies, denying
the `anon` and `authenticated` roles outright. Prisma is unaffected because it connects as the
table owner, which bypasses RLS — deliberately not `FORCE ROW LEVEL SECURITY`, which would lock
the application out of its own data. Any new table needs the same line in the migration that
creates it.

### Documents stay behind the application's own proxy

The `submissions` bucket is private, and `/api/uploads/[submissionId]` still performs the
student/supervisor/management check before returning bytes. Public bucket URLs or signed links
would have moved authorization out of the app and into whoever holds a URL, for unpublished
student research. Keeping the proxy also meant the CSP work from Phase 4 kept applying unchanged,
since the PDF preview iframe is still same-origin.

The service-role key bypasses RLS, so it is confined to `lib/supabase-admin.ts`. The pure URL
helper moved to `lib/storage-url.ts` so that a page needing a download link has no reason to
import the module that reaches for the key — the two screens that link to documents now import
from there.

### The build no longer touches the database

`/sign-up` was being statically prerendered while querying the department list. Against a local
SQLite file that was invisible; against a network database it makes every build depend on the
database being reachable, and freezes the department list until the next deploy. It is now
`force-dynamic`. Every route that reads Postgres renders on demand, so `next build` completes
with no database at all — verified by building against a connection string pointing nowhere.

Migrations are not run during the build. They are applied deliberately with `npm run db:migrate`,
so a schema change is a decision rather than a side effect of pushing code.

### CI runs real Postgres

The SQLite `file:./ci.db` was replaced with a `postgres:16` service container, so CI exercises the
same engine as production. Storage is not provisioned there — nothing in the smoke suite touches
uploaded documents, and the seed skips its placeholder upload when the Supabase variables are
absent. Playwright stays serialized: the SQLite write-concurrency limit that originally forced
that is gone, but the suite still asserts against a single shared seeded dataset.

### Uploads go straight to storage, not through the server

Moving files to Supabase exposed a bug that predates it. The uploader advertises 25MB and
`MAX_FILE_SIZE` allows it, but submissions went through a Server Action — and Server Action
requests are capped at 1MB by default, with no `serverActions.bodySizeLimit` configured. Any real
chapter PDF would have been rejected before reaching application code. It went unnoticed because
the only file ever exercised was the 582-byte seed placeholder.

Raising the limit would have fixed self-hosting but not Vercel, where the platform caps request
bodies far below 25MB regardless of framework config. So the file no longer passes through the
server at all: `requestSubmissionUpload` authorizes the student and returns a one-shot signed URL,
the browser `PUT`s directly to Supabase, and `finalizeSubmission` records the row from the object
path alone. Small form fields are all that now cross a Server Action, so the 1MB default stops
mattering.

That hands the client a path it could tamper with, so finalize trusts two things and nothing else:
an HMAC over `(userId, milestoneId, storedName)` signed at issue time with `NEXTAUTH_SECRET`,
which means the server only accepts paths it issued for that student and milestone; and the file
size read back from storage rather than taken from the request, which doubles as proof the upload
actually happened. The HMAC is compared in constant time — a plain `===` leaks match length
through timing, which is enough to forge a signature a byte at a time. It is deliberately
stateless: a pending-upload table would need writing, expiring and cleaning up to buy nothing.

`saveFile` was deleted rather than left in place, so nothing can quietly reintroduce the
server-side path and its 1MB ceiling.

Two consequences worth remembering. The browser now talks to the storage origin directly, so that
origin has to be in `connect-src` — it is derived from `SUPABASE_URL` rather than wildcarded, so a
deployment only ever permits its own project, and an unset variable narrows the policy instead of
widening it. That also means **`SUPABASE_URL` must be present at build time**, since Next.js bakes
headers into the build output; if it is missing, uploads fail in the browser with no server-side
trace. The uploader also uses `XMLHttpRequest` rather than `fetch`, because only XHR reports
progress events, and a 25MB upload with no feedback is indistinguishable from a hung page.

## Phase 6 — 2026-09-26: Management/admin screens

The admin flow sheet specified seven primary screens plus Settings and Help. Four existed; the rest
were built to match its structure, tables and wording. As with the supervisor flow, the reference's
blue accents were not adopted — the palette stays the app's own, so these screens read as the same
product rather than a second one bolted on.

### The dashboard lost its charts

The flow sheet's dashboard is a greeting, four figures, the approval queue and recent activity. The
completion funnel and workload distribution charts that used to sit there moved to the Workload
screen, which is now where department-level aggregates live. Nothing was deleted: the charts are the
kind of thing management actually asks for, they just aren't what the dashboard is for.

### Repeated furniture became components, not copies

Five of these screens share the same pager, filter row, stat tiles, key/value summary and activity
feed. Copying that markup five times is how two tables end up disagreeing about what a status means,
so it lives in `data-pagination.tsx`, `filter-chips.tsx`, `stat-cards.tsx` and `detail-summary.tsx`.

For the same reason, the submission status derivation moved out of the supervisor screen into
`lib/submission-status.ts` and both screens now import it. A submission reading "Under Review" for a
supervisor and "Correction Required" for management would be worse than either label alone — which
is the argument `lib/project-status.ts` already makes for project status.

### Filters are links and selects, never client state

Every filter, sort and page on these screens is a URL. Chips are links; the Projects screen uses
native `<select>` elements in a GET form because the flow sheet draws dropdowns there. Nothing needs
client JavaScript, every view is shareable, and the server never ships a full table to the browser
just so it can be filtered there.

### Settings needed a third preference column

The sheet's settings screen has three switches — project activity, submission updates, meeting
updates — and the schema carried only two. `User.submissionUpdates` was added rather than pointing
two switches at one column, which would have made one of them lie. The migration is additive with a
default, so existing accounts keep alerts on.

### Attention panels state only what is true

The sheet fills its "Attention Required" and "Meetings Requiring Attention" panels with sample
counts. These compute real ones and omit a line entirely when its count is zero, rather than
rendering "0 submissions need attention". The submission overdue threshold is the risk engine's own
21 days, so this screen and the At Risk screen can never disagree about the same submission.

### Verification

The smoke suite now signs in as management and walks all eleven screens plus the lecturer and project
detail pages, asserting each heading against live seeded data. That catches a broken query or a
missing relation as a failed test rather than a 500 in production.

## Phase 7 — 2026-09-26: Lecturer flow cross-check

The updated lecturer flow sheet was compared screen by screen against what was built in Phase 4.
Most of it already matched: the student roster's filter chips and sorting, the project detail header
and its Project Status / Overall Progress / Current Chapter strip, the submissions table with its
status and date filters, the review screen's Document Preview, Review & Comments, decision buttons
and Submission History, the meetings table, the meeting record's notes and action items, and
notifications, settings and help. Those were left alone.

### Topic approval became its own flow

The one real divergence: approvals. Phase 4 decided a topic inline on the dashboard with Approve and
Reject buttons. The sheet routes them through a Project Approvals queue to a full Project Approval
Review screen, and that is the better shape — approving a topic creates the student's project and its
entire milestone set, which is not a decision to take from a list row without reading the proposal.

The dashboard now shows the count and links out. `Reject` became `Request Changes`, which is what the
action actually means: the student revises and resubmits rather than being turned away.

### Feedback is stored, not just notified

The sheet shows the supervisor's words back on the review screen after a decision — "Feedback sent to
student" — so `TopicProposal.feedback` was added. Previously the reason a topic was returned existed
only inside a notification message, which is the wrong place for it: notifications get read once and
scrolled past, and the student coming back to the screen a week later saw nothing. Requesting changes
now requires a comment; approving does not.

### The approval queue had nothing to show

Both this screen and management's "Projects Awaiting Approval" table were empty, because every seeded
student already had a project and no proposal was left pending. The seed now creates three students
whose topics are awaiting a decision — students with no project yet, which is exactly the state
approving a proposal resolves.

### The seed is not atomic

Worth knowing: `db:seed` deletes everything before rebuilding, so a connection drop partway leaves the
database half-populated — which happened twice while seeding over a flaky link, once stopping before
reviews and once before the risk recompute. There is no transaction around it. Re-running fixes it,
but it is not safe to run against anything whose data matters, which is the same reason it should
never point at a real deployment.

## Phase 8 — 2026-09-26: Academic sessions

Supervisors carry students across intakes, and a 2025 cohort has nothing to do with a 2026 one. A
session switcher in the header now scopes every supervision screen — dashboard, roster, submissions,
meetings, approvals and at-risk — to a single intake.

### The session belongs to the student, not only the project

`Project.session` already existed but was never read or filtered on, and it could not carry this on
its own: a student is invited long before they have a project, since the project is created when
their topic is approved. An invited student with no project would have belonged to no session and
disappeared from every screen including the approvals queue that is meant to show them.

So `User.academicSession` records the intake at invite time, and approving a proposal copies it onto
the project. The copy is deliberate rather than derived: a topic approved in October still belongs to
the intake the student was invited into.

The two columns are spelled differently — `User.academicSession` and `Project.session` — which is not
ideal. Renaming `Project.session` was rejected because the already-deployed build selects that column,
so the rename would have broken production between the migration running and the new build going out.

### The selection is a mode, not a query parameter

It lives in a cookie. It applies across six screens at once, and threading a parameter through every
link between them leaves one stale link able to switch cohort mid-flow without the supervisor
noticing. The trade-off is that a copied URL does not carry the session, which is the right way round:
the switcher is visible in the header on every screen, so the current intake is never ambiguous.

The fallback is the newest session the supervisor actually has people in, not the current calendar
one — a lecturer whose students are all from last year should see their students rather than an empty
screen for an intake nobody has been enrolled into yet.

### One control, not two

The switcher was first rendered twice behind responsive classes, one copy for each layout. The e2e
test caught it as a strict-mode violation, which was the test doing its job: two copies put the same
labelled control in the DOM twice, so every screen reader announced it twice however it looked. It is
now rendered once and shared.

### Management is deliberately not scoped

Management screens still show every intake at once. Their job is the department as a whole, and a
count of "Total Students" that silently excluded last year's cohort would be misleading rather than
focused. If session filtering is wanted there, it belongs as a visible filter on the tables, not as a
hidden mode.

## Phase 9 — 2026-09-26: Emailing student invitations

Adding a student now emails them the activation link, rather than leaving the supervisor to copy it
out of a dialog. The copy control stays: some students are added while sitting in the room, and a
send that quietly fails should never be the only path.

### Mail is not sent as the supervisor's address

The request was to send from the supervisor's own email. That is not deliverable. A mail server
checks the sending domain against its SPF and DKIM records, and a message claiming to be from a
university address but sent through someone else's account fails DMARC — it is dropped or filed as
spam, silently, which is worse than not sending because nobody learns that it failed.

What is sent instead carries the supervisor's **name** in the From header and their address in
**Reply-To**, through the deployment's one authenticated SMTP account. The student sees their
supervisor's name and replies land in their inbox. Only the envelope address — the part the receiving
server actually verifies — belongs to the deployment.

Invitations sent from a demo account reply to the project owner's address rather than the fake
`@demo.io` one, since nobody reads those.

Sending as real supervisor addresses would require each university domain to publish SPF/DKIM records
delegating to this sender. That is a decision for the institution, not something the app can arrange.

### A failed send never loses the invitation

The email goes out after the student row and the audit entry are written, so a delivery failure
cannot roll back an invitation that really happened. The action reports where it sent and why it
didn't, and the dialog says so plainly — green when it was emailed, amber with the reason when it was
not, and the link on screen either way. With no SMTP configured at all the feature simply skips,
which is the correct behaviour for a local checkout.

### Sent through Resend's HTTP API, not SMTP

This started on nodemailer and had to move. Installing it took the project from zero advisories to
three high-severity ones, so it was pinned to `nodemailer@^10` — which then failed the Vercel build
outright, because next-auth declares a peer range of `^7.0.7 || ^8.0.5` and a clean `npm install`
refuses the conflict. A local install had tolerated it; the build machine did not.

Resend is now called over plain `fetch`. One POST needs no SDK, and an HTTP call has no dependency to
conflict with — the mail library is gone rather than downgraded onto a vulnerable version.

The constraint to remember: until a domain is verified at resend.com/domains, Resend only accepts the
account owner's own address as a recipient and rejects everything else with a 403. Invitations to real
students will fail until then. The refusal text Resend returns is surfaced verbatim in the add-student
dialog rather than flattened into a generic error, because "verify a domain" is the actual fix and the
lecturer cannot guess it from "something went wrong".

## Phase 10 — 2026-09-26: Student flow cross-check, and demo logins

The student flow sheet was compared screen by screen. The dashboard (progress, pending actions,
upcoming meetings, the progress card with its milestone list, Next Action and Recent Activity), My
Project (overview with academic session, milestones table, project documents), Submissions (status
counts, recent submissions, action required), Submission Details in all three review states, Meetings,
Notifications, Settings and Help all already matched and were left alone.

### Project Approval was missing two of its three states

The Approval Status card only rendered once a topic had been approved. A student waiting on a decision
saw nothing, and a student asked for changes saw nothing — which is precisely when they most need the
screen to say something. All three states now render, and the supervisor's feedback appears above the
topic list, using the `TopicProposal.feedback` column added for the supervisor's approval screen.

"Rejected" is also gone from the student's view. The supervisor screen calls that action "Request
Changes"; showing the same decision as a rejection told the student something harsher than what their
supervisor did.

### The proposal cap could lock a student out

The cap counted every topic a student had ever proposed, decided or not. Three rounds of requested
changes and they could never propose again — the exact opposite of what requesting changes asks them
to do. It now counts only topics awaiting a decision.

The screen and the server action enforced this separately and had to be changed together: the page
decides whether to show the form, the action decides whether to accept it, and had only one been
fixed the form would have appeared and then refused the submission.

### Demo logins

Management was missing from the sign-in screen's demo buttons, and the sign-up screen listed no demo
accounts at all. Both now read from `lib/demo-accounts.ts`, so the two screens cannot advertise
different accounts. Sign-up lists them rather than making them clickable: signing in is the sign-in
screen's job, and duplicating that flow would mean two implementations to keep working.

Worth noting for the demo: the buttons land on the marketing page, not a dashboard, because the
sign-in screen only learns the role after the credentials come back.


## Phase 11 — 2026-09-26: Brevo SMTP, and the peer conflict fixed properly

Resend could not invite real students. Without a verified domain it accepts only the account owner's
own address and rejects everything else with a 403, which is fine for a smoke test and useless for the
feature. Brevo verifies a single sender address instead of a domain, so it delivers to anyone — tested
to two different addresses, both accepted.

SMTP is used when SMTP_HOST is set and Resend remains as a fallback, so email keeps working through a
transport swap rather than going dark between deploys.

### The peer conflict, fixed rather than dodged

nodemailer is back, and this time the resolution is pinned. next-auth declares a peerOptional range of
`^7.0.7 || ^8.0.5`; nodemailer 10 is the version where the address-parsing and file-access advisories
are fixed. The gap is closed with an npm override of `"nodemailer": "$nodemailer"`, which forces the
peer to resolve to whatever the root dependency is, rather than `legacy-peer-deps`, which would
disable peer checking for every package in the tree and hide the next real conflict.

The peer is optional and unused — next-auth needs nodemailer only for its email provider, and this app
uses the credentials provider.

Last time a local install was taken as proof the build would work, and it was not: the lockfile still
held a resolution the build machine would not reproduce. This time the check was `npm ci` into an
empty directory from package.json and package-lock.json alone, which is what Vercel actually does.
602 packages, zero vulnerabilities, exit 0.
