import { z } from "zod";

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
 * error middleware and the OpenAPI document. */
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
  .meta({
    id: "ValidationError",
    description: "Validation error with field-level issues",
  });
