import { z } from "zod";
import { AppError } from "./errors";

/** For data the server owns: a failure is a server bug, so it throws a 500
 * `internal` {@link AppError}, not a `ZodError` the error middleware would
 * answer with a 400. `context` is only logged — AppError messages reach the client. */
export function parseOrThrow<T extends z.ZodType>(
	schema: T,
	data: unknown,
	context: string,
): z.infer<T> {
	const result = schema.safeParse(data);
	if (!result.success) {
		console.error(`❌ ${context}\n${z.prettifyError(result.error)}`);
		throw new AppError("internal", "Internal data failed validation");
	}
	return result.data;
}
