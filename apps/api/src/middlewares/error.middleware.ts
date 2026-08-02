import type { NextFunction, Request, Response } from "express";
import { isHttpError } from "http-errors";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError, KIND_TO_STATUS, type ErrorResponse } from "../lib/errors";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    res
      .status(KIND_TO_STATUS[err.kind])
      .json({ error: err.message } satisfies ErrorResponse);
    return;
  }

  if (err instanceof ZodError) {
    /**
     * `details` is Zod's own issue list, already shaped like ValidationError;
     * its `path: PropertyKey[]` can't narrow to the JSON-serializable schema type.
     */
    res.status(400).json({ error: "Validation error", details: err.issues });
    return;
  }

  if (isHttpError(err)) {
    res.status(err.statusCode).json({
      error: err.expose ? err.message : "Request error",
    } satisfies ErrorResponse);
    return;
  }

  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error:
      env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  } satisfies ErrorResponse);
};
