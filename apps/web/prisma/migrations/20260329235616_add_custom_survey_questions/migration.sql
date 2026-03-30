-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "customAnswers" JSONB;

-- AlterTable
ALTER TABLE "SurveyRound" ADD COLUMN     "customQuestions" JSONB,
ADD COLUMN     "deadline" TIMESTAMP(3);
