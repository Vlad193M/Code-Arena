import type { CaseResult, SubmissionResult } from "@codearena/shared";
import LoadingText from "#/ui/LoadingText";
import { formatVerdict } from "../../formatValues";

type TestCellsProps = {
	result: SubmissionResult | null;
	pending: boolean;
};

const CELL =
	"flex h-6.5 w-7.5 items-center justify-center border text-xs font-semibold";

const PASS =
	"border-(--crt-green) bg-(--crt-green)/85 text-[#0f1a0f] shadow-[0_0_10px_rgba(51,255,102,0.45)]";
const FAIL =
	"border-(--crt-red) bg-(--crt-red)/85 text-[#1c0d0d] shadow-[0_0_10px_rgba(255,68,68,0.45)]";
const PENDING =
	"border-(--crt-dim)/75 bg-[repeating-linear-gradient(45deg,rgba(122,92,56,0.28)_0px,rgba(122,92,56,0.28)_2px,transparent_2px,transparent_5px)]";

function cellMark(testCase: CaseResult) {
	if (testCase.verdict === "ACCEPTED") return "✓";
	if (testCase.verdict === "TIME_LIMIT_EXCEEDED") return "⏱";
	return "✗";
}

export default function TestCells({ result, pending }: TestCellsProps) {
	if (!result) {
		return (
			<span className="text-[13px] tracking-[0.04em] text-(--crt-dim)">
				{pending ? <LoadingText label="JUDGING" /> : "NOT SUBMITTED YET"}
			</span>
		);
	}

	const countTone = pending
		? "text-(--crt-dim)"
		: result.passed === result.total
			? "text-(--crt-green)"
			: "text-(--crt-amber)";

	return (
		<div className="flex flex-wrap items-center gap-3">
			<div className="flex flex-wrap gap-1">
				{result.cases.map((testCase, index) => {
					const passed = testCase.verdict === "ACCEPTED";
					const label = `Test ${index + 1}${testCase.hidden ? " (hidden)" : ""}`;

					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: cases are a fixed, ordered list with no identity of their own
							key={index}
							title={`${label}: ${pending ? "pending" : formatVerdict(testCase.verdict)}`}
							className={`${CELL} ${pending ? PENDING : passed ? PASS : FAIL}`}
						>
							{pending ? null : cellMark(testCase)}
						</div>
					);
				})}
			</div>
			<span className={`text-[13px] font-semibold ${countTone}`}>
				{pending ? (
					<LoadingText label="JUDGING" />
				) : (
					`${result.passed}/${result.total} PASSED`
				)}
			</span>
		</div>
	);
}
