-- CreateTable
CREATE TABLE "ActiveMatchSlot" (
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "ActiveMatchSlot_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "ActiveMatchSlot_matchId_idx" ON "ActiveMatchSlot"("matchId");

-- AddForeignKey
ALTER TABLE "ActiveMatchSlot" ADD CONSTRAINT "ActiveMatchSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveMatchSlot" ADD CONSTRAINT "ActiveMatchSlot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
