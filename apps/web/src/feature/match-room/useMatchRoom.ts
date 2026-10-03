import type { MatchRoom, MatchRoomError } from "@codearena/shared";
import { useCallback, useEffect, useState } from "react";
import { getSocket } from "#/api/socket";

export type MatchRoomView = {
	room: MatchRoom | undefined;
	deadline: number | null;
	opponentLeft: boolean;
	error: string | undefined;
	setReady: (ready: boolean) => void;
	leave: () => void;
};

/** On the `performance.now()` clock, so the client's wall clock never shifts it. */
function toDeadline({ endsAt, serverNow }: MatchRoom): number | null {
	if (!endsAt) return null;

	return performance.now() + (Date.parse(endsAt) - Date.parse(serverNow));
}

export function useMatchRoom(matchId: string): MatchRoomView {
	const [room, setRoom] = useState<MatchRoom | undefined>(undefined);
	const [deadline, setDeadline] = useState<number | null>(null);
	const [opponentLeft, setOpponentLeft] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		const socket = getSocket();

		const subscribe = () => socket.emit("match:subscribe", matchId);
		const onRoom = (next: MatchRoom) => {
			if (next.guest) {
				setOpponentLeft(false);
			}
			setError(undefined);
			setRoom(next);
			setDeadline(toDeadline(next));
		};
		const onOpponentLeft = () => setOpponentLeft(true);
		const onError = ({ message }: MatchRoomError) => setError(message);

		/** A reconnect gets a fresh socket id, so the server no longer holds the
		 * old room membership — every connect has to subscribe again. */
		socket.on("connect", subscribe);
		socket.on("match:room", onRoom);
		socket.on("match:opponent_left", onOpponentLeft);
		socket.on("match:error", onError);

		if (socket.connected) subscribe();

		return () => {
			if (socket.connected) socket.emit("match:unsubscribe", matchId);
			socket.off("connect", subscribe);
			socket.off("match:room", onRoom);
			socket.off("match:opponent_left", onOpponentLeft);
			socket.off("match:error", onError);
		};
	}, [matchId]);

	const setReady = useCallback(
		(ready: boolean) => {
			setError(undefined);
			getSocket().emit("match:set_ready", matchId, ready);
		},
		[matchId],
	);

	const leave = useCallback(() => {
		getSocket().emit("match:leave", matchId);
	}, [matchId]);

	return { room, deadline, opponentLeft, error, setReady, leave };
}
