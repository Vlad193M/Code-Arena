import type { ZodType } from "zod";
import { AppError } from "./errors";

/**
 * Validates an outgoing payload against its contract, stripping fields the
 * schema does not declare.
 *
 * A failure here is a server bug, not a bad request, so it must not reach the
 * error middleware as a bare `ZodError` — that branch answers 400 and blames
 * the caller for a mismatch they did not cause.
 */
export function serialize<T>(schema: ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    console.error("❌ Response contract violation:", result.error.issues);
    throw new AppError("internal", "Response contract violation");
  }

  return result.data;
}
