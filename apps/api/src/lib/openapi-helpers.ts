import type { ZodType } from "zod";
import type {
  ZodOpenApiRequestBodyObject,
  ZodOpenApiResponseObject,
} from "zod-openapi";
import {
  errorSchema,
  KIND_TO_STATUS,
  validationErrorSchema,
  type ErrorKind,
} from "./errors";

/** Wraps a schema as a JSON request body. */
export const jsonBody = (schema: ZodType): ZodOpenApiRequestBodyObject => ({
  content: { "application/json": { schema } },
});

/** Wraps a schema as a JSON success response. */
export const jsonResponse = (
  description: string,
  schema: ZodType,
): ZodOpenApiResponseObject => ({
  description,
  content: { "application/json": { schema } },
});

/**
 * Maps each error kind to its reusable component name, description and a
 * representative message — the `example` mirrors a real message thrown by the
 * services/middleware for that kind.
 */
const ERROR_RESPONSES: Record<
  ErrorKind,
  { name: string; description: string; example: string }
> = {
  validation: {
    name: "BadRequest",
    description: "Invalid request payload",
    example: "Validation error",
  },
  unauthorized: {
    name: "Unauthorized",
    description: "Authentication required or failed",
    example: "Invalid email or password",
  },
  forbidden: {
    name: "Forbidden",
    description: "Insufficient permissions",
    example: "Insufficient permissions",
  },
  not_found: {
    name: "NotFound",
    description: "Resource not found",
    example: "User not found",
  },
  conflict: {
    name: "Conflict",
    description: "Resource already exists",
    example: "User with this email or username already exists",
  },
  internal: {
    name: "InternalError",
    description: "Unexpected server error",
    example: "Internal Server Error",
  },
};

/** Reusable `components.responses` entries, one per error kind. Validation
 * carries field-level `details`; every other kind is a plain error. */
export const errorResponseComponents: Record<string, ZodOpenApiResponseObject> =
  Object.fromEntries(
    (Object.keys(ERROR_RESPONSES) as ErrorKind[]).map((kind) => {
      const { name, description, example } = ERROR_RESPONSES[kind];
      return [
        name,
        {
          description,
          content: {
            "application/json": {
              schema: kind === "validation" ? validationErrorSchema : errorSchema,
              example: { error: example },
            },
          },
        },
      ];
    }),
  );

/**
 * Attaches the named error responses to an operation, keyed by their real
 * HTTP status. Each endpoint opts in explicitly: `...errors("unauthorized")`.
 */
export const errors = (
  ...kinds: ErrorKind[]
): Record<string, { $ref: string }> =>
  Object.fromEntries(
    kinds.map((kind) => [
      String(KIND_TO_STATUS[kind]),
      { $ref: `#/components/responses/${ERROR_RESPONSES[kind].name}` },
    ]),
  );
