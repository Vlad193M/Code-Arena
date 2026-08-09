import { type User, authResponseSchema } from "@codearena/shared";
import { useSyncExternalStore } from "react";

export type AuthUser = User;

export type AuthState = {
  /** `unknown` until the first silent refresh settles. */
  status: "unknown" | "authenticated" | "anonymous";
  user: AuthUser | undefined;
  accessToken: string | undefined;
};

const UNKNOWN: AuthState = {
  status: "unknown",
  user: undefined,
  accessToken: undefined,
};

const ANONYMOUS: AuthState = {
  status: "anonymous",
  user: undefined,
  accessToken: undefined,
};

let state: AuthState = UNKNOWN;
const listeners = new Set<() => void>();

function assertClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "Auth state must never be written on the server — module state is shared across requests.",
    );
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/** Parses rather than trusts: the payload crosses the network before it lands in long-lived state. */
export function setSession(session: unknown) {
  assertClient();
  const { accessToken, user } = authResponseSchema.parse(session);
  state = { status: "authenticated", accessToken, user };
  emit();
}

export function clearSession() {
  assertClient();
  state = ANONYMOUS;
  emit();
}

export function getAccessToken(): string | undefined {
  return typeof window === "undefined" ? undefined : state.accessToken;
}

/** Reads auth outside React: route guards run before any component exists. */
export function getAuthState(): AuthState {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => UNKNOWN,
  );
}
