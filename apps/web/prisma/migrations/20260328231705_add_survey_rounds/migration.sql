-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "roundId" TEXT;

-- CreateTable
CREATE TABLE "SurveyRound" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "creatorId" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomQuest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assigneeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "surveyRoundId" TEXT,
    "deadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomQuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyRound_number_key" ON "SurveyRound"("number");

-- CreateIndex
CREATE INDEX "SurveyRound_status_idx" ON "SurveyRound"("status");

-- CreateIndex
CREATE INDEX "SurveyRound_creatorId_idx" ON "SurveyRound"("creatorId");

-- CreateIndex
CREATE INDEX "CustomQuest_assigneeId_idx" ON "CustomQuest"("assigneeId");

-- CreateIndex
CREATE INDEX "CustomQuest_creatorId_idx" ON "CustomQuest"("creatorId");

-- CreateIndex
CREATE INDEX "CustomQuest_status_idx" ON "CustomQuest"("status");

-- CreateIndex
CREATE INDEX "CustomQuest_deletedAt_idx" ON "CustomQuest"("deletedAt");

-- CreateIndex
CREATE INDEX "CustomQuest_deadline_idx" ON "CustomQuest"("deadline");

-- CreateIndex
CREATE INDEX "CustomQuest_surveyRoundId_idx" ON "CustomQuest"("surveyRoundId");

-- CreateIndex
CREATE INDEX "SurveyResponse_roundId_idx" ON "SurveyResponse"("roundId");

-- AddForeignKey
ALTER TABLE "SurveyRound" ADD CONSTRAINT "SurveyRound_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "SurveyRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuest" ADD CONSTRAINT "CustomQuest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuest" ADD CONSTRAINT "CustomQuest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuest" ADD CONSTRAINT "CustomQuest_surveyRoundId_fkey" FOREIGN KEY ("surveyRoundId") REFERENCES "SurveyRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
