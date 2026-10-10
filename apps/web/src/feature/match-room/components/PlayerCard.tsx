import type { MatchRoomPlayer } from "@codearena/shared";
import type { PresenceView } from "../useMatchRoom";

type PlayerCardProps = {
	label: string;
	player: MatchRoomPlayer;
	isMe: boolean;
	presence?: PresenceView | undefined;
};

function presenceIndicator(presence: PresenceView | undefined) {
	if (presence?.status === "disconnected") {
		return {
			dot: "crt-glow-red text-(--crt-red)",
			label: "DISCONNECTED",
		};
	}
	if (presence?.active === false) {
		return { dot: "text-(--crt-dim)", label: "AWAY" };
	}

	return {
		dot: "crt-glow-green text-(--crt-green)",
		label: presence ? "ONLINE" : null,
	};
}

export default function PlayerCard({
	label,
	player,
	isMe,
	presence,
}: PlayerCardProps) {
	const indicator = presenceIndicator(presence);

	return (
		<div className="flex min-w-0 flex-col gap-3 border border-(--crt-amber)/55 p-4.5">
			<div className="text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
				{label}
			</div>

			<div className="flex min-w-0 items-center gap-2.5">
				<span className={`text-xs ${indicator.dot}`}>●</span>
				<span className="crt-glow truncate text-base font-semibold">
					{player.username}
				</span>
				{isMe ? (
					<span className="border border-(--crt-dim)/60 px-[5px] py-px text-[10px] tracking-[0.08em] text-(--crt-dim)">
						YOU
					</span>
				) : null}
			</div>

			{indicator.label ? (
				<div className="text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
					{indicator.label}
				</div>
			) : null}

			<div
				className={`mt-auto pt-2 text-[13px] tracking-[0.06em] ${
					player.ready ? "text-(--crt-green)" : "text-(--crt-dim)"
				}`}
			>
				{player.ready ? "✓ READY" : "· NOT READY"}
			</div>
		</div>
	);
}
