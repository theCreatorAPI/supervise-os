-- Row Level Security on Prisma's own migration table.
--
-- It lives in the `public` schema, which Supabase publishes over PostgREST to
-- anyone holding the project's anon key. Left open, the migration history is
-- readable and writable from a browser — it leaks the schema's shape and lets an
-- anonymous caller rewrite the record of what has been applied.
--
-- Prisma is unaffected: it connects as `postgres`, which owns this table, and a
-- table owner bypasses RLS. Deliberately not FORCE, for the same reason as the
-- application tables.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
