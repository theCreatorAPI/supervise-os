-- The intake session a student was invited into. Nullable: students created
-- before sessions were tracked simply have none, and lecturer and management
-- accounts never carry one.

ALTER TABLE "User" ADD COLUMN "academicSession" TEXT;

-- Indexed because every lecturer screen now filters by it.
CREATE INDEX "User_academicSession_idx" ON "User"("academicSession");
