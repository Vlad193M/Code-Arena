import type { LobbyMatch } from "@codearena/shared";
import type { AppSocket } from "../../lib/socket";
import { getWebSocket } from "../../lib/socket";
import * as MatchService from "./match.service";

const LOBBY_ROOM = "lobby";

export function registerLobbyHandlers(socket: AppSocket) {
  socket.on("lobby:subscribe", async () => {
    /** Joining before the read leaves no window in which a new match would
     * miss both the snapshot and the broadcast. */
    await socket.join(LOBBY_ROOM);
    socket.emit("lobby:matches", await MatchService.listOpenMatches());
  });

  socket.on("lobby:unsubscribe", () => {
    socket.leave(LOBBY_ROOM);
  });
}

export function emitMatchCreated(match: LobbyMatch) {
  getWebSocket().to(LOBBY_ROOM).emit("lobby:match_created", match);
}

export function emitMatchRemoved(id: string) {
  getWebSocket().to(LOBBY_ROOM).emit("lobby:match_removed", { id });
}
