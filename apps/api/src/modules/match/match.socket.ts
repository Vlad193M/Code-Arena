import type { LobbyMatch } from "@codearena/shared";
import type { AppSocket } from "../../lib/socket";
import { getWebSocket, onSafe } from "../../lib/socket";
import * as MatchService from "./match.service";

const LOBBY_ROOM = "lobby";

export function registerLobbyHandlers(socket: AppSocket) {
  onSafe(socket, "lobby:subscribe", async () => {
    /** Joining before the read leaves no window in which a match misses both
     * the snapshot and the broadcast. It does not order the two: a broadcast
     * arriving mid-query is still overwritten by the older snapshot. */
    await socket.join(LOBBY_ROOM);
    socket.emit("lobby:matches", await MatchService.listOpenMatches());
  });

  onSafe(socket, "lobby:unsubscribe", () => {
    socket.leave(LOBBY_ROOM);
  });
}

export function emitMatchCreated(match: LobbyMatch) {
  getWebSocket().to(LOBBY_ROOM).emit("lobby:match_created", match);
}

export function emitMatchRemoved(id: string) {
  getWebSocket().to(LOBBY_ROOM).emit("lobby:match_removed", { id });
}
