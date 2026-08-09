import { ensureRefreshed } from "#/api/client";
import { redirect } from "@tanstack/react-router";
import { getAuthState } from "./store";

/**
 * Settles `unknown` before a guard reads it: the access token lives in memory
 * only, so a cold load must re-mint it from the refresh cookie or a returning
 * user looks anonymous. Settled states skip it — guards run on every navigation.
 */
async function settledAuth() {
  if (getAuthState().status === "unknown") {
    await ensureRefreshed();
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
