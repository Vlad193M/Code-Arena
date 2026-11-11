import type {
	MatchProblem,
	SubmissionResult,
	Verdict,
} from "@codearena/shared";
import {
	type CaseInput,
	formatArguments,
	formatValue,
	formatVerdict,
} from "../../formatValues";

type VisibleCasesProps = {
	problem: MatchProblem;
	result: SubmissionResult | null;
	pending: boolean;
};

type VisibleCase = {
	input: CaseInput;
	expectedOutput: unknown;
	outcome: {
		verdict: Verdict;
		actualOutput: unknown;
		error: string | null;
	} | null;
};

const KEY = "inline-block w-11 text-(--crt-dim)";
const VALUE = "font-code text-(--crt-code)";

function toVisibleCases(
	problem: MatchProblem,
	result: SubmissionResult | null,
	pending: boolean,
): VisibleCase[] {
	if (!result || pending) {
		return problem.examples.map((example) => ({ ...example, outcome: null }));
	}

	return result.cases.flatMap((testCase) =>
		testCase.hidden
			? []
			: [
					{
						input: testCase.input,
						expectedOutput: testCase.expectedOutput,
						outcome: {
							verdict: testCase.verdict,
							actualOutput: testCase.actualOutput,
							error: testCase.error,
						},
					},
				],
	);
}

function CaseMark({
	outcome,
	pending,
}: Pick<VisibleCase, "outcome"> & { pending: boolean }) {
	if (pending) {
		return (
			<span className="animate-pulse font-semibold text-(--crt-amber)">▶</span>
		);
	}
	if (!outcome) return <span className="text-(--crt-dim)">·</span>;

	const passed = outcome.verdict === "ACCEPTED";
	return (
		<span
			className={`font-semibold ${passed ? "text-(--crt-green)" : "text-(--crt-red)"}`}
		>
			{passed ? "✓" : "✗"}
		</span>
	);
}

/** The judge sends `null` when no value of the expected type came back. */
function formatGot(outcome: NonNullable<VisibleCase["outcome"]>) {
	if (outcome.actualOutput !== null) return formatValue(outcome.actualOutput);
	return outcome.verdict === "WRONG_ANSWER"
		? "no valid return value"
		: formatVerdict(outcome.verdict);
}

export default function VisibleCases({
	problem,
	result,
	pending,
}: VisibleCasesProps) {
	const cases = toVisibleCases(problem, result, pending);
	const passed = cases.filter(
		({ outcome }) => outcome?.verdict === "ACCEPTED",
	).length;
	const summary = pending
		? "RUNNING"
		: result
			? `${passed}/${cases.length} PASSED`
			: "NOT RUN";

	return (
		<div className="min-w-0 border border-(--crt-dim)/60 bg-black/20">
			<div className="flex justify-between gap-2.5 border-b border-(--crt-dim)/45 px-3.5 py-2.25 text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
				<span>VISIBLE TEST CASES</span>
				<span>{summary}</span>
			</div>

			<div className="flex flex-col">
				{cases.map((testCase, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: cases are a fixed, ordered list with no identity of their own
						key={index}
						className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5 border-b border-(--crt-dim)/20 px-3.5 py-2.75 text-[13px] leading-[1.65] last:border-b-0"
					>
						<CaseMark outcome={testCase.outcome} pending={pending} />
						<div className="flex min-w-0 flex-col overflow-x-auto whitespace-pre">
							<div>
								<span className={KEY}>in</span>
								<span className={VALUE}>
									{formatArguments(problem.signature, testCase.input)}
								</span>
							</div>
							<div>
								<span className={KEY}>want</span>
								<span className={VALUE}>
									{formatValue(testCase.expectedOutput)}
								</span>
							</div>
							<div>
								<span className={KEY}>got</span>
								{testCase.outcome ? (
									<span
										className={`font-code ${testCase.outcome.verdict === "ACCEPTED" ? "text-(--crt-green)" : "text-(--crt-red)"}`}
									>
										{formatGot(testCase.outcome)}
									</span>
								) : (
									<span className="text-(--crt-dim)">
										{pending ? "running…" : "—"}
									</span>
								)}
							</div>
							{testCase.outcome?.error ? (
								<div className="font-code text-xs whitespace-pre-wrap text-(--crt-red)">
									{testCase.outcome.error}
								</div>
							) : null}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
