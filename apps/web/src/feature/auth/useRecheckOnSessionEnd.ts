import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { getAuthState, subscribe } from "./store";

/**
 * Re-runs the current route's guards when a live session ends, so only a
 * private page redirects. A cold load's `unknown → anonymous` is settled by the
 * guard already running.
 */
export function useRecheckOnSessionEnd(): void {
	const router = useRouter();

	useEffect(() => {
		let previous = getAuthState().status;

		return subscribe(() => {
			const { status } = getAuthState();
			const ended = previous === "authenticated" && status === "anonymous";
			previous = status;

			if (ended) void router.invalidate();
		});
	}, [router]);
}
