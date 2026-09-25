import type { LobbyMatch, MatchRoom } from "@codearena/shared";
import type { AppSocket } from "../../lib/socket";
import { getWebSocket, onSafe, runGuarded } from "../../lib/socket";
import { matchIdEventSchema, readyEventSchema } from "./match.schemas";
import type { MatchRoomLeaveResult } from "./match.service";
import * as MatchService from "./match.service";

const LOBBY_ROOM = "lobby";
const RECONNECT_GRACE_MS = 10_000;

/**
 * Every emit and every snapshot read shares this chain, lobby and match room
 * alike, so a subscriber never receives a state older than one it already had.
 * The reads ride it too, which is why a subscriber's query briefly delays
 * unrelated broadcasts — acceptable while the rooms are few.
 *
 * One process only: a second API instance holds its own chain, and nothing
 * orders the two. That case needs a version on the snapshot, not a queue.
 */
let sequencedWork: Promise<unknown> = Promise.resolve();

function sequenced<T>(task: () => T | Promise<T>): Promise<T> {
	const next = sequencedWork.then(task, task);
	sequencedWork = next.catch(() => undefined);

	return next;
}

/** A broadcast has no caller to report to, so a lost one is logged, not thrown. */
function broadcast(emit: () => void): void {
	void sequenced(emit).catch((error: unknown) => {
		console.error("❌ Broadcast failed:", error);
	});
}

export function registerLobbyHandlers(socket: AppSocket) {
	onSafe(socket, "lobby:subscribe", () =>
		sequenced(async () => {
			await socket.join(LOBBY_ROOM);
			socket.emit("lobby:matches", await MatchService.listOpenMatches());
		}),
	);

	onSafe(socket, "lobby:unsubscribe", () => {
		socket.leave(LOBBY_ROOM);
	});
}

export function emitMatchCreated(match: LobbyMatch) {
	broadcast(() => {
		getWebSocket().to(LOBBY_ROOM).emit("lobby:match_created", match);
	});
}

export function emitMatchRemoved(id: string) {
	broadcast(() => {
		getWebSocket().to(LOBBY_ROOM).emit("lobby:match_removed", { id });
	});
}

function userRoomName(userId: string) {
	return `user:${userId}`;
}

function matchRoomName(matchId: string) {
	return `match:${matchId}`;
}

function emitMatchRoom(room: MatchRoom): void {
	broadcast(() => {
		getWebSocket().to(matchRoomName(room.id)).emit("match:room", room);
	});
}

/** Joining and cancelling both take the match off the lobby listing and leave
 * the room with new state to render, so the HTTP commands fan out here rather
 * than deciding it in the controller. */
export function broadcastMatchClosed(room: MatchRoom): void {
	emitMatchRoom(room);
	emitMatchRemoved(room.id);
}

/** The one participant left behind learns the same way regardless of whether
 * the other side clicked "leave" or simply dropped off the socket. */
function broadcastLeave(result: MatchRoomLeaveResult): void {
	const { room } = result;

	if (room) {
		broadcast(() => {
			const target = getWebSocket().to(matchRoomName(result.matchId));

			target.emit("match:opponent_left");
			target.emit("match:room", room);
		});
	}

	if (result.event === "reopened") {
		emitMatchCreated(result.lobbyMatch);
	} else {
		emitMatchRemoved(result.matchId);
	}
}

/** Drops this socket's claim on a match. Only a deliberate leave does this:
 * `match:unsubscribe` keeps the claim, because navigating off the page stops
 * the broadcasts without giving up the slot. */
function leaveRoomMembership(socket: AppSocket, matchId: string): void {
	socket.leave(matchRoomName(matchId));
	socket.leave(userRoomName(socket.data.userId));
	socket.data.matchId = undefined;
}

export function registerMatchRoomHandlers(socket: AppSocket) {
	onSafe(socket, "match:subscribe", async (rawMatchId) => {
		const matchId = matchIdEventSchema.parse(rawMatchId);
		const { userId } = socket.data;

		/** Authorized before anything is mutated: joining first would leak
		 * broadcasts to a stranger, and claiming `matchId` first would drop this
		 * socket's hold on the match it is really in. */
		await MatchService.assertParticipant(matchId, userId);

		await sequenced(async () => {
			await socket.join([matchRoomName(matchId), userRoomName(userId)]);
			socket.data.matchId = matchId;

			socket.emit(
				"match:room",
				await MatchService.getMatchRoom(matchId, userId),
			);
		});
	});

	onSafe(socket, "match:unsubscribe", (rawMatchId) => {
		socket.leave(matchRoomName(matchIdEventSchema.parse(rawMatchId)));
	});

	onSafe(socket, "match:set_ready", async (rawMatchId, rawReady) => {
		const matchId = matchIdEventSchema.parse(rawMatchId);
		const room = await MatchService.setReady(
			matchId,
			socket.data.userId,
			readyEventSchema.parse(rawReady),
		);
		emitMatchRoom(room);
	});

	onSafe(socket, "match:leave", async (rawMatchId) => {
		const matchId = matchIdEventSchema.parse(rawMatchId);
		/** The socket only ever leaves the room it subscribed to, so a mismatch is
		 * a stale tab and not worth a transaction. The service checks again under
		 * the lock for callers this one cannot vouch for. */
		if (socket.data.matchId !== matchId) {
			return;
		}

		const result = await MatchService.leaveMatchRoom(
			socket.data.userId,
			matchId,
		);

		leaveRoomMembership(socket, matchId);
		if (result) broadcastLeave(result);
	});

	socket.on("disconnect", () => {
		const { userId, matchId } = socket.data;
		if (!matchId) {
			return;
		}

		const timer = setTimeout(() => {
			runGuarded(`Match room disconnect (user ${userId})`, async () => {
				const sockets = await getWebSocket()
					.in(userRoomName(userId))
					.fetchSockets();
				if (sockets.length > 0) {
					return;
				}

				const result = await MatchService.leaveMatchRoom(userId, matchId);
				if (result) broadcastLeave(result);
			});
		}, RECONNECT_GRACE_MS);

		timer.unref();
	});
}
