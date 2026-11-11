import type {
	MatchProblem,
	MatchRoom,
	MatchRoomPlayer,
} from "@codearena/shared";
import { type CSSProperties, useState } from "react";
import TerminalAlert from "#/ui/TerminalAlert";
import BackToLobbyButton from "../../components/BackToLobbyButton";
import MatchEditor from "../../submission/components/MatchEditor";
import type { PresenceView } from "../../useMatchRoom";
import ArenaTopBar from "./ArenaTopBar";
import OpponentPanel from "./OpponentPanel";
import ProblemPanel from "./ProblemPanel";

type ArenaScreenProps = {
	room: MatchRoom;
	problem: MatchProblem;
	roomCode: string;
	currentUserId: string;
	deadline: number | null;
	opponent: MatchRoomPlayer | null;
	opponentPresence: PresenceView | undefined;
	opponentLeft: boolean;
	error: string | undefined;
};

const GRID =
	"grid items-start gap-[clamp(12px,1.6vw,20px)] min-[1040px]:grid-cols-[minmax(0,1fr)_clamp(260px,22vw,320px)] xl:grid-cols-[var(--pane)_minmax(0,1fr)_clamp(260px,20vw,300px)]";

export default function ArenaScreen({
	room,
	problem,
	roomCode,
	currentUserId,
	deadline,
	opponent,
	opponentPresence,
	opponentLeft,
	error,
}: ArenaScreenProps) {
	const [paneOpen, setPaneOpen] = useState(true);

	const live = room.status === "IN_PROGRESS";
	const won = room.winnerId === currentUserId;
	const paneWidth = {
		"--pane": paneOpen ? "clamp(300px,23vw,360px)" : "44px",
	} as CSSProperties;

	return (
		<div className="crt relative min-h-screen overflow-x-clip bg-(--crt-bg) font-mono">
			<div className="crt-scanlines" />
			<div className="crt-vignette" />

			<div className="relative z-1 mx-auto flex max-w-[1480px] flex-col gap-3.5 p-[clamp(14px,2.4vw,32px)]">
				<ArenaTopBar
					roomCode={roomCode}
					problem={problem}
					deadline={live ? deadline : null}
					finished={!live}
				/>

				{live ? null : (
					<div className="flex flex-wrap items-stretch gap-3">
						<div className="min-w-0 flex-1">
							<TerminalAlert tone={won ? "success" : "error"}>
								{"> "}
								{room.winnerId === null
									? "TIME'S UP — MATCH OVER"
									: `MATCH OVER — ${won ? "YOU WIN" : "YOU LOSE"}`}
							</TerminalAlert>
						</div>
						<BackToLobbyButton />
					</div>
				)}

				{error ? <TerminalAlert tone="error">{error}</TerminalAlert> : null}

				<div className={GRID} style={paneWidth}>
					<div className="min-w-0 min-[1040px]:col-span-full xl:sticky xl:top-4 xl:col-span-1">
						<ProblemPanel
							problem={problem}
							open={paneOpen}
							onToggle={() => setPaneOpen((open) => !open)}
						/>
					</div>

					<MatchEditor
						matchId={room.id}
						userId={currentUserId}
						problem={problem}
						live={live}
					/>

					<OpponentPanel
						opponent={opponent}
						presence={opponentPresence}
						opponentLeft={opponentLeft}
						live={live}
					/>
				</div>
			</div>
		</div>
	);
}
