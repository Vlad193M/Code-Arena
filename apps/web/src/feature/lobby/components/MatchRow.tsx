import type { LobbyMatch } from "@codearena/shared";

export const LOBBY_COLUMNS = "minmax(150px, 1.6fr) minmax(88px, 0.8fr) 128px";

const NEW_FOR_MS = 10_000;

type MatchRowProps = {
	match: LobbyMatch;
	now: number;
	isOwn: boolean;
	pending: boolean;
	onJoin: (id: string) => void;
	onCancel: (id: string) => void;
};

function waitingFor(createdAt: string, now: number): string {
	const seconds = Math.max(0, Math.round((now - Date.parse(createdAt)) / 1000));
	const minutes = Math.floor(seconds / 60);

	return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function MatchRow({
	match,
	now,
	isOwn,
	pending,
	onJoin,
	onCancel,
}: MatchRowProps) {
	const isNew = now - Date.parse(match.createdAt) < NEW_FOR_MS;

	return (
		<div
			style={{ gridTemplateColumns: LOBBY_COLUMNS }}
			className={`grid items-center gap-3 border-b border-[rgba(122,92,56,0.22)] px-[clamp(12px,2vw,20px)] py-[11px] text-sm ${isNew ? "crt-slidein" : ""}`}
		>
			<div className="flex min-w-0 items-center gap-[9px]">
				<span className="crt-glow-green text-[11px] text-(--crt-green)">●</span>
				<span className="crt-glow truncate">{match.host.username}</span>
				{isOwn ? (
					<span className="text-(--crt-green)">(YOU)</span>
				) : isNew ? (
					<span className="border border-[rgba(51,255,102,0.5)] px-[5px] py-px text-[10px] tracking-[0.1em] text-(--crt-green)">
						NEW
					</span>
				) : null}
			</div>

			<div className="text-[13px] text-(--crt-dim)">
				{waitingFor(match.createdAt, now)}
			</div>

			<div className="text-right">
				<button
					type="button"
					disabled={pending}
					onClick={() => (isOwn ? onCancel(match.id) : onJoin(match.id))}
					className="min-h-[38px] cursor-pointer border border-(--crt-amber) bg-transparent px-3.5 font-[inherit] text-[13px] tracking-[0.1em] text-(--crt-amber) transition-colors duration-120 hover:bg-(--crt-amber) hover:text-(--crt-bg) disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent disabled:hover:text-(--crt-amber)"
				>
					[ {isOwn ? "CANCEL" : "JOIN"} ]
				</button>
			</div>
		</div>
	);
}
