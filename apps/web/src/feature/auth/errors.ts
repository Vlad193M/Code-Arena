import z from "zod";

export const authErrorSchema = z.enum(["github_denied", "github_failed"]);

export type AuthError = z.infer<typeof authErrorSchema>;

export const AUTH_ERROR_MESSAGES: Record<AuthError, string> = {
  github_denied: "GitHub authorization was cancelled.",
  github_failed: "GitHub sign-in failed. Try again or use your email.",
};

/** Maps a GitHub OAuth `error` search param to one of our own codes. */
export function toAuthError(githubError: string): AuthError {
  return githubError === "access_denied" ? "github_denied" : "github_failed";
}

const apiErrorSchema = z.object({ error: z.string().min(1) });

const UNEXPECTED_RESPONSE =
  "The server sent an unexpected response. Please try again.";
const UNREACHABLE =
  "Could not reach the server. Check your connection and try again.";

/**
 * The API documents `{ error: string }`, but `openapi-fetch` falls back to the
 * raw body text when it is not JSON, so a proxy error page arrives as a string.
 */
export function toApiErrorMessage(body: unknown): string {
  const parsed = apiErrorSchema.safeParse(body);

  return parsed.success ? parsed.data.error : UNEXPECTED_RESPONSE;
}

/**
 * Reached only when something throws. `openapi-fetch` resolves HTTP errors and
 * rethrows transport failures, so a `ZodError` here means the server answered
 * with a payload we cannot trust — a bug, not something a retry would fix.
 */
export function toThrownErrorMessage(cause: unknown): string {
  return cause instanceof z.ZodError ? UNEXPECTED_RESPONSE : UNREACHABLE;
}
