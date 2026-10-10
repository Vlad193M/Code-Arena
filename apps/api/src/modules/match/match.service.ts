import type { LobbyMatch, MatchRoom } from "@codearena/shared";
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
	return {
		id: match.id,
		createdAt: match.createdAt.toISOString(),
		host: match.host,
	};
}

/** Every transaction that changes a match room runs through here, so they all
 * queue on the match row and none can reach it holding another lock. Slots
 * stay unlocked: the ordering is what this buys, not their protection. */
function withMatchLock<T>(
	matchId: string,
	fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
	return prisma.$transaction(async (tx) => {
		await tx.$queryRaw`SELECT id FROM "Match" WHERE id = ${matchId} FOR UPDATE`;

		return fn(tx);
	});
}

const matchRoomSelect = {
	id: true,
	createdAt: true,
	endsAt: true,
	status: true,
	hostId: true,
	guestId: true,
	winnerId: true,
	host: { select: { id: true, username: true } },
	guest: { select: { id: true, username: true } },
	activeMatchSlots: { select: { userId: true, ready: true } },
} satisfies Prisma.MatchSelect;

type SelectedMatchRoom = Prisma.MatchGetPayload<{
	select: typeof matchRoomSelect;
}>;

function toMatchRoom(match: SelectedMatchRoom): MatchRoom {
	const readyByUserId = new Map(
		match.activeMatchSlots.map((slot) => [slot.userId, slot.ready]),
	);

	return {
		id: match.id,
		status: match.status,
		endsAt: match.endsAt?.toISOString() ?? null,
		serverNow: new Date().toISOString(),
		winnerId: match.winnerId,
		host: {
			...match.host,
			ready: readyByUserId.get(match.hostId) ?? false,
		},
		guest: match.guest
			? { ...match.guest, ready: readyByUserId.get(match.guest.id) ?? false }
			: null,
	};
}

/** Callers inside a transaction must pass their own `tx`: the global client
 * would take a second connection and block on the lock its own caller holds. */
function readMatchRoom(
	matchId: string,
	client: Prisma.TransactionClient = prisma,
): Promise<SelectedMatchRoom | null> {
	return client.match.findUnique({
		where: { id: matchId },
		select: matchRoomSelect,
	});
}

/** The room payload for callers that have already established the match exists
 * — inside a transaction that just wrote to it. */
async function matchRoomOrThrow(
	matchId: string,
	client: Prisma.TransactionClient = prisma,
): Promise<MatchRoom> {
	return toMatchRoom(
		await client.match.findUniqueOrThrow({
			where: { id: matchId },
			select: matchRoomSelect,
		}),
	);
}

const ALREADY_IN_MATCH = "You are already in a match";
const NOT_A_PARTICIPANT = "You are not a participant in this match";

/** The one place the host-or-guest rule is stated, so the two public readers
 * and their error kinds cannot drift. */
function assertIsParticipant<
	T extends { hostId: string; guestId: string | null },
>(match: T | null, userId: string): asserts match is T {
	if (!match) {
		throw new AppError("not_found", "Match not found");
	}
	if (match.hostId !== userId && match.guestId !== userId) {
		throw new AppError("forbidden", NOT_A_PARTICIPANT);
	}
}

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
		where: { status: "WAITING", guestId: null },
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
): Promise<MatchRoom> {
	try {
		return await withMatchLock(matchId, async (tx) => {
			await tx.match.update({
				where: {
					id: matchId,
					status: "WAITING",
					guestId: null,
					hostId: { not: userId },
				},
				data: { guestId: userId },
			});

			// A host who readied while alone agreed to face nobody in particular.
			await tx.activeMatchSlot.updateMany({
				where: { matchId },
				data: { ready: false },
			});
			await tx.activeMatchSlot.create({ data: { matchId, userId } });

			return matchRoomOrThrow(matchId, tx);
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
): Promise<MatchRoom> {
	try {
		return await withMatchLock(matchId, async (tx) => {
			// `guestId: null` keeps this to matches the lobby actually lists: once
			// someone has joined, only leaving the room cancels the match, so a
			// guest can never be dropped without their room hearing about it.
			await tx.match.update({
				where: {
					id: matchId,
					hostId: userId,
					status: "WAITING",
					guestId: null,
				},
				data: { status: "CANCELLED", endedAt: new Date() },
			});

			await tx.activeMatchSlot.deleteMany({ where: { matchId } });

			return matchRoomOrThrow(matchId, tx);
		});
	} catch (error) {
		if (isRecordNotFound(error)) {
			await explainWriteFailure(matchId, userId, "cancel");
		}
		throw error;
	}
}

/** The scalar-only gate for callers that must authorize before they act but do
 * not need the room itself yet. */
export async function assertParticipant(
	matchId: string,
	userId: string,
): Promise<void> {
	assertIsParticipant(
		await prisma.match.findUnique({
			where: { id: matchId },
			select: { hostId: true, guestId: true },
		}),
		userId,
	);
}

export async function getMatchRoom(
	matchId: string,
	userId: string,
): Promise<MatchRoom> {
	const match = await readMatchRoom(matchId);
	assertIsParticipant(match, userId);

	return toMatchRoom(match);
}

const MATCH_DURATION_MS = 15 * 60 * 1000;

export async function setReady(
	matchId: string,
	userId: string,
	ready: boolean,
): Promise<MatchRoom> {
	try {
		return await withMatchLock(matchId, async (tx) => {
			const match = await readMatchRoom(matchId, tx);
			if (!match) {
				throw new AppError("not_found", "Match not found");
			}
			if (match.status !== "WAITING") {
				throw new AppError("conflict", "Match is no longer waiting to start");
			}

			await tx.activeMatchSlot.update({
				where: { userId, matchId },
				data: { ready },
			});

			const slots = match.activeMatchSlots.map((slot) =>
				slot.userId === userId ? { ...slot, ready } : slot,
			);
			const bothReady = slots.length === 2 && slots.every((slot) => slot.ready);

			if (!bothReady) {
				return toMatchRoom({ ...match, activeMatchSlots: slots });
			}

			const startedAt = new Date();
			const endsAt = new Date(startedAt.getTime() + MATCH_DURATION_MS);

			await tx.match.update({
				where: { id: matchId },
				data: { status: "IN_PROGRESS", startedAt, endsAt },
			});

			return toMatchRoom({
				...match,
				status: "IN_PROGRESS",
				endsAt,
				activeMatchSlots: slots,
			});
		});
	} catch (error) {
		if (isRecordNotFound(error)) {
			throw new AppError("forbidden", NOT_A_PARTICIPANT);
		}
		throw error;
	}
}

export type MatchRoomLeaveResult =
	| {
			event: "cancelled";
			matchId: string;
			/** `null` when a cancelled match never had a guest — there is no one left
			 * in the room to tell, only the lobby listing to clear. */
			room: MatchRoom | null;
	  }
	| {
			event: "reopened";
			matchId: string;
			room: MatchRoom;
			lobbyMatch: LobbyMatch;
	  }
	| {
			event: "forfeited";
			matchId: string;
			room: MatchRoom;
	  };

async function cancelAsHost(
	tx: Prisma.TransactionClient,
	match: SelectedMatchRoom,
): Promise<MatchRoomLeaveResult> {
	await tx.match.update({
		where: { id: match.id },
		data: { status: "CANCELLED", endedAt: new Date() },
	});
	await tx.activeMatchSlot.deleteMany({ where: { matchId: match.id } });

	return {
		event: "cancelled",
		matchId: match.id,
		room: match.guestId
			? toMatchRoom({ ...match, status: "CANCELLED", activeMatchSlots: [] })
			: null,
	};
}

async function releaseGuestSlot(
	tx: Prisma.TransactionClient,
	match: SelectedMatchRoom,
	guestId: string,
): Promise<MatchRoomLeaveResult> {
	await tx.activeMatchSlot.delete({ where: { userId: guestId } });
	await tx.activeMatchSlot.updateMany({
		where: { matchId: match.id },
		data: { ready: false },
	});
	await tx.match.update({
		where: { id: match.id },
		data: { guestId: null },
	});

	return {
		event: "reopened",
		matchId: match.id,
		room: toMatchRoom({
			...match,
			guestId: null,
			guest: null,
			activeMatchSlots: [{ userId: match.hostId, ready: false }],
		}),
		lobbyMatch: toLobbyMatch(match),
	};
}

async function forfeitAsPlayer(
	tx: Prisma.TransactionClient,
	match: SelectedMatchRoom,
	winnerId: string,
): Promise<MatchRoomLeaveResult> {
	await tx.match.update({
		where: { id: match.id },
		data: { status: "FINISHED", endedAt: new Date(), winnerId },
	});
	await tx.activeMatchSlot.deleteMany({ where: { matchId: match.id } });

	return {
		event: "forfeited",
		matchId: match.id,
		room: toMatchRoom({
			...match,
			status: "FINISHED",
			winnerId,
			activeMatchSlots: [],
		}),
	};
}

/** Shared by a deliberate `match:leave` and an expired reconnect grace period
 * — both mean the same thing to the room. Walking out of a `WAITING` room frees
 * the slot; walking out of an `IN_PROGRESS` match concedes it. A `matchId` the
 * caller no longer holds a slot in makes this a no-op, so a stale tab cannot
 * take down the match its player has since moved to. */
export async function leaveMatchRoom(
	userId: string,
	matchId: string,
): Promise<MatchRoomLeaveResult | null> {
	return withMatchLock(matchId, async (tx) => {
		const match = await readMatchRoom(matchId, tx);
		if (!match?.activeMatchSlots.some((slot) => slot.userId === userId)) {
			return null;
		}

		if (match.status === "IN_PROGRESS" && match.guestId) {
			const winnerId = userId === match.hostId ? match.guestId : match.hostId;
			return forfeitAsPlayer(tx, match, winnerId);
		}
		if (match.status !== "WAITING") {
			return null;
		}

		if (match.hostId === userId) {
			return cancelAsHost(tx, match);
		}

		return match.guestId === userId
			? releaseGuestSlot(tx, match, userId)
			: null;
	});
}

/** `null` when another caller already finished the match. */
export async function finishMatch(matchId: string): Promise<MatchRoom | null> {
	return withMatchLock(matchId, async (tx) => {
		const { count } = await tx.match.updateMany({
			where: { id: matchId, status: "IN_PROGRESS" },
			data: { status: "FINISHED", endedAt: new Date() },
		});
		if (count === 0) {
			return null;
		}

		await tx.activeMatchSlot.deleteMany({ where: { matchId } });

		return matchRoomOrThrow(matchId, tx);
	});
}

type RunningMatch = { id: string; endsAt: Date };

export async function listRunningMatches(): Promise<RunningMatch[]> {
	const matches = await prisma.match.findMany({
		where: { status: "IN_PROGRESS" },
		select: { id: true, endsAt: true },
	});

	return matches.map(({ id, endsAt }) => ({
		id,
		endsAt: endsAt ?? new Date(),
	}));
}
