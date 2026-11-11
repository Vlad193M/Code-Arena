import type {
	MatchProblem,
	ProblemSignature,
	Verdict,
} from "@codearena/shared";

export type CaseInput = MatchProblem["examples"][number]["input"];

export function formatValue(value: unknown) {
	return JSON.stringify(value);
}

export function formatArguments(signature: ProblemSignature, input: CaseInput) {
	return signature.params
		.map((param, index) => `${param.name} = ${formatValue(input[index])}`)
		.join(", ");
}

export function formatVerdict(verdict: Verdict) {
	return verdict.replaceAll("_", " ");
}
