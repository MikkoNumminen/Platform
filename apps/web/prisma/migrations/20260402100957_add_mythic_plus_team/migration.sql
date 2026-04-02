-- CreateTable
CREATE TABLE "MythicPlusTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tankId" TEXT,
    "healerId" TEXT,
    "dps1Id" TEXT,
    "dps2Id" TEXT,
    "dps3Id" TEXT,
    "creatorId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MythicPlusTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MythicPlusTeam_creatorId_idx" ON "MythicPlusTeam"("creatorId");

-- CreateIndex
CREATE INDEX "MythicPlusTeam_sessionId_idx" ON "MythicPlusTeam"("sessionId");

-- AddForeignKey
ALTER TABLE "MythicPlusTeam" ADD CONSTRAINT "MythicPlusTeam_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "WowCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MythicPlusTeam" ADD CONSTRAINT "MythicPlusTeam_healerId_fkey" FOREIGN KEY ("healerId") REFERENCES "WowCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MythicPlusTeam" ADD CONSTRAINT "MythicPlusTeam_dps1Id_fkey" FOREIGN KEY ("dps1Id") REFERENCES "WowCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MythicPlusTeam" ADD CONSTRAINT "MythicPlusTeam_dps2Id_fkey" FOREIGN KEY ("dps2Id") REFERENCES "WowCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MythicPlusTeam" ADD CONSTRAINT "MythicPlusTeam_dps3Id_fkey" FOREIGN KEY ("dps3Id") REFERENCES "WowCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MythicPlusTeam" ADD CONSTRAINT "MythicPlusTeam_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
