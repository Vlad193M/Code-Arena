import type { LobbyMatch } from "@codearena/shared";
import { prisma } from "../../db/prisma.client";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/errors";

const lobbyMatchSelect = {
  id: true,
  createdAt: true,
  host: { select: { id: true, username: true } },
} satisfies Prisma.MatchSelect;

type SelectedMatch = Prisma.MatchGetPayload<{ select: typeof lobbyMatchSelect }>;

function toLobbyMatch(match: SelectedMatch): LobbyMatch {
  return { ...match, createdAt: match.createdAt.toISOString() };
}

/**
 * Turns a zero-row write into a precise error. Only runs on the failing path,
 * so the successful command still costs a single statement.
 */
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
  const match = await prisma.match.create({
    data: { hostId },
    select: lobbyMatchSelect,
  });

  return toLobbyMatch(match);
}

/**
 * The `where` clause carries the whole precondition, so concurrent joins are
 * resolved by Postgres: the loser updates zero rows instead of overwriting.
 */
export async function joinMatch(
  matchId: string,
  userId: string,
): Promise<void> {
  const { count } = await prisma.match.updateMany({
    where: {
      id: matchId,
      status: "WAITING",
      guestId: null,
      hostId: { not: userId },
    },
    data: { guestId: userId, status: "IN_PROGRESS", startedAt: new Date() },
  });

  if (count === 0) {
    await explainWriteFailure(matchId, userId, "join");
  }
}

export async function cancelMatch(
  matchId: string,
  userId: string,
): Promise<void> {
  const { count } = await prisma.match.updateMany({
    where: { id: matchId, hostId: userId, status: "WAITING" },
    data: { status: "CANCELLED", endedAt: new Date() },
  });

  if (count === 0) {
    await explainWriteFailure(matchId, userId, "cancel");
  }
}
