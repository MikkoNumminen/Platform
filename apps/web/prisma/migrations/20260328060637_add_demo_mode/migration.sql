-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "Forum" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "IssueReport" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "LoginStreak" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "Shout" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "UserAchievement" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "UserLevel" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "UserQuestProgress" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "UserTourProgress" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "XpTransaction" ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "DemoSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoSession_userId_idx" ON "DemoSession"("userId");

-- CreateIndex
CREATE INDEX "DemoSession_lastActiveAt_idx" ON "DemoSession"("lastActiveAt");

-- CreateIndex
CREATE INDEX "Board_sessionId_idx" ON "Board"("sessionId");

-- CreateIndex
CREATE INDEX "CalendarEvent_sessionId_idx" ON "CalendarEvent"("sessionId");

-- CreateIndex
CREATE INDEX "Forum_sessionId_idx" ON "Forum"("sessionId");

-- CreateIndex
CREATE INDEX "IssueReport_sessionId_idx" ON "IssueReport"("sessionId");

-- CreateIndex
CREATE INDEX "LoginStreak_sessionId_idx" ON "LoginStreak"("sessionId");

-- CreateIndex
CREATE INDEX "Post_sessionId_idx" ON "Post"("sessionId");

-- CreateIndex
CREATE INDEX "Shout_sessionId_idx" ON "Shout"("sessionId");

-- CreateIndex
CREATE INDEX "SurveyResponse_sessionId_idx" ON "SurveyResponse"("sessionId");

-- CreateIndex
CREATE INDEX "Thread_sessionId_idx" ON "Thread"("sessionId");

-- CreateIndex
CREATE INDEX "Topic_sessionId_idx" ON "Topic"("sessionId");

-- CreateIndex
CREATE INDEX "User_sessionId_idx" ON "User"("sessionId");

-- CreateIndex
CREATE INDEX "UserAchievement_sessionId_idx" ON "UserAchievement"("sessionId");

-- CreateIndex
CREATE INDEX "UserLevel_sessionId_idx" ON "UserLevel"("sessionId");

-- CreateIndex
CREATE INDEX "UserQuestProgress_sessionId_idx" ON "UserQuestProgress"("sessionId");

-- CreateIndex
CREATE INDEX "UserTourProgress_sessionId_idx" ON "UserTourProgress"("sessionId");

-- CreateIndex
CREATE INDEX "XpTransaction_sessionId_idx" ON "XpTransaction"("sessionId");

-- AddForeignKey
ALTER TABLE "DemoSession" ADD CONSTRAINT "DemoSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
