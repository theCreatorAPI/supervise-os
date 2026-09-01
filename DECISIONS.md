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
