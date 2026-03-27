-- CreateTable
CREATE TABLE "Shout" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shout_createdAt_idx" ON "Shout"("createdAt");

-- CreateIndex
CREATE INDEX "Shout_authorId_idx" ON "Shout"("authorId");

-- AddForeignKey
ALTER TABLE "Shout" ADD CONSTRAINT "Shout_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
