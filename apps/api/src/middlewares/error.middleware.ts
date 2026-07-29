import type { NextFunction, Request, Response } from "express";
import { isHttpError } from "http-errors";
import { z, ZodError } from "zod";
import { env } from "../config/env";

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

export const KIND_TO_STATUS: Record<ErrorKind, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  internal: 500,
};

/** The shape every error response shares — the single source for both the
 * handler below and the OpenAPI document. */
export const errorSchema = z
  .object({ error: z.string().meta({ example: "Invalid email or password" }) })
  .meta({ id: "Error", description: "Standard error response" });
export type ErrorResponse = z.infer<typeof errorSchema>;

/** A single Zod issue, as emitted in `details` for validation failures. */
const issueSchema = z.looseObject({
  code: z.string().meta({ example: "too_small" }),
  path: z
    .array(z.union([z.string(), z.number()]))
    .meta({ example: ["password"] }),
  message: z.string().meta({
    example: "Too small: expected string to have >=8 characters",
  }),
});

/** Validation (400) body — like {@link errorSchema} but may carry per-field
 * `details` when the failure comes from Zod. */
export const validationErrorSchema = z
  .object({
    error: z.string().meta({ example: "Validation error" }),
    details: z.array(issueSchema).optional(),
  })
  .meta({ id: "ValidationError", description: "Validation error with field-level issues" });

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
    res
      .status(err.statusCode)
      .json({
        error: err.expose ? err.message : "Request error",
      } satisfies ErrorResponse);
    return;
  }

  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error: env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  } satisfies ErrorResponse);
};
