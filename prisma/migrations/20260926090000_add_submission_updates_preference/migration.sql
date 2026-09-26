-- Adds the third notification switch shown on the management settings screen.
-- Additive and defaulted, so existing rows keep alerts on and nothing breaks
-- for users created before this ran.

ALTER TABLE "User" ADD COLUMN "submissionUpdates" BOOLEAN NOT NULL DEFAULT true;
