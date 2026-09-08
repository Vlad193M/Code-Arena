import type { LobbyMatch } from "@codearena/shared";
import { prisma } from "../../db/prisma.client";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/errors";

const lobbyMatchSelect = {
  id: true,
  createdAt: true,
  host: { select: { id: true, username: true } },
} satisfies Prisma.MatchSelect;

type SelectedMatch = Prisma.MatchGetPayload<{
  select: typeof lobbyMatchSelect;
}>;

function toLobbyMatch(match: SelectedMatch): LobbyMatch {
  return { ...match, createdAt: match.createdAt.toISOString() };
}

const ALREADY_IN_MATCH = "You are already in a match";

/** The only unique constraint either write can break is the one active slot a
 * player is allowed, so `P2002` always means the same thing here. */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Neither guarded update nests a relation, so `P2025` can only be the row the
 * write was aimed at failing to match. */
function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

async function explainWriteFailure(
  matchId: string,
  userId: string,
  action: "join" | "cancel",
): Promise<never> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { hostId: true, status: true },
  });

  if (!match) {
    throw new AppError("not_found", "Match not found");
  }
  if (action === "join" && match.hostId === userId) {
    throw new AppError("validation", "You cannot join your own match");
  }
  if (action === "cancel" && match.hostId !== userId) {
    throw new AppError("forbidden", "Only the host can cancel this match");
  }

  throw new AppError(
    "conflict",
    action === "join"
      ? "Match is no longer joinable"
      : "Match is no longer open",
  );
}

export async function listOpenMatches(): Promise<LobbyMatch[]> {
  const matches = await prisma.match.findMany({
    where: { status: "WAITING" },
    orderBy: { createdAt: "desc" },
    select: lobbyMatchSelect,
  });

  return matches.map(toLobbyMatch);
}

export async function createMatch(hostId: string): Promise<LobbyMatch> {
  try {
    const match = await prisma.match.create({
      data: { hostId, activeMatchSlots: { create: { userId: hostId } } },
      select: lobbyMatchSelect,
    });

    return toLobbyMatch(match);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("conflict", ALREADY_IN_MATCH);
    }
    throw error;
  }
}

export async function joinMatch(
  matchId: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: {
          id: matchId,
          status: "WAITING",
          guestId: null,
          hostId: { not: userId },
        },
        data: { guestId: userId, status: "IN_PROGRESS", startedAt: new Date() },
      });

      await tx.activeMatchSlot.create({ data: { matchId, userId } });
    });
  } catch (error) {
    if (isRecordNotFound(error)) {
      await explainWriteFailure(matchId, userId, "join");
    }
    if (isUniqueViolation(error)) {
      throw new AppError("conflict", ALREADY_IN_MATCH);
    }
    throw error;
  }
}

export async function cancelMatch(
  matchId: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId, hostId: userId, status: "WAITING" },
        data: { status: "CANCELLED", endedAt: new Date() },
      });

      await tx.activeMatchSlot.deleteMany({ where: { matchId } });
    });
  } catch (error) {
    if (isRecordNotFound(error)) {
      await explainWriteFailure(matchId, userId, "cancel");
    }
    throw error;
  }
}
