import { describe, expect, test } from "vitest";
import { execute } from "../execution/execution.service";
import { wrapJavaScript } from "./javascript.wrapper";
import {
	decodeResult,
	judgeCase,
	overallVerdict,
	RESULT_MARKER,
	resultsMatch,
} from "./submission.judge";

const printed = (output: string) => ({
	status: "success" as const,
	stdout: `${RESULT_MARKER}${output}\n`,
	durationMs: 1,
});
const failed = (status: "timeout" | "oom") => ({
	status,
	stdout: "",
	durationMs: 1,
});

describe("decodeResult", () => {
	test("takes the value after the last marker and ignores debug output", () => {
		const stdout = `debug\n${RESULT_MARKER}[9]\nmore debug\n${RESULT_MARKER}[0,1]\n`;
		expect(decodeResult(stdout, "int[]")).toEqual([0, 1]);
	});

	test.each([
		["no marker", "[0,1]\n"],
		["undefined return", `${RESULT_MARKER}undefined\n`],
		["invalid JSON", `${RESULT_MARKER}[0,\n`],
		["wrong type", `${RESULT_MARKER}"0,1"\n`],
		["null for a non-null type", `${RESULT_MARKER}null\n`],
	])("%s decodes to null", (_, stdout) => {
		expect(decodeResult(stdout, "int[]")).toBeNull();
	});
});

describe("resultsMatch", () => {
	test("compares structure, not text", () => {
		expect(resultsMatch([[1, 2], [3]], [[1, 2], [3]], "int[][]")).toBe(true);
		expect(resultsMatch([1, 0], [0, 1], "int[]")).toBe(false);
	});

	test("floats match within tolerance", () => {
		expect(resultsMatch(0.1 + 0.2, 0.3, "float")).toBe(true);
		expect(resultsMatch(1e12 + 1, 1e12, "float")).toBe(true);
		expect(resultsMatch(0.31, 0.3, "float")).toBe(false);
	});

	test("ints match exactly", () => {
		expect(resultsMatch(1e12 + 1, 1e12, "int")).toBe(false);
	});
});

describe("verdicts", () => {
	test.each([
		["correct output", printed("[0,1]"), "ACCEPTED", [0, 1]],
		["different output", printed("[1,0]"), "WRONG_ANSWER", [1, 0]],
		["undecodable output", printed("undefined"), "WRONG_ANSWER", null],
		["timeout", failed("timeout"), "TIME_LIMIT_EXCEEDED", null],
		["out of memory", failed("oom"), "MEMORY_LIMIT_EXCEEDED", null],
		[
			"runtime error",
			{ ...printed("[0,1]"), status: "runtime_error", error: "x" },
			"RUNTIME_ERROR",
			null,
		],
	] as const)("%s → %s", (_, execution, verdict, actualOutput) => {
		expect(judgeCase(execution, [0, 1], "int[]")).toEqual({
			verdict,
			actualOutput,
		});
	});

	test("overall verdict is the first failure", () => {
		expect(overallVerdict(["ACCEPTED", "ACCEPTED"])).toBe("ACCEPTED");
		expect(
			overallVerdict(["ACCEPTED", "TIME_LIMIT_EXCEEDED", "WRONG_ANSWER"]),
		).toBe("TIME_LIMIT_EXCEEDED");
		expect(overallVerdict([])).toBe("ACCEPTED");
	});
});

describe.concurrent("JavaScript wrapper in the engine", () => {
	const run = (code: string, args: unknown[]) =>
		execute({
			language: "javascript",
			code: wrapJavaScript(code, "solve"),
			stdin: JSON.stringify(args),
			limits: { timeMs: 500, memoryMb: 32 },
		});

	test("passes arguments in order and prints the result after the marker", async () => {
		const result = await run(
			"function solve(nums, k) { console.log('debug', k); return nums.map((n) => n * k); }",
			[[1, 2], 3],
		);
		expect(result.status).toBe("success");
		expect(decodeResult(result.stdout, "int[]")).toEqual([3, 6]);
	});

	test("works with arrow functions and a trailing line comment", async () => {
		const result = await run("const solve = (a) => [a] // done", [7]);
		expect(decodeResult(result.stdout, "int[]")).toEqual([7]);
	});

	test("missing return decodes to null", async () => {
		const result = await run("function solve() {}", [1]);
		expect(result.status).toBe("success");
		expect(decodeResult(result.stdout, "int[]")).toBeNull();
	});

	test("missing function is a runtime error", async () => {
		const result = await run("function other() {}", [1]);
		expect(result).toMatchObject({
			status: "runtime_error",
			error: expect.stringMatching(/^ReferenceError/),
		});
	});
});
