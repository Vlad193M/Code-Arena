import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { redis } from "./db/redis.client";
import { installCrashHandlers } from "./lib/shutdown";
import { createWebSocketServer } from "./lib/socket";
import { registerLobbyHandlers } from "./modules/match/match.socket";

async function start() {
  try {
    await redis.connect();
    const pong = await redis.ping();
    console.log(`✅ Redis connected and ping successful answer: ${pong}`);

    const httpServer = createServer(app);
    const io = createWebSocketServer(httpServer, [registerLobbyHandlers]);

    /** `io.close` also closes the HTTP server it was attached to. */
    installCrashHandlers(async () => {
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await redis.quit();
    });

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

start();
