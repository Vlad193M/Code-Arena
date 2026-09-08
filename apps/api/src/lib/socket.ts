import type {
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
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
}

export type AppSocketServer = WebSocketServer<
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  DefaultEventsMap,
  SocketData
>;

export type AppSocket = Socket<
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
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

/** Socket.io discards the promise a handler returns, so an unguarded rejection
 * reaches `unhandledRejection` and one client's failed event ends the server
 * for everyone. */
export function onSafe<E extends keyof LobbyClientToServerEvents>(
  socket: AppSocket,
  event: E,
  handler: (
    ...args: Parameters<LobbyClientToServerEvents[E]>
  ) => Promise<void> | void,
): void {
  const listener = (...args: Parameters<LobbyClientToServerEvents[E]>) => {
    Promise.resolve()
      .then(() => handler(...args))
      .catch((error: unknown) => {
        console.error(
          `❌ Socket ${event} failed (user ${socket.data.userId}):`,
          error,
        );
        socket.emit("lobby:error", { message: toClientError(error).message });
      });
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
    console.log(`🔌 Socket ${socket.id} connected (user ${socket.data.userId})`);

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
