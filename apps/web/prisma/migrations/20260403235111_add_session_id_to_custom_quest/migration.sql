-- AlterTable
ALTER TABLE "CustomQuest" ADD COLUMN "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "CustomQuest_sessionId_idx" ON "CustomQuest"("sessionId");
