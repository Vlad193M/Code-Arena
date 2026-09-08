import type { LobbyMatch } from "@codearena/shared";
import type { AppSocket } from "../../lib/socket";
import { getWebSocket, onSafe } from "../../lib/socket";
import * as MatchService from "./match.service";

const LOBBY_ROOM = "lobby";

/**
 * Snapshot reads and broadcasts run one after another, never interleaved.
 * Joining the room first leaves no window in which a match misses both the
 * snapshot and the broadcast; the queue adds the ordering, so an event raised
 * mid-query is delivered after the older snapshot instead of under it.
 *
 * One process only: a second API instance holds its own chain, and nothing
 * orders the two. That case needs a version on the snapshot, not a queue.
 */
let lobbyQueue: Promise<unknown> = Promise.resolve();

function sequenced<T>(task: () => T | Promise<T>): Promise<T> {
  const next = lobbyQueue.then(task, task);
  lobbyQueue = next.catch(() => undefined);

  return next;
}

/** A broadcast has no caller to report to, so a lost one is logged, not thrown. */
function broadcast(emit: () => void): void {
  void sequenced(emit).catch((error: unknown) => {
    console.error("❌ Lobby broadcast failed:", error);
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
