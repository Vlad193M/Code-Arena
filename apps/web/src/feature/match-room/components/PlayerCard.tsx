import type { MatchRoomPlayer } from "@codearena/shared";

type PlayerCardProps = {
	label: string;
	player: MatchRoomPlayer;
	isMe: boolean;
};

export default function PlayerCard({ label, player, isMe }: PlayerCardProps) {
	return (
		<div className="flex min-w-0 flex-col gap-3 border border-(--crt-amber)/55 p-4.5">
			<div className="text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
				{label}
			</div>

			<div className="flex min-w-0 items-center gap-2.5">
				<span className="crt-glow-green text-xs text-(--crt-green)">●</span>
				<span className="crt-glow truncate text-base font-semibold">
					{player.username}
				</span>
				{isMe ? (
					<span className="border border-(--crt-dim)/60 px-[5px] py-px text-[10px] tracking-[0.08em] text-(--crt-dim)">
						YOU
					</span>
				) : null}
			</div>

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
