-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'WAITING',
    "hostId" TEXT NOT NULL,
    "guestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_status_createdAt_idx" ON "Match"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain rule: a player cannot play against themselves
ALTER TABLE "Match" ADD CONSTRAINT "match_players_distinct"
  CHECK ("guestId" <> "hostId");