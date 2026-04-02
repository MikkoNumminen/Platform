-- CreateTable
CREATE TABLE "WowCharacter" (
    "id" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "realm" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "className" TEXT,
    "spec" TEXT,
    "specRole" TEXT,
    "race" TEXT,
    "itemLevel" DOUBLE PRECISION,
    "mythicPlusRating" DOUBLE PRECISION,
    "thumbnailUrl" TEXT,
    "profileUrl" TEXT,
    "lastFetchedAt" TIMESTAMP(3),
    "addedById" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WowCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WowCharacter_addedById_idx" ON "WowCharacter"("addedById");

-- CreateIndex
CREATE INDEX "WowCharacter_sessionId_idx" ON "WowCharacter"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WowCharacter_characterName_realm_region_sessionId_key" ON "WowCharacter"("characterName", "realm", "region", "sessionId");

-- AddForeignKey
ALTER TABLE "WowCharacter" ADD CONSTRAINT "WowCharacter_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
