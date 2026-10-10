import type {
	LobbyClientToServerEvents,
	LobbyServerToClientEvents,
	MatchRoomClientToServerEvents,
	MatchRoomServerToClientEvents,
} from "@codearena/shared";
import type { Server as HttpServer } from "http";
import type { DefaultEventsMap, ExtendedError, Socket } from "socket.io";
import { Server as WebSocketServer } from "socket.io";
import { z } from "zod";
import { env } from "../config/env";
import type { ErrorKind } from "./errors";
import { AppError } from "./errors";
import { authenticateToken } from "./jwt";

interface SocketData {
	userId: string;
	/** The match room this socket subscribed to, so a `disconnect` acts on the
	 * room the tab was actually in rather than wherever the player is now. */
	matchId?: string | undefined;
	active?: boolean | undefined;
}

type ClientToServerEvents = LobbyClientToServerEvents &
	MatchRoomClientToServerEvents;
type ServerToClientEvents = LobbyServerToClientEvents &
	MatchRoomServerToClientEvents;

export type AppSocketServer = WebSocketServer<
	ClientToServerEvents,
	ServerToClientEvents,
	DefaultEventsMap,
	SocketData
>;

export type AppSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	DefaultEventsMap,
	SocketData
>;

/** Feature modules register their own handlers, so `lib` stays unaware of them. */
export type SocketHandlerRegistrar = (socket: AppSocket) => void;

const handshakeAuthSchema = z.object({
	accessToken: z.string().min(1),
});

let io: AppSocketServer | undefined;

/** Only a deliberate {@link AppError} is written for the user; anything else
 * collapses so internals never cross the wire. */
function toClientError(error: unknown): { kind: ErrorKind; message: string } {
	return error instanceof AppError
		? { kind: error.kind, message: error.message }
		: { kind: "internal", message: "Internal server error" };
}

/** Socket.io forwards only `message` and `data` from a denied handshake. */
function toHandshakeError(error: unknown): ExtendedError {
	const { kind, message } = toClientError(error);

	return Object.assign(new Error(message), { data: { kind } });
}

/** Each feature namespaces its events as `"<feature>:..."` and owns a matching
 * `"<feature>:error"` channel — this is the only place that needs to know it. */
function errorEventFor(event: string): "lobby:error" | "match:error" {
	return event.startsWith("match:") ? "match:error" : "lobby:error";
}

/** Socket.io discards the promise a handler returns, so an unguarded rejection
 * reaches `unhandledRejection` and one client's failed work ends the server for
 * everyone. Every async callback in a socket context owns its promise here —
 * including the ones socket.io does not type, such as `disconnect`. */
export function runGuarded(
	label: string,
	work: () => Promise<void>,
	onError?: (error: unknown) => void,
): void {
	void Promise.resolve()
		.then(work)
		.catch((error: unknown) => {
			console.error(`❌ ${label} failed:`, error);
			onError?.(error);
		});
}

/** `runGuarded` for a typed client event, adding the reply the failing socket
 * needs. */
export function onSafe<E extends keyof ClientToServerEvents>(
	socket: AppSocket,
	event: E,
	handler: (
		...args: Parameters<ClientToServerEvents[E]>
	) => Promise<void> | void,
): void {
	const listener = (...args: Parameters<ClientToServerEvents[E]>) => {
		runGuarded(
			`Socket ${event} (user ${socket.data.userId})`,
			async () => {
				await handler(...args);
			},
			(error) => {
				socket.emit(errorEventFor(event.toString()), {
					message: toClientError(error).message,
				});
			},
		);
	};

	/** The listener type is a conditional on the event name, unresolvable while
	 * `E` is generic — only `never` is assignable to one. */
	socket.on(event, listener as never);
}

export function createWebSocketServer(
	httpServer: HttpServer,
	registrars: SocketHandlerRegistrar[] = [],
): AppSocketServer {
	io = new WebSocketServer(httpServer, {
		cors: { origin: env.FRONTEND_URL },
	});

	io.use(async (socket, next) => {
		try {
			const auth = handshakeAuthSchema.safeParse(socket.handshake.auth);
			if (!auth.success) {
				throw new AppError("unauthorized", "No token provided");
			}

			socket.data.userId = await authenticateToken(auth.data.accessToken);
			next();
		} catch (error) {
			next(toHandshakeError(error));
		}
	});

	io.on("connection", (socket) => {
		console.log(
			`🔌 Socket ${socket.id} connected (user ${socket.data.userId})`,
		);

		for (const register of registrars) {
			register(socket);
		}

		socket.on("disconnect", (reason) => {
			console.log(`🔌 Socket ${socket.id} disconnected: ${reason}`);
		});
	});

	return io;
}

export function getWebSocket(): AppSocketServer {
	if (!io) {
		throw new Error("WebSocket server is not initialized");
	}

	return io;
}
