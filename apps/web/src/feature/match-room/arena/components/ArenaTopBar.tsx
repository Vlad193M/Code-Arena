import type { Difficulty, MatchProblem } from "@codearena/shared";
import { formatCountdown, useCountdown } from "../../useCountdown";

type ArenaTopBarProps = {
	roomCode: string;
	problem: MatchProblem;
	deadline: number | null;
	finished: boolean;
};

const RULE = "─".repeat(200);

const DIFFICULTY_TONE: Record<Difficulty, string> = {
	EASY: "border-(--crt-green)/55 text-(--crt-green)",
	MEDIUM: "border-(--crt-amber)/55 text-(--crt-amber)",
	HARD: "border-(--crt-red)/55 text-(--crt-red)",
};

const FINAL_SECONDS_MS = 30_000;

function clockLabel(remainingMs: number | null, finished: boolean) {
	if (finished) return "00:00";
	return remainingMs === null ? "--:--" : formatCountdown(remainingMs);
}

export default function ArenaTopBar({
	roomCode,
	problem,
	deadline,
	finished,
}: ArenaTopBarProps) {
	const remainingMs = useCountdown(deadline);
	const urgent =
		finished || (remainingMs !== null && remainingMs <= FINAL_SECONDS_MS);

	return (
		<div className="flex flex-col">
			<div className="crt-glow flex items-baseline overflow-hidden text-[13px] tracking-[0.06em] whitespace-nowrap">
				<span>┌─[ MATCH #{roomCode} ]</span>
				<span className="flex-1 overflow-hidden opacity-70">{RULE}</span>
				<span>┐</span>
			</div>

			<div className="grid items-center gap-4.5 border-x border-(--crt-amber)/70 bg-[linear-gradient(180deg,rgba(255,176,0,0.035),rgba(255,176,0,0.01))] px-[clamp(12px,2vw,24px)] py-3.5 min-[760px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<span className="crt-glow text-[clamp(15px,1.7vw,19px)] font-semibold tracking-[0.02em]">
						{problem.title}
					</span>
					<span
						className={`border px-2 py-0.5 text-[11.5px] tracking-[0.12em] ${DIFFICULTY_TONE[problem.difficulty]}`}
					>
						{problem.difficulty}
					</span>
				</div>

				<div className="flex flex-col items-center gap-1 px-[clamp(12px,2vw,32px)]">
					<span className="text-[11px] tracking-[0.16em] text-(--crt-dim)">
						{finished ? "MATCH OVER" : "TIME LEFT"}
					</span>
					<span
						className={`text-[clamp(36px,4.2vw,56px)] leading-none font-semibold tracking-[0.04em] tabular-nums ${
							urgent
								? "text-(--crt-red) [text-shadow:0_0_24px_rgba(255,68,68,0.55),0_0_60px_rgba(255,68,68,0.18)]"
								: "[text-shadow:0_0_24px_rgba(255,176,0,0.55),0_0_60px_rgba(255,176,0,0.18)]"
						}`}
					>
						{clockLabel(remainingMs, finished)}
					</span>
					<span className="text-[10.5px] tracking-[0.1em] text-(--crt-dim)">
						SERVER CLOCK · SYNCED
					</span>
				</div>

				<div className="flex items-center gap-2.5 min-[760px]:justify-end">
					<span className="text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
						LANG
					</span>
					<span className="flex min-h-10 min-w-14 items-center justify-center border border-(--crt-dim) bg-(--crt-amber) px-3.5 text-[13px] font-semibold tracking-[0.1em] text-(--crt-bg)">
						JS
					</span>
				</div>
			</div>

			<div className="flex items-baseline overflow-hidden text-[13px] tracking-[0.06em] whitespace-nowrap">
				<span>└</span>
				<span className="flex-1 overflow-hidden opacity-70">{RULE}</span>
				<span>┘</span>
			</div>
		</div>
	);
}
