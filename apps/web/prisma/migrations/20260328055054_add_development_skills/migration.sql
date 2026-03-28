-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "developmentSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "developmentSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];
