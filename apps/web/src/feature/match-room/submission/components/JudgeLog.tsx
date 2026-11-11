import type { SubmissionResult } from "@codearena/shared";
import LoadingText from "#/ui/LoadingText";
import { formatVerdict } from "../../formatValues";

type JudgeLogProps = {
	result: SubmissionResult | null;
	pending: boolean;
};

type Tone = "dim" | "pass" | "fail" | "verdict";

type LogLine = { text: string; tone: Tone };

const TONE: Record<Tone, string> = {
	dim: "text-(--crt-dim)",
	pass: "text-(--crt-green)",
	fail: "text-(--crt-red)",
	verdict: "font-semibold text-(--crt-amber)",
};

const PROMPT: LogLine = { text: "$ submit — javascript", tone: "dim" };

/** The server rounds to whole milliseconds, so a fast case arrives as 0. */
function formatDuration(ms: number) {
	return ms === 0 ? "<1ms" : `${ms}ms`;
}

function toLogLines(result: SubmissionResult): LogLine[] {
	const total = result.cases.length;

	return [
		PROMPT,
		...result.cases.map((testCase, index): LogLine => {
			const label = `test ${index + 1}/${total}`;
			const detail = testCase.hidden
				? "(hidden)"
				: formatDuration(testCase.durationMs);

			return testCase.verdict === "ACCEPTED"
				? { text: `✓ ${label}  passed  ${detail}`, tone: "pass" }
				: {
						text: `✗ ${label}  ${formatVerdict(testCase.verdict)}  ${detail}`,
						tone: "fail",
					};
		}),
		{
			text: `VERDICT  ${formatVerdict(result.verdict)} — ${result.passed}/${result.total} PASSED`,
			tone: "verdict",
		},
	];
}

function statusOf(result: SubmissionResult | null, pending: boolean) {
	if (pending) return { label: "RUNNING", className: "text-(--crt-amber)" };
	if (!result) return { label: "IDLE", className: "text-(--crt-dim)" };

	return result.verdict === "ACCEPTED"
		? { label: "ACCEPTED", className: "text-(--crt-green)" }
		: { label: formatVerdict(result.verdict), className: "text-(--crt-red)" };
}

export default function JudgeLog({ result, pending }: JudgeLogProps) {
	const status = statusOf(result, pending);

	return (
		<div className="flex min-w-0 flex-col border border-(--crt-dim)/60 bg-(--crt-well)">
			<div className="flex justify-between gap-2.5 border-b border-(--crt-dim)/45 px-3.5 py-2.25 text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
				<span>JUDGE LOG</span>
				<span className={status.className}>{status.label}</span>
			</div>

			<div
				aria-live="polite"
				className="flex min-h-[200px] flex-col gap-0.5 overflow-x-auto px-3.5 pt-2.75 pb-3.5 text-[12.5px] leading-[1.7] whitespace-pre"
			>
				{pending ? (
					<>
						<div className={TONE[PROMPT.tone]}>{PROMPT.text}</div>
						<div className="text-(--crt-amber)">
							<LoadingText label="▶ judging" />
						</div>
					</>
				) : result ? (
					toLogLines(result).map((line) => (
						<div key={line.text} className={TONE[line.tone]}>
							{line.text}
						</div>
					))
				) : (
					<>
						<div className={TONE.dim}>$ waiting for a submission</div>
						<div className={TONE.dim}>Ctrl/⌘+Enter submits from the editor</div>
					</>
				)}
			</div>
		</div>
	);
}
