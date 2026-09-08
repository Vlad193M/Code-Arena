import { z } from "zod";

/** Shared by the `GET /api/matches` body and the socket payloads, so the two cannot drift. */
export const lobbyMatchSchema = z
  .object({
    id: z.string().meta({ example: "clx0a1b2c3d4e5f6g7h8i9j0" }),
    host: z.object({
      id: z.string().meta({ example: "clx9z8y7x6w5v4u3t2s1r0q" }),
      username: z.string().meta({ example: "ada" }),
    }),
    createdAt: z.iso.datetime().meta({ example: "2026-08-29T12:34:56.000Z" }),
  })
  .meta({ id: "LobbyMatch", description: "An open match waiting for an opponent" });
export type LobbyMatch = z.infer<typeof lobbyMatchSchema>;

export const lobbyMatchListSchema = z
  .array(lobbyMatchSchema)
  .meta({ id: "LobbyMatchList", description: "Open matches, newest first" });

export type LobbyMatchRef = Pick<LobbyMatch, "id">;

/** Sent to the one socket whose event failed, never broadcast: without it a
 * failed handler is indistinguishable from a slow one. */
export const lobbyErrorSchema = z
  .object({ message: z.string().meta({ example: "Internal server error" }) })
  .meta({
    id: "LobbyError",
    description: "A lobby event the server could not complete",
  });
export type LobbyError = z.infer<typeof lobbyErrorSchema>;

/** Broadcast to the `lobby` room; payloads carry everything a row needs to render. */
export interface LobbyServerToClientEvents {
  "lobby:matches": (matches: LobbyMatch[]) => void;
  "lobby:match_created": (match: LobbyMatch) => void;
  "lobby:match_removed": (match: LobbyMatchRef) => void;
  "lobby:error": (error: LobbyError) => void;
}

/** Subscription control only — commands go over HTTP. */
export interface LobbyClientToServerEvents {
  "lobby:subscribe": () => void;
  "lobby:unsubscribe": () => void;
}
