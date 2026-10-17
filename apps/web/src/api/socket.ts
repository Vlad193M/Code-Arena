import type {
	LobbyClientToServerEvents,
	LobbyServerToClientEvents,
	MatchRoomClientToServerEvents,
	MatchRoomServerToClientEvents,
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
	LobbyServerToClientEvents & MatchRoomServerToClientEvents,
	LobbyClientToServerEvents & MatchRoomClientToServerEvents
>;

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

let socket: AppSocket | undefined;
let recovering = false;
let retryAttempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

function resetRecovery() {
	clearTimeout(retryTimer);
	retryTimer = undefined;
	retryAttempt = 0;
	recovering = false;
}

function createSocket(): AppSocket {
	const instance = io(import.meta.env.VITE_API_URL, {
		autoConnect: false,
		auth: (cb) => cb({ accessToken: getAuthState().accessToken }),
	});

	instance.on("connect", resetRecovery);
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
function handleConnectError(error: Error) {
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
	void recover();
}

/**
 * A refresh without a verdict is retried on a capped exponential backoff, so a
 * page that makes no HTTP calls still recovers once the API answers again.
 */
async function recover() {
	const outcome = await ensureRefreshed();

	if (outcome.status === "unreachable" || outcome.status === "failed") {
		console.error(`[ws] token refresh ${outcome.status}`, outcome.cause);
		scheduleRecovery();
		return;
	}
	if (outcome.status !== "refreshed") return;
	if (getAuthState().status !== "authenticated") return;

	getSocket().connect();
}

function scheduleRecovery() {
	const delay = Math.min(RETRY_BASE_MS * 2 ** retryAttempt, RETRY_MAX_MS);
	retryAttempt += 1;
	retryTimer = setTimeout(() => {
		retryTimer = undefined;
		void recover();
	}, delay);
}

/** Auth owns the connection: authenticated means connected. */
function syncWithAuth() {
	const { status } = getAuthState();

	if (status === "authenticated") {
		getSocket().connect();
	} else if (status === "anonymous") {
		resetRecovery();
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
