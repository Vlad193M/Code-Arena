import type { MatchProblem } from "@codearena/shared";
import LoadingText from "#/ui/LoadingText";
import TerminalAlert from "#/ui/TerminalAlert";
import LazyCodeEditor from "../editor/LazyCodeEditor";
import { useDraftCode } from "../useDraftCode";
import { useSubmission } from "../useSubmission";
import JudgeLog from "./JudgeLog";
import TestCells from "./TestCells";
import VisibleCases from "./VisibleCases";

type MatchEditorProps = {
	matchId: string;
	userId: string;
	problem: MatchProblem;
	live: boolean;
};

export default function MatchEditor({
	matchId,
	userId,
	problem,
	live,
}: MatchEditorProps) {
	const { initial, code, update } = useDraftCode(
		matchId,
		userId,
		problem.signature,
		live,
	);
	const { result, pending, error, submit } = useSubmission(matchId);

	function handleSubmit() {
		if (live) submit(code.current);
	}

	return (
		<div className="flex min-w-0 flex-col gap-3">
			<div className="min-w-0 border border-(--crt-amber)/60 bg-(--crt-ink) shadow-[0_0_24px_rgba(255,176,0,0.06)]">
				<div className="flex items-center justify-between gap-3 border-b border-(--crt-dim)/50 pr-3 text-[11.5px] tracking-[0.06em] text-(--crt-dim)">
					<span className="border-r border-(--crt-dim)/50 bg-(--crt-amber)/6 px-3.5 py-2.25 text-(--crt-amber)">
						solution.js
					</span>
					<span className="truncate">
						{live ? "JAVASCRIPT · AUTOSAVED" : "READ-ONLY · MATCH OVER"}
					</span>
				</div>
				<LazyCodeEditor
					defaultValue={initial}
					readOnly={!live}
					onChange={update}
					onSubmit={handleSubmit}
				/>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3.5">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<span className="text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
						MY TESTS
					</span>
					<TestCells result={result} pending={pending} />
				</div>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={pending || !live}
					title="Ctrl/⌘+Enter"
					className="min-h-[46px] cursor-pointer border border-(--crt-amber) bg-(--crt-amber)/10 px-6 font-[inherit] text-sm font-semibold tracking-[0.14em] whitespace-nowrap text-(--crt-amber) transition-colors duration-120 [text-shadow:0_0_12px_rgba(255,176,0,0.5)] enabled:hover:bg-(--crt-amber) enabled:hover:text-(--crt-bg) enabled:hover:[text-shadow:none] disabled:cursor-not-allowed disabled:border-(--crt-dim)/60 disabled:bg-transparent disabled:text-(--crt-dim) disabled:[text-shadow:none]"
				>
					{pending ? (
						<>
							[ <LoadingText label="JUDGING" /> ]
						</>
					) : (
						"[ SUBMIT ]"
					)}
				</button>
			</div>

			{error ? (
				<TerminalAlert tone="error">
					{"> "}
					{error}
				</TerminalAlert>
			) : null}

			<div className="grid gap-3 min-[700px]:grid-cols-2 min-[1040px]:grid-cols-1 min-[1240px]:grid-cols-2">
				<VisibleCases problem={problem} result={result} pending={pending} />
				<JudgeLog result={result} pending={pending} />
			</div>
		</div>
	);
}
