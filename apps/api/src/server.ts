import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { redis } from "./db/redis.client";
import { createWebSocketServer, getWebSocket } from "./lib/socket";

async function start() {
  try {
    await redis.connect();
    const pong = await redis.ping();
    console.log(`✅ Redis connected and ping successful answer: ${pong}`);

    const httpServer = createServer(app);
    createWebSocketServer(httpServer);
    const io = getWebSocket();
    io.on("connection", (socket)=> {
      console.log("connected", socket.id)
    })
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

start();
