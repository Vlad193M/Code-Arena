import type {
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
} from "@codearena/shared";
import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { ensureRefreshed } from "#/api/client";
import { getAuthState, subscribe } from "#/feature/auth/store";

const isServer = () => typeof window === "undefined";

/** Mirrors the payload `toHandshakeError` attaches to a denied handshake. */
const handshakeErrorSchema = z.object({
  kind: z.string(),
});

/** Mirrors the server generics, swapped: the first slot is what this side listens to. */
export type AppSocket = Socket<
  LobbyServerToClientEvents,
  LobbyClientToServerEvents
>;

let socket: AppSocket | undefined;
let recovering = false;

function createSocket(): AppSocket {
  const instance = io(import.meta.env.VITE_API_URL, {
    autoConnect: false,
    auth: (cb) => cb({ accessToken: getAuthState().accessToken }),
  });

  instance.on("connect", () => {
    recovering = false;
  });
  instance.on("connect_error", handleConnectError);

  return instance;
}

/** The one socket for this tab. Feature hooks subscribe to it, never build their own. */
export function getSocket(): AppSocket {
  if (isServer()) {
    throw new Error(
      "The socket is browser-only — guard callers with `ssr: false`.",
    );
  }

  socket ??= createSocket();

  return socket;
}

/**
 * Reopens a handshake denied over an expired access token, at most once per
 * connection episode: a middleware denial switches off socket.io's own backoff,
 * so nothing else bounds `connect_error → refresh → connect`.
 *
 * Flow and failure classes: `apps/api/docs/websocket.md`.
 */
async function handleConnectError(error: Error) {
  const instance = getSocket();
  if (instance.active) return;

  const payload = handshakeErrorSchema.safeParse(
    (error as Error & { data?: unknown }).data,
  );
  const kind = payload.success ? payload.data.kind : undefined;

  if (kind !== "unauthorized" || recovering) {
    console.error("[ws] handshake denied", kind ?? error.message);
    return;
  }

  recovering = true;

  let refreshed = false;
  try {
    refreshed = await ensureRefreshed();
  } catch (cause) {
    console.error("[ws] token refresh failed", cause);
  }

  // A failed refresh has already cleared the session; logout can also land
  // while it is in flight. Either way the socket does not decide that itself.
  if (!refreshed || getAuthState().status !== "authenticated") return;

  instance.connect();
}

/** Auth owns the connection: authenticated means connected. */
function syncWithAuth() {
  const { status } = getAuthState();

  if (status === "authenticated") {
    getSocket().connect();
  } else if (status === "anonymous") {
    recovering = false;
    getSocket().disconnect();
  }
}

let bridged = false;

/**
 * Binds the connection to auth for the lifetime of the tab. Idempotent and
 * without teardown by design: a cleanup would leave StrictMode's second mount
 * unsubscribed, and nothing outlives the bridge to care.
 */
export function startSocketBridge(): void {
  if (isServer() || bridged) return;

  bridged = true;
  subscribe(syncWithAuth);
  syncWithAuth();
}
