import type { LobbyError, LobbyMatch } from "@codearena/shared";
import { lobbyMatchSchema } from "@codearena/shared";
import { useCallback, useEffect, useReducer, useState } from "react";
import { apiClient } from "#/api/client";
import { getSocket } from "#/api/socket";
import { type LobbyAction, lobbyReducer } from "./lobbyState";

export type LobbyView = {
  matches: LobbyMatch[];
  pending: boolean;
  error: string | undefined;
  createMatch: () => Promise<void>;
  joinMatch: (id: string) => Promise<void>;
  cancelMatch: (id: string) => Promise<void>;
};

export function useLobby(): LobbyView {
  const [matches, dispatch] = useReducer(lobbyReducer, []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const socket = getSocket();

    const subscribe = () => socket.emit("lobby:subscribe");
    const onSnapshot = (next: LobbyMatch[]) =>
      dispatch({ type: "snapshot", matches: next });
    const onCreated = (match: LobbyMatch) =>
      dispatch({ type: "created", match });
    const onRemoved = ({ id }: { id: string }) =>
      dispatch({ type: "removed", id });
    const onError = ({ message }: LobbyError) => setError(message);

    /** A reconnect gets a fresh socket id, so the server no longer holds the
     * old room membership — every connect has to subscribe again. */
    socket.on("connect", subscribe);
    socket.on("lobby:matches", onSnapshot);
    socket.on("lobby:match_created", onCreated);
    socket.on("lobby:match_removed", onRemoved);
    socket.on("lobby:error", onError);

    if (socket.connected) subscribe();

    return () => {
      if (socket.connected) socket.emit("lobby:unsubscribe");
      socket.off("connect", subscribe);
      socket.off("lobby:matches", onSnapshot);
      socket.off("lobby:match_created", onCreated);
      socket.off("lobby:match_removed", onRemoved);
      socket.off("lobby:error", onError);
    };
  }, []);

  /** HTTP and the socket fail independently, so a command cannot wait for the
   * broadcast to show its own result: with the socket down the button would
   * read as dead and every retry would persist another match. A command
   * applies its own outcome, and the reducer absorbs the broadcast that
   * repeats it. */
  const run = useCallback(
    async (command: () => Promise<LobbyAction | string>) => {
      setPending(true);
      setError(undefined);

      try {
        const outcome = await command();

        if (typeof outcome === "string") setError(outcome);
        else dispatch(outcome);
      } catch (cause) {
        console.error("[lobby] command failed", cause);
        setError("Connection failed");
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const createMatch = useCallback(
    () =>
      run(async () => {
        const { data, error: failure } = await apiClient.POST("/api/matches");
        if (failure) return failure.error;

        return { type: "created", match: lobbyMatchSchema.parse(data) };
      }),
    [run],
  );

  const joinMatch = useCallback(
    (id: string) =>
      run(async () => {
        const { error: failure } = await apiClient.POST(
          "/api/matches/{id}/join",
          { params: { path: { id } } },
        );
        return failure ? failure.error : { type: "removed", id };
      }),
    [run],
  );

  const cancelMatch = useCallback(
    (id: string) =>
      run(async () => {
        const { error: failure } = await apiClient.POST(
          "/api/matches/{id}/cancel",
          { params: { path: { id } } },
        );
        return failure ? failure.error : { type: "removed", id };
      }),
    [run],
  );

  return { matches, pending, error, createMatch, joinMatch, cancelMatch };
}
