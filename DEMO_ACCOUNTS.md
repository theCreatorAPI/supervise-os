# Demo Accounts

All seeded accounts share the password:

```
password123
```

## Management

| Name | Email |
|---|---|
| Dr. Folasade Bankole (Head of Department) | `management@demo.io` |

## Lecturers

| Name | Email | Staff ID | Students supervised |
|---|---|---|---|
| Dr. Amara Chen (Senior Lecturer) | `lecturer1@demo.io` | STF-10231 | 21 |
| Dr. Kwabena Mensah (Lecturer) | `lecturer2@demo.io` | STF-10456 | 8 |
| Dr. Ifeoma Okafor (Associate Professor) | `lecturer3@demo.io` | STF-10789 | 24 — over her capacity of 20, on purpose |
| Dr. Ricardo Reyes (Lecturer) | `lecturer4@demo.io` | STF-11024 | 11 |

## Students

64 active students, `student1@demo.io` through `student64@demo.io`, matric numbers
`CSC/2022/001`–`CSC/2022/064`. The first four students under each lecturer are hand-tuned to
demonstrate every dashboard state:

1. **Normal** — steady milestone approvals, one fresh submission awaiting review.
2. **At risk** — the same milestone returned twice in a row (`REPEATED_RETURNS`).
3. **Critical** — no submission in 35+ days and a missed supervision meeting (two indicators).
4. **At risk** — a milestone's due date has passed without approval (`MILESTONE_OVERDUE`).

The remaining students per lecturer are lighter "filler" records with realistic but simpler
progress, mostly Normal, so every list and chart looks populated without every project being a
hand-scripted edge case.

`lecturer4@demo.io`'s first student is instead a fully **defended** project (`DEFENDED` status,
every milestone approved) to show project completion.

**One student is seeded mid-activation** to demonstrate the lecturer→student→activation flow
without you having to run it yourself: `student.pending@demo.io`, matric `CSC/2022/999`, has no
password yet. Visit `/activate/demo-activation-token` to set one and sign in.

## Try the real flow yourself

1. Sign in as `lecturer1@demo.io` → `/lecturer/students` → **Add student**. Fill in a name,
   matric number, and email — you'll get an activation link back immediately (in a real
   deployment this would be emailed; here it's shown directly since there's no mail server).
2. Open that link in a new tab (or copy it — it's a normal `/activate/[token]` route), set a
   password, and sign in as the new student.
3. The student's dashboard prompts them to fill in their project (title, description,
   programme, session) — no supervisor picker, since the lecturer who created them is already
   their supervisor.

## Fastest way to see everything

1. `lecturer1@demo.io` → `/lecturer` for the dashboard (21 students / awaiting review / a mix of
   Critical, At Risk, and Normal — matching the brief's style).
2. `/lecturer/at-risk` for the risk panel with reasons spelled out per student, filterable by
   Critical / At Risk.
3. `student1@demo.io` → `/student` for the Progress Constellation, recent feedback, and the
   per-project activity log.
4. `management@demo.io` → `/management/workload` for the radial capacity rings
   (21 / 8 / 24 / 11 across the four lecturers, matching the brief's example numbers exactly),
   and `/management` for the aggregated department activity feed.
