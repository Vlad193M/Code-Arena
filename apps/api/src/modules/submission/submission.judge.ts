import { isDeepStrictEqual } from "node:util";
import {
	type Value,
	type ValueType,
	type Verdict,
	valueSchema,
} from "@codearena/shared";
import type { ExecutionResult } from "../execution/execution.schemas";

export const RESULT_MARKER = "__CODEARENA_RESULT__";

const FLOAT_TOLERANCE = 1e-6;

/**
 * The value after the last marker line, if it decodes and fits `type`. Lines
 * before it are the player's debug output and are ignored.
 */
export function decodeResult(stdout: string, type: ValueType): Value | null {
	const line = stdout
		.split("\n")
		.findLast((candidate) => candidate.startsWith(RESULT_MARKER));
	if (line === undefined) return null;

	let decoded: unknown;
	try {
		decoded = JSON.parse(line.slice(RESULT_MARKER.length));
	} catch {
		return null;
	}

	const result = valueSchema(type).safeParse(decoded);
	return result.success ? result.data : null;
}

/** Both values must already fit `type`. A `float` passes within an absolute
 * tolerance near zero and a relative one for large values. */
export function resultsMatch(
	actual: unknown,
	expected: unknown,
	type: ValueType,
): boolean {
	if (
		type === "float" &&
		typeof actual === "number" &&
		typeof expected === "number"
	) {
		return (
			Math.abs(actual - expected) <=
			FLOAT_TOLERANCE * Math.max(1, Math.abs(expected))
		);
	}
	return isDeepStrictEqual(actual, expected);
}

const FAILED_RUN_VERDICTS = {
	runtime_error: "RUNTIME_ERROR",
	timeout: "TIME_LIMIT_EXCEEDED",
	oom: "MEMORY_LIMIT_EXCEEDED",
} satisfies Record<Exclude<ExecutionResult["status"], "success">, Verdict>;

/** `actualOutput` is `null` when the run failed or returned nothing usable. */
export function judgeCase(
	execution: ExecutionResult,
	expected: unknown,
	type: ValueType,
): { verdict: Verdict; actualOutput: Value | null } {
	if (execution.status !== "success") {
		return {
			verdict: FAILED_RUN_VERDICTS[execution.status],
			actualOutput: null,
		};
	}

	const actualOutput = decodeResult(execution.stdout, type);
	const accepted =
		actualOutput !== null && resultsMatch(actualOutput, expected, type);
	return { verdict: accepted ? "ACCEPTED" : "WRONG_ANSWER", actualOutput };
}

export function overallVerdict(verdicts: Verdict[]): Verdict {
	return verdicts.find((verdict) => verdict !== "ACCEPTED") ?? "ACCEPTED";
}
