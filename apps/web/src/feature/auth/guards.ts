import { redirect } from "@tanstack/react-router";
import { ensureRefreshed } from "#/api/client";
import { getAuthState } from "./store";

/**
 * Settles `unknown` before a guard reads it: the access token lives in memory
 * only, so a cold load must re-mint it from the refresh cookie or a returning
 * user looks anonymous. Settled states skip it — guards run on every navigation.
 *
 * A refresh without a verdict throws instead of reading as anonymous: the cookie
 * may be fine, so the route error screen offers a retry rather than a login.
 */
async function settledAuth() {
	if (getAuthState().status === "unknown") {
		const outcome = await ensureRefreshed();
		if (outcome.status === "unreachable" || outcome.status === "failed") {
			throw outcome.cause;
		}
	}

	return getAuthState();
}

/** Routes using this must set `ssr: false` — auth state exists only in the browser. */
export async function requireUser() {
	if ((await settledAuth()).status !== "authenticated") {
		throw redirect({ to: "/login", replace: true });
	}
}

/** Not for the GitHub callback: it authenticates mid-loader and must stay reachable. */
export async function requireAnonymous() {
	if ((await settledAuth()).status === "authenticated") {
		throw redirect({ to: "/", replace: true });
	}
}
