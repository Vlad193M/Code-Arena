import { useEffect, useState } from "react";

/**
 * Current epoch time, re-read every `intervalMs`, for live-updating durations.
 * Pass `null` to stop the timer when nothing is displaying the time.
 */
export function useNow(intervalMs: number | null): number {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (intervalMs === null) return;

		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);

	return now;
}
