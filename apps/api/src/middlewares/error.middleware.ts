import type { NextFunction, Request, Response } from "express";
import { isHttpError } from "http-errors";
import { ZodError } from "zod";
import { env } from "../cofig/env";

export type ErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "internal";

export class AppError extends Error {
  constructor(
    public kind: ErrorKind,
    message: string,
  ) {
    super(message);
  }
}

const KIND_TO_STATUS: Record<ErrorKind, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  internal: 500,
};

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(KIND_TO_STATUS[err.kind]).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation error", details: err.issues });
    return;
  }

  if (isHttpError(err)) {
    res
      .status(err.statusCode)
      .json({ error: err.expose ? err.message : "Request error" });
    return;
  }

  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error:
      env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
};
