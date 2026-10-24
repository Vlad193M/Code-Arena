import type {
	Difficulty,
	MatchProblem,
	ProblemSignature,
} from "@codearena/shared";
import { memo, useState } from "react";
import Markdown, { type Components } from "react-markdown";

type ProblemPanelProps = {
	problem: MatchProblem;
};

const DIFFICULTY_TONE: Record<Difficulty, string> = {
	EASY: "border-(--crt-green)/55 text-(--crt-green)",
	MEDIUM: "border-(--crt-amber)/55 text-(--crt-amber)",
	HARD: "border-(--crt-red)/55 text-(--crt-red)",
};

const KEY = "text-(--crt-dim)";
const VALUE = "font-code text-(--crt-code)";

function SectionLabel({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`text-[11px] tracking-[0.14em] uppercase text-(--crt-dim) ${className}`}
		>
			── {children}
		</div>
	);
}

const StatementHeading: Components["h1"] = ({ children }) => (
	<SectionLabel className="mt-2">{children}</SectionLabel>
);

const STATEMENT_COMPONENTS: Components = {
	p: ({ node: _, ...props }) => <p className="m-0" {...props} />,
	h1: StatementHeading,
	h2: StatementHeading,
	h3: StatementHeading,
	strong: ({ node: _, ...props }) => (
		<strong className="font-semibold text-(--crt-amber)" {...props} />
	),
	ul: ({ node: _, ...props }) => (
		<ul
			className="m-0 flex list-none flex-col gap-0.5 pl-0 text-xs leading-[1.6] tracking-[0.03em] text-(--crt-amber)"
			{...props}
		/>
	),
	ol: ({ node: _, ...props }) => (
		<ol
			className="m-0 flex list-decimal flex-col gap-0.5 pl-5 text-xs leading-[1.6] tracking-[0.03em] text-(--crt-amber) marker:text-(--crt-dim)"
			{...props}
		/>
	),
	code: ({ node: _, ...props }) => (
		<code
			className="rounded-none border border-(--crt-dim)/50 bg-(--crt-ink) px-1.25 py-0 font-code text-[1em] text-(--crt-code)"
			{...props}
		/>
	),
	pre: ({ node: _, ...props }) => (
		<pre
			className="m-0 overflow-x-auto border border-(--crt-dim)/50 bg-(--crt-well) px-2.5 py-2 font-code text-[12.5px] text-(--crt-code) [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0"
			{...props}
		/>
	),
	a: ({ node: _, ...props }) => (
		<a target="_blank" rel="noreferrer" className="underline" {...props} />
	),
};

/** Language-neutral on purpose: the same problem is solved in JS and Python. */
function formatSignature({
	functionName,
	params,
	returnType,
}: ProblemSignature) {
	const args = params.map((p) => `${p.name}: ${p.type}`).join(", ");
	return `${functionName}(${args}) → ${returnType}`;
}

function formatArguments(
	signature: ProblemSignature,
	input: MatchProblem["examples"][number]["input"],
) {
	return signature.params
		.map((param, index) => `${param.name} = ${JSON.stringify(input[index])}`)
		.join(", ");
}

/** Memoized: the match countdown re-renders the room 4× a second, and the
 * statement's Markdown would be re-parsed on every tick. */
export default memo(function ProblemPanel({ problem }: ProblemPanelProps) {
	const [open, setOpen] = useState(true);

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				title="Show problem"
				className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 border border-(--crt-amber)/55 bg-(--crt-amber)/4 py-3 font-[inherit] text-xs tracking-[0.14em] text-(--crt-amber) hover:bg-(--crt-amber)/10"
			>
				<span>▼</span>
				<span>PROBLEM</span>
			</button>
		);
	}

	return (
		<div className="flex flex-col border border-(--crt-amber)/55 bg-[linear-gradient(180deg,rgba(255,176,0,0.035),rgba(255,176,0,0.01))]">
			<div className="flex items-center justify-between gap-2.5 border-b border-(--crt-dim)/50 pl-3.5 text-[11.5px] tracking-[0.12em] text-(--crt-dim)">
				<span>PROBLEM</span>
				<button
					type="button"
					onClick={() => setOpen(false)}
					title="Collapse"
					className="min-h-9 min-w-10 cursor-pointer border-0 border-l border-(--crt-dim)/50 bg-transparent font-[inherit] text-[13px] text-(--crt-dim) hover:text-(--crt-amber)"
				>
					▲
				</button>
			</div>

			<div className="flex flex-col gap-4.5 p-4">
				<div className="flex flex-wrap items-center gap-3">
					<span className="crt-glow text-[clamp(15px,1.7vw,19px)] font-semibold tracking-[0.02em]">
						{problem.title}
					</span>
					<span
						className={`border px-2 py-0.5 text-[11.5px] tracking-[0.12em] ${DIFFICULTY_TONE[problem.difficulty]}`}
					>
						{problem.difficulty}
					</span>
				</div>

				<div className="flex flex-col gap-2.5 text-[13.5px] leading-[1.7] text-pretty text-(--crt-prose)">
					<Markdown components={STATEMENT_COMPONENTS}>
						{problem.statement}
					</Markdown>
				</div>

				<div className="flex flex-col gap-2">
					<SectionLabel>EXAMPLES</SectionLabel>
					{problem.examples.map((example, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: examples are a fixed, ordered list with no identity of their own
							key={index}
							className="overflow-x-auto border border-(--crt-dim)/50 bg-(--crt-well) px-2.5 py-2 text-[12.5px] leading-[1.65] whitespace-pre"
						>
							<span className={KEY}>in</span>{" "}
							<span className={VALUE}>
								{formatArguments(problem.signature, example.input)}
							</span>{" "}
							<span className={KEY}>→</span>{" "}
							<span className={VALUE}>
								{JSON.stringify(example.expectedOutput)}
							</span>
						</div>
					))}
				</div>

				<div className="flex flex-col gap-1.5 text-xs leading-[1.6] tracking-[0.03em]">
					<SectionLabel>SPECS</SectionLabel>
					<div>
						<span className={KEY}>TIME_LIMIT:</span> {problem.timeLimitMs}ms
						&nbsp; <span className={KEY}>MEM:</span> {problem.memoryLimitMb}MB
					</div>
					<div className="overflow-x-auto whitespace-pre">
						<span className={KEY}>SIGNATURE:</span>{" "}
						<span className={VALUE}>{formatSignature(problem.signature)}</span>
					</div>
				</div>
			</div>
		</div>
	);
});
