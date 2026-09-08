import type { Application } from "express";
import express from "express";

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { docsRouter } from "./modules/docs/docs.routes";
import { healthRouter } from "./modules/health/health.routes";
import { matchRouter } from "./modules/match/match.routes";

export const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin:
      env.NODE_ENV === "production"
        ? "https://your-domain.com"
        : [env.FRONTEND_URL, `http://localhost:${env.PORT}`],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", healthRouter);
app.use("/api", docsRouter);
app.use("/api/auth", authRouter);
app.use("/api/matches", matchRouter);

app.use(errorMiddleware);
