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
