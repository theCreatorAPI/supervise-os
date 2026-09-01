# Supervise OS

A Student–Lecturer Project Supervision platform. Milestones, submissions, reviews, meetings,
and automatic at-risk detection — one live view for students, lecturers, and department
management.

## Quick start

```bash
npm install
npm run db:seed   # creates the SQLite DB, runs migrations implicitly via Prisma, and seeds demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any account from
[DEMO_ACCOUNTS.md](./DEMO_ACCOUNTS.md) — everything is pre-populated, no manual setup required.
DEMO_ACCOUNTS.md also walks through the real lecturer→student→activation flow if you want to run
it yourself rather than use a pre-seeded account.

> If `prisma/dev.db` doesn't exist yet, run `npx prisma migrate dev --name init` once before
> `npm run db:seed`. A fresh clone already has migrations checked in under `prisma/migrations/`.

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript, Server Actions)
- **Styling:** Tailwind CSS v4 + a hand-built component layer on Radix UI primitives
  (`components/ui/*`) — clean white surfaces, a restrained lemon/gold accent, minimal shadows
  (see [DECISIONS.md](./DECISIONS.md) for the rebrand rationale)
- **Animation:** Framer Motion — spring-physics progress fills, the Progress Constellation,
  count-up stats, pulsing risk badges
- **Database:** SQLite via Prisma ORM (see [DECISIONS.md](./DECISIONS.md) for why, and how to
  swap to Postgres)
- **Auth:** NextAuth.js v5, credentials + JWT sessions, role-gated proxy (`proxy.ts`) for
  `/student`, `/lecturer`, `/management`
- **Forms:** React Hook Form + Zod (auth), native form actions + Zod elsewhere
- **Charts:** Recharts (completion funnel, workload distribution)
- **Notifications:** in-app bell, polled every 20s from `/api/notifications`

## Architecture

```
app/
  actions/          Server Actions — auth, projects, submissions, feedback, meetings, milestones
  activate/[token]/  public account-activation page
  api/
    auth/            NextAuth route handler
    notifications/    poll + mark-read endpoint
    uploads/[id]/     authorized file streaming (student/supervisor/management only)
  student/           student dashboard, submission flow, history, meetings
  lecturer/          lecturer dashboard, student roster, review flow, at-risk panel, meetings
  management/        department overview, workload, at-risk, students
components/
  ui/                hand-built design system primitives
  supervise/         domain components — Progress Constellation, risk badges, app shell, charts,
                     audit log, add-student / activation / project-creation forms
lib/
  risk-engine.ts     the 5-indicator / 3-level risk model — pure detection + a DB-persisting,
                     notification-firing recompute wrapper
  audit.ts           AuditEvent logging helper, called from every mutating Server Action
  storage.ts         file upload abstraction (local disk today, swappable to S3/Cloudinary)
  milestones.ts      the standard 8-step milestone template
prisma/
  schema.prisma      full data model — User/Department/Project/Milestone/Submission/Review/
                     Meeting/RiskIndicator/AuditEvent/Notification
  seed.ts            1 management user, 4 lecturers, 65 students (incl. 1 pending activation)
                     with realistic history
```

Every mutation (register, add student, activate, create project, submit, review, schedule/
complete a meeting, edit a due date) is a real Server Action with Zod validation and an
`AuditEvent` row — nothing in the demo is mocked.

## Requirement traceability

The phase-2 brief referenced BRD sections and FR/BR identifiers without including the source
document in this repo, so the mapping below is by topic/section rather than verbatim FR-00x /
BR-0xx numbers — cross-check against the actual BRD if those exact codes matter for submission.

| BRD topic | Implementation |
|---|---|
| §51 — Auth flow (lecturer registers → creates student → activation → student creates project) | `app/actions/auth.ts` (`registerLecturer`, `createStudent`, `activateStudent`), `app/actions/projects.ts` (`createProject`), `app/activate/[token]/page.tsx` |
| §49 — Data model (User, Department, Project, Milestone, Submission, Review, Meeting, Notification, RiskIndicator, AuditEvent) | `prisma/schema.prisma` — see DECISIONS.md for the one deliberate deviation (no separate Student/Lecturer profile tables) |
| §28–30 — Risk engine (5 indicators, 3-level scale) | `lib/risk-engine.ts` (`detectIndicators`, `computeRiskLevel`, `recomputeProjectRisk`) |
| §47 — Every dashboard number drills into its list | Stat cards on `/lecturer`, `/student`, `/management` are all `Link`s into filtered lists |
| §25 — Notification coverage | `lib/notify.ts` call sites across every action; see DECISIONS.md for the two time-based types not built (no cron scheduler available) |
| §36 — Search & filtering | Risk + text-search filters on `/lecturer/students`, `/management/students`; risk + supervisor filters on `/lecturer/at-risk` and `/management/at-risk` |
| §37 / BR-010 — Audit trail, role-scoped | `components/supervise/audit-log.tsx` (per-project, student/lecturer) vs. the aggregated 7-day activity counts on `/management` (no raw per-student detail) |
| Role rename: Admin → Management | `Role` enum, `app/management/*`, `proxy.ts`, nav config |

## Features checklist (mapped to the original phase-1 brief)

**Weeks 1–2 — Foundation**
- [x] Auth — lecturer self-registration with staff ID; lecturer-created, activation-gated student
      accounts (see BRD alignment above)
- [x] Supervisor assignment — fixed at student-creation time by the creating lecturer
- [x] Project profile page, created by the student post-activation (title, description,
      programme, session)
- [x] Standard 8-milestone template, lecturer-editable due dates
- [x] Document submission — drag-and-drop, versioned, PDF/DOC/DOCX up to 25MB
- [x] Lecturer review — preview, approve / return / comment-only, triggers status + notification

**Weeks 3–4 — Tracking & risk**
- [x] Notifications — bell, unread count, mark-as-read; fires on submission (both parties),
      review/feedback, milestone approval, meeting scheduling, risk escalation, and account
      activation
- [x] Supervision meetings — schedule, mark complete, missed meetings feed the risk engine
- [x] Progress Constellation on the student dashboard
- [x] Overdue milestone badges
- [x] At-risk detection engine (5 indicators, 3 levels), wired end-to-end, with a dedicated panel
      (lecturer + department) showing the specific triggered reason and how it's filtered
- [x] Supervisor workload dashboard — radial capacity rings + sortable table
- [x] Department analytics — totals, at-risk %, completion funnel, workload distribution,
      aggregated recent-activity counts
- [x] Per-project audit trail, role-scoped (detail for student/lecturer, aggregate for management)

**Week 5 — Polish**
- [x] Empty states with personality, loading skeletons, toasts
- [x] Full responsive pass, mobile bottom tab bar
- [x] Accessibility pass — semantic structure, focus states, `prefers-reduced-motion` support
- [x] `DEMO_ACCOUNTS.md` + this README, both kept current across both build phases

## Notes

- `detectIndicators` in `lib/risk-engine.ts` is pure and unit-testable in isolation;
  `recomputeProjectRisk` is the DB-touching wrapper — it persists `RiskIndicator` rows, updates
  the `Project` summary fields, and fires escalation notifications. It runs after every
  submission, review, meeting-completion toggle, and due-date edit; bulk recomputation (seeding)
  passes `{ silent: true }` to skip notifications.
- Uploaded files live in `/uploads` (gitignored, except a seed placeholder PDF used by demo
  data) and are served only through the authorization-checked API route — there is no direct
  static file path.
- There's no outbound email in this environment — the student activation link is returned
  directly to the lecturer in the "Add student" dialog instead of being emailed. Swapping in a
  real mail provider means changing one call site in `app/actions/auth.ts`.
