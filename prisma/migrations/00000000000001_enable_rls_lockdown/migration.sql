-- Deny-all Row Level Security on every application table.
--
-- Why this exists: Supabase publishes the `public` schema through PostgREST,
-- reachable by anyone holding the project's anon (publishable) key — which is
-- public by design. Tables created by Prisma Migrate have RLS disabled, so
-- without this migration the entire supervision dataset, including every
-- student's submissions and every review, would be readable and writable
-- straight from the browser with that key.
--
-- Enabling RLS without defining any policy denies all access to the `anon` and
-- `authenticated` roles. The application is unaffected: Prisma connects as the
-- `postgres` role, which owns these tables and bypasses RLS. Authorization for
-- real users continues to be enforced in the application layer by NextAuth plus
-- the per-route role checks, exactly as before.
--
-- Note this is deliberately NOT `FORCE ROW LEVEL SECURITY`: forcing it would
-- apply RLS to the owner too and lock the application out of its own tables.
--
-- If you ever start querying Supabase directly from the client with the anon
-- key, you will need real policies here instead of this blanket denial.

ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Meeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiskIndicator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TopicProposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
