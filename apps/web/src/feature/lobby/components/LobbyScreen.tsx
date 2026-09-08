import { useLobby } from "../useLobby";
import MatchList from "./MatchList";

type LobbyScreenProps = {
	currentUserId: string;
};

const RULE = "─".repeat(240);

export default function LobbyScreen({ currentUserId }: LobbyScreenProps) {
	const { matches, pending, error, createMatch, joinMatch, cancelMatch } =
		useLobby();

	return (
		<div className="crt relative min-h-screen overflow-hidden bg-(--crt-bg) font-mono">
			<div className="crt-scanlines" />
			<div className="crt-vignette" />

			<div className="relative z-1 mx-auto flex max-w-[1440px] flex-col gap-[18px] p-[clamp(16px,3vw,40px)]">
				<div className="crt-glow text-sm tracking-[0.04em]">
					<span className="text-(--crt-dim)">{"C:\\CODEARENA\\LOBBY>"}</span> ls
					--open-matches
					<span className="crt-blink ml-[3px] inline-block h-3.5 w-2 -mb-0.5 bg-(--crt-amber)" />
				</div>

				<div className="flex flex-col">
					<div className="crt-glow flex items-baseline overflow-hidden text-[13px] tracking-[0.06em] whitespace-nowrap">
						<span>┌─[ OPEN MATCHES ]</span>
						<span className="flex-1 overflow-hidden opacity-70">{RULE}</span>
						<span>┐</span>
					</div>

					<div className="flex items-stretch">
						<div className="crt-edge w-px" />
						<MatchList
							matches={matches}
							currentUserId={currentUserId}
							pending={pending}
							onJoin={joinMatch}
							onCancel={cancelMatch}
						/>
						<div className="crt-edge w-px" />
					</div>

					<div className="crt-glow flex items-baseline overflow-hidden text-[13px] tracking-[0.06em] whitespace-nowrap">
						<span>└</span>
						<span className="flex-1 overflow-hidden opacity-70">{RULE}</span>
						<span>[ {matches.length} OPEN ]─┘</span>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3.5">
					<button
						type="button"
						disabled={pending}
						onClick={createMatch}
						className="crt-glow min-h-[52px] cursor-pointer border border-(--crt-amber) bg-[rgba(255,176,0,0.08)] px-6 font-[inherit] text-[15px] font-semibold tracking-[0.14em] text-(--crt-amber) transition-colors duration-120 hover:bg-(--crt-amber) hover:text-(--crt-bg) hover:[text-shadow:none] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-[rgba(255,176,0,0.08)] disabled:hover:text-(--crt-amber)"
					>
						[ + CREATE MATCH ]
					</button>

					{error ? (
						<span
							role="alert"
							className="crt-glow-red text-[13px] tracking-[0.05em] text-(--crt-red)"
						>
							{"> "}
							{error}
						</span>
					) : null}
				</div>
			</div>
		</div>
	);
}
