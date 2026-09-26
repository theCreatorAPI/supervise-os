-- Supervisor feedback on a topic proposal, shown on the approval review screen
-- after a decision. Nullable: proposals decided before this existed simply have
-- none, and an approval does not require a comment.

ALTER TABLE "TopicProposal" ADD COLUMN "feedback" TEXT;
