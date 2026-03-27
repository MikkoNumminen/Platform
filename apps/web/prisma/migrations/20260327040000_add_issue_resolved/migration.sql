-- AlterTable
ALTER TABLE "IssueReport" ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "IssueReport_resolvedAt_idx" ON "IssueReport"("resolvedAt");
