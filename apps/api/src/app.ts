import type { Application } from "express";
import express from "express";

import cors from "cors";
import helmet from "helmet";
import { env } from "./cofig/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { healthRouter } from "./modules/health/health.routes";

export const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin:
      env.NODE_ENV === "production"
        ? "https://your-domain.com"
        : `${process.env.FRONTEND_URL ?? "http://localhost:3000"}`,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);

app.use(errorMiddleware);
