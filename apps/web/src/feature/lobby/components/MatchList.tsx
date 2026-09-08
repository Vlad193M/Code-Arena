import type { LobbyMatch } from "@codearena/shared";
import { useNow } from "#/lib/useNow";
import MatchRow, { LOBBY_COLUMNS } from "./MatchRow";

type MatchListProps = {
	matches: LobbyMatch[];
	currentUserId: string;
	pending: boolean;
	onJoin: (id: string) => void;
	onCancel: (id: string) => void;
};

export default function MatchList({
	matches,
	currentUserId,
	pending,
	onJoin,
	onCancel,
}: MatchListProps) {
	const now = useNow(matches.length > 0 ? 1000 : null);

	return (
		<div className="min-w-0 flex-1 bg-[linear-gradient(180deg,rgba(255,176,0,0.03),rgba(255,176,0,0.01))]">
			<div
				style={{ gridTemplateColumns: LOBBY_COLUMNS }}
				className="grid gap-3 border-b border-[rgba(122,92,56,0.5)] px-[clamp(12px,2vw,20px)] py-3 text-[11.5px] tracking-[0.12em] text-(--crt-dim)"
			>
				<div>OPPONENT</div>
				<div>WAITING</div>
				<div className="text-right">ACTION</div>
			</div>

			{matches.length === 0 ? (
				<div className="px-[clamp(12px,2vw,20px)] py-[54px] text-center text-sm tracking-[0.05em] text-(--crt-dim)">
					NO OPEN MATCHES. CREATE ONE TO START
					<span className="crt-blink ml-0.5 inline-block h-3.5 w-2 -mb-0.5 bg-(--crt-amber)" />
				</div>
			) : (
				matches.map((match) => (
					<MatchRow
						key={match.id}
						match={match}
						now={now}
						isOwn={match.host.id === currentUserId}
						pending={pending}
						onJoin={onJoin}
						onCancel={onCancel}
					/>
				))
			)}
		</div>
	);
}
