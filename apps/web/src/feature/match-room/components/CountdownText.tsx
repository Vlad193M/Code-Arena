import { formatCountdown, useCountdown } from "../useCountdown";

/** Ticks on its own, so only this text re-renders, not its parent. */
export default function CountdownText({
	deadline,
}: {
	deadline: number | null;
}) {
	const remainingMs = useCountdown(deadline);

	return remainingMs === null ? "--:--" : formatCountdown(remainingMs);
}
