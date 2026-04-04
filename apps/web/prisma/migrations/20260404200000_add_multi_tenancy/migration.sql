-- Add tenant column to all content models (default "vuohiliitto" so existing data is tagged)

ALTER TABLE "Board" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Post" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Forum" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Topic" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Thread" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "CalendarEvent" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Shout" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "IssueReport" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "SurveyRound" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "SurveyResponse" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Feedback" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "WowCharacter" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "MythicPlusTeam" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "XpTransaction" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "UserLevel" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "UserAchievement" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Quest" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "UserQuestProgress" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "LoginStreak" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "UserTourProgress" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "AuditLog" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "Conversation" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "DirectMessage" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';

-- PlatformSetting: change from single key PK to composite (tenant, key)
ALTER TABLE "PlatformSetting" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT 'vuohiliitto';
ALTER TABLE "PlatformSetting" DROP CONSTRAINT "PlatformSetting_pkey";
ALTER TABLE "PlatformSetting" ADD CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("tenant", "key");

-- Create indexes for tenant column
CREATE INDEX "Board_tenant_idx" ON "Board"("tenant");
CREATE INDEX "Post_tenant_idx" ON "Post"("tenant");
CREATE INDEX "Forum_tenant_idx" ON "Forum"("tenant");
CREATE INDEX "Topic_tenant_idx" ON "Topic"("tenant");
CREATE INDEX "Thread_tenant_idx" ON "Thread"("tenant");
CREATE INDEX "CalendarEvent_tenant_idx" ON "CalendarEvent"("tenant");
CREATE INDEX "Shout_tenant_idx" ON "Shout"("tenant");
CREATE INDEX "IssueReport_tenant_idx" ON "IssueReport"("tenant");
CREATE INDEX "SurveyRound_tenant_idx" ON "SurveyRound"("tenant");
CREATE INDEX "SurveyResponse_tenant_idx" ON "SurveyResponse"("tenant");
CREATE INDEX "Feedback_tenant_idx" ON "Feedback"("tenant");
CREATE INDEX "WowCharacter_tenant_idx" ON "WowCharacter"("tenant");
CREATE INDEX "MythicPlusTeam_tenant_idx" ON "MythicPlusTeam"("tenant");
CREATE INDEX "XpTransaction_tenant_idx" ON "XpTransaction"("tenant");
CREATE INDEX "UserLevel_tenant_idx" ON "UserLevel"("tenant");
CREATE INDEX "UserAchievement_tenant_idx" ON "UserAchievement"("tenant");
CREATE INDEX "Quest_tenant_idx" ON "Quest"("tenant");
CREATE INDEX "UserQuestProgress_tenant_idx" ON "UserQuestProgress"("tenant");
CREATE INDEX "LoginStreak_tenant_idx" ON "LoginStreak"("tenant");
CREATE INDEX "UserTourProgress_tenant_idx" ON "UserTourProgress"("tenant");
CREATE INDEX "AuditLog_tenant_idx" ON "AuditLog"("tenant");
CREATE INDEX "Conversation_tenant_idx" ON "Conversation"("tenant");
CREATE INDEX "DirectMessage_tenant_idx" ON "DirectMessage"("tenant");
