import type { ZodType } from "zod";
import { AppError } from "./errors";

/**
 * Validates an outgoing payload against its contract, dropping undeclared fields.
 *
 * A failure is a server bug, so it must not reach the error middleware as a bare
 * `ZodError`: that branch answers 400 and blames the caller for our mismatch.
 */
export function serialize<T>(schema: ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    console.error("❌ Response contract violation:", result.error.issues);
    throw new AppError("internal", "Response contract violation");
  }

  return result.data;
}
