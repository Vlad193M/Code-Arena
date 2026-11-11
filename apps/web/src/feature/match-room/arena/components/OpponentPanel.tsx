import type { MatchRoomPlayer } from "@codearena/shared";
import CountdownText from "../../components/CountdownText";
import type { PresenceView } from "../../useMatchRoom";

type OpponentPanelProps = {
	opponent: MatchRoomPlayer | null;
	presence: PresenceView | undefined;
	opponentLeft: boolean;
	live: boolean;
};

const LABEL = "text-[11.5px] tracking-[0.12em] text-(--crt-dim)";

function Activity({
	presence,
	opponentLeft,
	live,
}: Omit<OpponentPanelProps, "opponent">) {
	if (opponentLeft) {
		return (
			<div className="text-[13.5px] text-(--crt-red)">○ left the match</div>
		);
	}

	if (presence?.status === "disconnected") {
		if (!live) {
			return (
				<div className="text-[13.5px] text-(--crt-red)">○ disconnected</div>
			);
		}

		return (
			<div className="flex flex-col gap-2">
				<div className="crt-glow-red text-[13px] text-(--crt-red)">
					GRACE <CountdownText deadline={presence.graceDeadline} /> — clock
					keeps running
				</div>
				<div className="text-[11.5px] leading-[1.6] text-(--crt-dim)">
					If they don't return in time, the match is awarded to you.
				</div>
			</div>
		);
	}

	if (presence?.active === false) {
		return (
			<div className="flex flex-col gap-1">
				<div className="text-[13.5px] text-(--crt-dim)">— away</div>
				<div className="text-[11.5px] text-(--crt-dim)">
					tab in the background · still connected
				</div>
			</div>
		);
	}

	return <div className="text-[13.5px]">▸ in the arena</div>;
}

export default function OpponentPanel({
	opponent,
	presence,
	opponentLeft,
	live,
}: OpponentPanelProps) {
	const down = opponentLeft || presence?.status === "disconnected";

	return (
		<div
			className={`min-w-0 border bg-[linear-gradient(180deg,rgba(255,176,0,0.035),rgba(255,176,0,0.01))] transition-colors duration-200 ${
				down ? "border-(--crt-red)/60" : "border-(--crt-amber)/55"
			}`}
		>
			<div
				className={`flex justify-between gap-2 border-b border-(--crt-dim)/45 px-4 py-2.25 ${LABEL}`}
			>
				<span>OPPONENT</span>
				<span>CODE HIDDEN</span>
			</div>

			<div
				className={`flex flex-col gap-2.5 border-b border-(--crt-dim)/45 p-4 ${down ? "opacity-50" : ""}`}
			>
				<div className="crt-glow truncate text-[17px] font-semibold tracking-[0.02em]">
					{opponent?.username ?? "—"}
				</div>
				<div
					className={`text-[13px] tracking-[0.06em] ${
						down
							? "crt-glow-red text-(--crt-red)"
							: "crt-glow-green text-(--crt-green)"
					}`}
				>
					{opponentLeft ? "○ LEFT" : down ? "○ DROPPED" : "● ONLINE"}
				</div>
			</div>

			<div className="flex min-h-24 flex-col justify-center gap-2 px-4 py-3.5">
				<div className={LABEL}>ACTIVITY</div>
				<Activity presence={presence} opponentLeft={opponentLeft} live={live} />
			</div>
		</div>
	);
}
