import { app } from "./app";
import { env } from "./config/env";
import { redis } from "./db/redis.client";

async function start() {
  try {
    await redis.connect();
    const pong = await redis.ping();
    console.log(`✅ Redis connected and ping successful answer: ${pong}`);

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

start();
