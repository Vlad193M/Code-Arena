import type {
	MatchRoom,
	MatchRoomError,
	PlayerPresence,
} from "@codearena/shared";
import { useCallback, useEffect, useState } from "react";
import { getSocket } from "#/api/socket";

export type PresenceView =
	| { status: "connected"; active: boolean }
	| { status: "disconnected"; graceDeadline: number | null };

export type MatchRoomView = {
	room: MatchRoom | undefined;
	deadline: number | null;
	presenceByUserId: Record<string, PresenceView>;
	opponentLeft: boolean;
	error: string | undefined;
	setReady: (ready: boolean) => void;
	leave: () => void;
};

/** On the `performance.now()` clock, so the client's wall clock never shifts it. */
function toDeadline(at: string | null, serverNow: string): number | null {
	if (!at) return null;

	return performance.now() + (Date.parse(at) - Date.parse(serverNow));
}

function toPresenceView(presence: PlayerPresence): PresenceView {
	return presence.status === "connected"
		? { status: "connected", active: presence.active }
		: {
				status: "disconnected",
				graceDeadline: toDeadline(presence.graceEndsAt, presence.serverNow),
			};
}

function isTabActive(): boolean {
	return document.visibilityState === "visible";
}

export function useMatchRoom(matchId: string): MatchRoomView {
	const [room, setRoom] = useState<MatchRoom | undefined>(undefined);
	const [deadline, setDeadline] = useState<number | null>(null);
	const [presenceByUserId, setPresenceByUserId] = useState<
		Record<string, PresenceView>
	>({});
	const [opponentLeft, setOpponentLeft] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		const socket = getSocket();

		const reportActivity = () => socket.emit("match:activity", isTabActive());
		const subscribe = () => {
			socket.emit("match:subscribe", matchId);
			reportActivity();
		};
		const onRoom = (next: MatchRoom) => {
			if (next.guest) {
				setOpponentLeft(false);
			}
			setError(undefined);
			setRoom(next);
			setDeadline(toDeadline(next.endsAt, next.serverNow));
		};
		const onPresence = (presence: PlayerPresence) =>
			setPresenceByUserId((current) => ({
				...current,
				[presence.userId]: toPresenceView(presence),
			}));
		const onOpponentLeft = () => setOpponentLeft(true);
		const onError = ({ message }: MatchRoomError) => setError(message);

		/** A reconnect gets a fresh socket id, so the server no longer holds the
		 * old room membership — every connect has to subscribe again. */
		socket.on("connect", subscribe);
		socket.on("match:room", onRoom);
		socket.on("match:presence", onPresence);
		socket.on("match:opponent_left", onOpponentLeft);
		socket.on("match:error", onError);
		document.addEventListener("visibilitychange", reportActivity);

		if (socket.connected) subscribe();

		return () => {
			if (socket.connected) socket.emit("match:unsubscribe", matchId);
			socket.off("connect", subscribe);
			socket.off("match:room", onRoom);
			socket.off("match:presence", onPresence);
			socket.off("match:opponent_left", onOpponentLeft);
			socket.off("match:error", onError);
			document.removeEventListener("visibilitychange", reportActivity);
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

	return {
		room,
		deadline,
		presenceByUserId,
		opponentLeft,
		error,
		setReady,
		leave,
	};
}
