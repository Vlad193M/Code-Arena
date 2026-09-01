import type { LobbyMatch } from "@codearena/shared";
import { useCallback, useEffect, useReducer, useState } from "react";
import { apiClient } from "#/api/client";
import { getSocket } from "#/api/socket";
import { lobbyReducer } from "./lobbyState";

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

    /** A reconnect gets a fresh socket id, so the server no longer holds the
     * old room membership — every connect has to subscribe again. */
    socket.on("connect", subscribe);
    socket.on("lobby:matches", onSnapshot);
    socket.on("lobby:match_created", onCreated);
    socket.on("lobby:match_removed", onRemoved);

    if (socket.connected) subscribe();

    return () => {
      if (socket.connected) socket.emit("lobby:unsubscribe");
      socket.off("connect", subscribe);
      socket.off("lobby:matches", onSnapshot);
      socket.off("lobby:match_created", onCreated);
      socket.off("lobby:match_removed", onRemoved);
    };
  }, []);

  /** Commands report failure through `error`; the list itself never updates
   * here — it arrives over the broadcast, for the actor as for everyone else. */
  const run = useCallback(
    async (command: () => Promise<string | undefined>) => {
      setPending(true);
      setError(undefined);

      try {
        setError(await command());
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
        const { error: failure } = await apiClient.POST("/api/matches");
        return failure?.error;
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
        return failure?.error;
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
        return failure?.error;
      }),
    [run],
  );

  return { matches, pending, error, createMatch, joinMatch, cancelMatch };
}
