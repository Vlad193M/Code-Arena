import { useNavigate } from "@tanstack/react-router";
import LoadingText from "#/ui/LoadingText";
import TerminalAlert from "#/ui/TerminalAlert";
import ArenaScreen from "../arena/components/ArenaScreen";
import { useMatchRoom } from "../useMatchRoom";
import BackToLobbyButton, { GHOST_BUTTON } from "./BackToLobbyButton";
import CountdownText from "./CountdownText";
import PlayerCard from "./PlayerCard";

type MatchRoomScreenProps = {
	matchId: string;
	currentUserId: string;
};

const RULE = "─".repeat(200);

function CrtBackdrop({ children }: { children: React.ReactNode }) {
	return (
		<div className="crt relative flex min-h-screen items-center justify-center overflow-hidden bg-(--crt-bg) font-mono">
			<div className="crt-scanlines" />
			<div className="crt-vignette" />
			<div className="relative z-1 flex flex-col items-center gap-5 text-sm tracking-[0.05em] text-(--crt-dim)">
				{children}
			</div>
		</div>
	);
}

export default function MatchRoomScreen({
	matchId,
	currentUserId,
}: MatchRoomScreenProps) {
	const navigate = useNavigate();
	const {
		room,
		deadline,
		presenceByUserId,
		opponentLeft,
		error,
		setReady,
		leave,
	} = useMatchRoom(matchId);

	function handleLeave() {
		leave();
		navigate({ to: "/lobby" });
	}

	if (error && !room) {
		return (
			<CrtBackdrop>
				<span className="crt-glow-red text-(--crt-red)">
					{"> "}
					{error}
				</span>
				<BackToLobbyButton />
			</CrtBackdrop>
		);
	}

	if (!room) {
		return (
			<CrtBackdrop>
				<span>
					<LoadingText label="ESTABLISHING LINK" />
				</span>
			</CrtBackdrop>
		);
	}

	const isHost = room.host.id === currentUserId;
	const mine = isHost ? room.host : room.guest;
	const opponent = isHost ? room.guest : room.host;
	const opponentPresence = opponent ? presenceByUserId[opponent.id] : undefined;
	const roomCode = room.id.slice(0, 6).toUpperCase();

	/** The server reveals the problem exactly when the match starts, so a room
	 * with one is in progress or finished. */
	if (room.problem) {
		return (
			<ArenaScreen
				room={room}
				problem={room.problem}
				roomCode={roomCode}
				currentUserId={currentUserId}
				deadline={deadline}
				opponent={opponent}
				opponentPresence={opponentPresence}
				opponentLeft={opponentLeft}
				error={error}
			/>
		);
	}

	const cancelled = room.status === "CANCELLED";
	const opponentDropped =
		opponentPresence?.status === "disconnected" && room.status === "WAITING"
			? opponentPresence
			: null;

	return (
		<div className="crt relative min-h-screen overflow-hidden bg-(--crt-bg) font-mono">
			<div className="crt-scanlines" />
			<div className="crt-vignette" />

			<div className="relative z-1 mx-auto flex max-w-[860px] flex-col gap-4.5 p-[clamp(16px,3vw,40px)]">
				<div className="crt-glow text-sm tracking-[0.04em]">
					<span className="text-(--crt-dim)">{"C:\\CODEARENA\\ROOM>"}</span>{" "}
					join --match {roomCode}
					<span className="crt-blink -mb-0.5 ml-[3px] inline-block h-3.5 w-2 bg-(--crt-amber)" />
				</div>

				<div className="flex flex-col">
					<div className="crt-glow flex items-baseline overflow-hidden text-[13px] tracking-[0.06em] whitespace-nowrap">
						<span>┌─[ MATCH ROOM #{roomCode} ]</span>
						<span className="flex-1 overflow-hidden opacity-70">{RULE}</span>
						<span>┐</span>
					</div>

					<div className="flex items-stretch">
						<div className="crt-edge w-px" />
						<div className="flex min-w-0 flex-1 flex-col gap-6 bg-[linear-gradient(180deg,rgba(255,176,0,0.035),rgba(255,176,0,0.01))] p-[clamp(20px,3vw,32px)]">
							<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-[clamp(12px,2vw,20px)]">
								<PlayerCard
									label="SLOT 1 — HOST"
									player={room.host}
									isMe={isHost}
									presence={isHost ? undefined : opponentPresence}
								/>

								<div className="flex items-center justify-center px-2 text-lg font-semibold tracking-[0.1em] text-(--crt-dim)">
									VS
								</div>

								{room.guest ? (
									<PlayerCard
										label="SLOT 2 — CHALLENGER"
										player={room.guest}
										isMe={!isHost}
										presence={isHost ? opponentPresence : undefined}
									/>
								) : (
									<div className="flex min-w-0 flex-col gap-3 border border-(--crt-dim)/60 border-dashed p-4.5">
										<div className="text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
											SLOT 2 — CHALLENGER
										</div>
										<div className="text-sm tracking-[0.04em] text-(--crt-dim)">
											<LoadingText label="WAITING FOR OPPONENT" />
										</div>
										<div className="text-xs text-(--crt-dim)">
											{cancelled
												? "This room is closed and no longer listed."
												: "Room is listed in the lobby. Anyone can claim this slot."}
										</div>
									</div>
								)}
							</div>

							{cancelled ? (
								<TerminalAlert tone="error">
									{"> "}MATCH CANCELLED — this room is closed
								</TerminalAlert>
							) : opponentLeft ? (
								<TerminalAlert tone="error">
									{"> "}OPPONENT LEFT THE ROOM — slot reopened
								</TerminalAlert>
							) : opponentDropped ? (
								<TerminalAlert tone="error">
									{"> "}OPPONENT DISCONNECTED — waiting{" "}
									{opponentDropped.graceDeadline === null ? null : (
										<>
											<CountdownText
												deadline={opponentDropped.graceDeadline}
											/>{" "}
										</>
									)}
									for them to reconnect
								</TerminalAlert>
							) : null}

							{error ? (
								<TerminalAlert tone="error">{error}</TerminalAlert>
							) : null}

							{cancelled ? <BackToLobbyButton /> : null}

							{mine && room.status === "WAITING" ? (
								<div className="flex flex-wrap gap-3">
									<button
										type="button"
										onClick={() => setReady(!mine.ready)}
										className={`min-h-[52px] flex-1 cursor-pointer border font-[inherit] text-sm font-semibold tracking-[0.12em] transition-colors duration-120 ${
											mine.ready
												? "border-(--crt-green) bg-(--crt-green)/10 text-(--crt-green)"
												: "border-(--crt-amber) bg-(--crt-amber)/8 text-(--crt-amber)"
										}`}
									>
										[ {mine.ready ? "CANCEL READY" : "READY UP"} ]
									</button>

									<button
										type="button"
										onClick={handleLeave}
										className={`${GHOST_BUTTON} hover:border-(--crt-red) hover:text-(--crt-red)`}
									>
										[ CANCEL ]
									</button>
								</div>
							) : null}
						</div>
						<div className="crt-edge w-px" />
					</div>

					<div className="crt-glow flex items-baseline overflow-hidden text-[13px] tracking-[0.06em] whitespace-nowrap">
						<span>└</span>
						<span className="flex-1 overflow-hidden opacity-70">{RULE}</span>
						<span>[ {room.guest ? "2/2" : "1/2"} PRESENT ]─┘</span>
					</div>
				</div>
			</div>
		</div>
	);
}
