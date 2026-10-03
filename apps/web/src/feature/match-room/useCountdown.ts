import { useLayoutEffect, useState } from "react";

const TICK_MS = 250;

/** Re-reads the clock each tick rather than decrementing, so a throttled
 * background tab catches up instead of falling behind. A layout effect, so the
 * stale `now` a new deadline first renders with is replaced before paint. */
export function useCountdown(deadline: number | null): number | null {
	const [now, setNow] = useState(() => performance.now());

	useLayoutEffect(() => {
		if (deadline === null) return;

		setNow(performance.now());
		const id = setInterval(() => setNow(performance.now()), TICK_MS);
		return () => clearInterval(id);
	}, [deadline]);

	return deadline === null ? null : Math.max(0, deadline - now);
}

export function formatCountdown(ms: number): string {
	const totalSeconds = Math.ceil(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
