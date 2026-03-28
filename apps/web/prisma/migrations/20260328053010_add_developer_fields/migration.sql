-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "wantsToDevelop" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "developerTag" TEXT,
ADD COLUMN     "wantsToDevelop" BOOLEAN NOT NULL DEFAULT false;

-- Seed: tag superuser as developer lead
UPDATE "User" SET "developerTag" = 'lead', "wantsToDevelop" = true WHERE "role" = 'superuser';
