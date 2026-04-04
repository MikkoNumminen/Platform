-- Step 1: Add new columns to Quest
ALTER TABLE "Quest" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "Quest" ADD COLUMN "targetSkill" TEXT;
ALTER TABLE "Quest" ADD COLUMN "assigneeId" TEXT;
ALTER TABLE "Quest" ADD COLUMN "creatorId" TEXT;
ALTER TABLE "Quest" ADD COLUMN "surveyRoundId" TEXT;
ALTER TABLE "Quest" ADD COLUMN "deadline" TIMESTAMP(3);
ALTER TABLE "Quest" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Quest" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Quest" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Quest" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "Quest" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Step 2: Make key and criteria nullable
ALTER TABLE "Quest" ALTER COLUMN "key" DROP NOT NULL;
ALTER TABLE "Quest" ALTER COLUMN "criteria" DROP NOT NULL;
ALTER TABLE "Quest" ALTER COLUMN "icon" DROP NOT NULL;
ALTER TABLE "Quest" ALTER COLUMN "description" DROP NOT NULL;

-- Step 3: Migrate CustomQuest data into Quest
INSERT INTO "Quest" (id, name, description, icon, type, "xpReward", criteria, repeatable, "sortOrder", priority, "targetSkill", "assigneeId", "creatorId", "surveyRoundId", deadline, status, "completedAt", "deletedAt", "sessionId", "createdAt", "updatedAt")
SELECT id, title, description, NULL, 'assigned', "xpReward", NULL, false, 0, priority, "targetSkill", "assigneeId", "creatorId", "surveyRoundId", deadline, status, "completedAt", "deletedAt", "sessionId", "createdAt", "updatedAt"
FROM "CustomQuest";

-- Step 4: Add foreign keys
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_surveyRoundId_fkey" FOREIGN KEY ("surveyRoundId") REFERENCES "SurveyRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Add indexes
CREATE INDEX "Quest_assigneeId_idx" ON "Quest"("assigneeId");
CREATE INDEX "Quest_creatorId_idx" ON "Quest"("creatorId");
CREATE INDEX "Quest_status_idx" ON "Quest"("status");
CREATE INDEX "Quest_deletedAt_idx" ON "Quest"("deletedAt");
CREATE INDEX "Quest_sessionId_idx" ON "Quest"("sessionId");
CREATE INDEX "Quest_surveyRoundId_idx" ON "Quest"("surveyRoundId");

-- Step 6: Drop CustomQuest table
DROP TABLE "CustomQuest";
