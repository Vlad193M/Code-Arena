import z from "zod";

/** A request that got no answer — kept apart from the bare `TypeError` a bug also throws. */
export class NetworkError extends Error {
	constructor(cause: unknown) {
		super("Could not reach the API", { cause });
		this.name = "NetworkError";
	}
}

const apiErrorSchema = z.object({ error: z.string().min(1) });

const UNEXPECTED_RESPONSE =
	"The server sent an unexpected response. Please try again.";
const UNREACHABLE =
	"Could not reach the server. Check your connection and try again.";
const UNKNOWN = "Something went wrong. Please try again.";

/**
 * The API documents `{ error: string }`, but `openapi-fetch` falls back to the
 * raw body text when it is not JSON, so a proxy error page arrives as a string.
 */
export function toApiErrorMessage(body: unknown): string {
	const parsed = apiErrorSchema.safeParse(body);

	return parsed.success ? parsed.data.error : UNEXPECTED_RESPONSE;
}

/** `openapi-fetch` resolves HTTP errors, so whatever throws is no answer, an untrusted answer, or a bug. */
export function toThrownErrorMessage(cause: unknown): string {
	if (cause instanceof NetworkError) return UNREACHABLE;
	if (cause instanceof z.ZodError) return UNEXPECTED_RESPONSE;
	return UNKNOWN;
}
