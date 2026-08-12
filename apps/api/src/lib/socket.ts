import type { Server as HttpServer } from "http";
import type { DefaultEventsMap, ExtendedError } from "socket.io";
import { Server as WebSocketServer } from "socket.io";
import { z } from "zod";
import { env } from "../config/env";
import { AppError } from "./errors";
import { authenticateToken } from "./jwt";

interface SocketData {
  userId: string;
}

export type AppSocketServer = WebSocketServer<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

const handshakeAuthSchema = z.object({
  accessToken: z.string().min(1),
});

let io: AppSocketServer | undefined;

/** Socket.io only forwards `message` and `data` to the client, so unknown
 * failures are flattened to avoid leaking internals over the handshake. */
function toHandshakeError(error: unknown): ExtendedError {
  const { kind, message } =
    error instanceof AppError
      ? error
      : { kind: "internal" as const, message: "Internal server error" };

  return Object.assign(new Error(message), { data: { kind } });
}

export function createWebSocketServer(httpServer: HttpServer): AppSocketServer {
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

  return io;
}

export function getWebSocket(): AppSocketServer {
  if (!io) {
    throw new Error("WebSocket server is not initialized");
  }

  return io;
}
