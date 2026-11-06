import { describe, expect, test } from "vitest";
import {
	type ExecutionRequest,
	type ExecutionResult,
	MAX_ERROR_LENGTH,
	MAX_STDOUT_LENGTH,
	OUTPUT_LIMIT_ERROR,
} from "./execution.schemas";
import { execute } from "./execution.service";
import { ALLOWED_GLOBALS } from "./javascript.sandbox";

const TIME_LIMIT_MS = 500;
const INFINITE_LOOP = "while (true) {}";
const MEMORY_BOMB =
	"const a = []; while (true) a.push(new Array(1e5).fill(1));";

const request = (overrides: Partial<ExecutionRequest>): ExecutionRequest => ({
	language: "javascript",
	code: "",
	stdin: "",
	limits: { timeMs: TIME_LIMIT_MS, memoryMb: 32 },
	...overrides,
});

const run = (code: string, { stdin = "", memoryMb = 32 } = {}) =>
	execute(
		request({ code, stdin, limits: { timeMs: TIME_LIMIT_MS, memoryMb } }),
	);

/** The isolate stopped the code itself, well before the runner's kill timer. */
const expectStoppedBySandbox = (result: ExecutionResult) =>
	expect(result.durationMs).toBeLessThan(TIME_LIMIT_MS + 500);

describe.concurrent("normal code", () => {
	test("reads stdin and prints to stdout", async () => {
		const result = await run(
			"const [a, b] = JSON.parse(__stdin); console.log(a + b);",
			{ stdin: "[3, 4]" },
		);
		expect(result).toMatchObject({ status: "success", stdout: "7\n" });
	});

	test("joins console arguments like Node does", async () => {
		const result = await run("console.log('a', 1, null, [1, 2]);");
		expect(result.stdout).toBe("a 1 null 1,2\n");
	});
});

describe.concurrent("runtime errors are returned, not thrown", () => {
	test("thrown Error", async () => {
		const result = await run("console.log('before'); throw new Error('boom');");
		expect(result).toMatchObject({
			status: "runtime_error",
			error: "Error: boom",
			stdout: "before\n",
		});
	});

	test("syntax error", async () => {
		expect(await run("const = ;")).toMatchObject({
			status: "runtime_error",
			error: expect.stringMatching(/^SyntaxError/),
		});
	});

	test("thrown non-Error values", async () => {
		const [number, symbol] = await Promise.all([
			run("throw 5"),
			run("throw Symbol('s')"),
		]);
		expect(number).toMatchObject({ error: "Uncaught 5" });
		expect(symbol).toMatchObject({ error: "Uncaught Symbol(s)" });
	});

	test("unhandled rejection", async () => {
		expect(await run("Promise.reject(new Error('plain'));")).toMatchObject({
			status: "runtime_error",
			error: "Unhandled rejection: Error: plain",
		});
	});

	test("error thrown in an async function", async () => {
		const result = await run(
			"(async () => { await 0; throw new TypeError('later'); })();",
		);
		expect(result).toMatchObject({
			status: "runtime_error",
			error: "Unhandled rejection: TypeError: later",
		});
	});

	test("huge thrown value is cut inside the sandbox", async () => {
		const result = await run("throw 'x'.repeat(30 * 1024 * 1024);", {
			memoryMb: 128,
		});
		expect(result.status).toBe("runtime_error");
		expect(result).toHaveProperty("error.length", MAX_ERROR_LENGTH);
	});

	test("huge unhandled rejection is cut to the error limit", async () => {
		const result = await run(
			"Promise.reject(new Error('x'.repeat(45 * 1024 * 1024)));",
			{ memoryMb: 128 },
		);
		expect(result.status).toBe("runtime_error");
		expect(result).toHaveProperty("error.length", MAX_ERROR_LENGTH);
	});
});

describe.concurrent("time limit", () => {
	test("infinite loop", async () => {
		const result = await run(INFINITE_LOOP);
		expect(result.status).toBe("timeout");
		expect(result.durationMs).toBeGreaterThanOrEqual(TIME_LIMIT_MS - 50);
		expectStoppedBySandbox(result);
	});

	test("endless microtask chain", async () => {
		const result = await run(
			"function loop() { Promise.resolve().then(loop); } loop();",
		);
		expect(result.status).toBe("timeout");
		expectStoppedBySandbox(result);
	});

	test("thrown object whose getters never return", async () => {
		const result = await run(
			"const e = new Error(); Object.defineProperty(e, 'message', { get() { while (true) {} } }); throw e;",
		);
		expect(result.status).toBe("timeout");
		expectStoppedBySandbox(result);
	});

	test("value whose toString never returns", async () => {
		const results = await Promise.all([
			run("throw { toString() { while (true) {} } }"),
			run("console.log({ toString() { while (true) {} } })"),
		]);
		for (const result of results) {
			expect(result.status).toBe("timeout");
			expectStoppedBySandbox(result);
		}
	});

	test("rejection whose getters never return still settles as timeout", async () => {
		const result = await run(
			"(async () => { await 0; throw { get message() { while (true) {} } }; })();",
		);
		expect(result.status).toBe("timeout");
	});
});

describe.concurrent("memory limit", () => {
	test("unbounded array growth", async () => {
		expect((await run(MEMORY_BOMB)).status).toBe("oom");
	});

	test("array buffer over the limit", async () => {
		const result = await run("new ArrayBuffer(500 * 1024 * 1024);");
		expect(result.status).toBe("oom");
	});

	test("only allowed globals are left", async () => {
		const result = await run(
			"console.log(Object.getOwnPropertyNames(globalThis).sort().join());",
		);
		expect(result.stdout).toBe(`${[...ALLOWED_GLOBALS].sort().join()}\n`);
	});

	test("unmetered prototype methods are removed", async () => {
		const result = await run(`
			const own = (proto, names) => names.filter((n) => Object.hasOwn(proto, n));
			console.log(own(ArrayBuffer.prototype, ["resize", "transfer", "transferToFixedLength"]).length);
			console.log(own(Date.prototype, ["toLocaleString", "toLocaleDateString", "toLocaleTimeString"]).length);
		`);
		expect(result.stdout).toBe("0\n0\n");
	});
});

describe.concurrent("no access to the host", () => {
	test("Node and network globals are missing", async () => {
		const result = await run(
			"console.log(typeof process, typeof require, typeof module, typeof fetch, typeof Buffer, typeof setTimeout, typeof __write);",
		);
		expect(result.stdout).toBe(`${Array(7).fill("undefined").join(" ")}\n`);
	});

	test("constructor chain stays inside the sandbox", async () => {
		const result = await run(`
			console.log(this.constructor.constructor("return typeof process")());
			console.log(console.log.constructor("return typeof process")());
		`);
		expect(result.stdout).toBe("undefined\nundefined\n");
	});
});

describe.concurrent("output limit", () => {
	const outputLimit = { status: "runtime_error", error: OUTPUT_LIMIT_ERROR };

	test("endless printing is cut off", async () => {
		const result = await run("while (true) console.log('x'.repeat(1000));");
		expect(result).toMatchObject(outputLimit);
		expect(result.stdout.length).toBeLessThanOrEqual(MAX_STDOUT_LENGTH);
		expect(result.durationMs).toBeLessThan(TIME_LIMIT_MS);
	});

	test("swallowing the limit error does not hide it", async () => {
		const result = await run(
			"while (true) { try { console.log('x'.repeat(1000)); } catch {} }",
		);
		expect(result).toMatchObject(outputLimit);
		expectStoppedBySandbox(result);
	});

	test("one huge line is cut inside the sandbox", async () => {
		const result = await run(
			"String.prototype.slice = function () { return this; }; console.log('x'.repeat(100 * 1024 * 1024));",
			{ memoryMb: 512 },
		);
		expect(result).toMatchObject(outputLimit);
		expect(result.stdout.length).toBeLessThanOrEqual(MAX_STDOUT_LENGTH);
	});
});

describe("concurrent runs", () => {
	test("hostile runs in parallel each get their own result", async () => {
		const results = await Promise.all([
			run(INFINITE_LOOP),
			run(MEMORY_BOMB),
			run("throw new Error('boom');"),
			run("console.log('ok');"),
		]);
		expect(results.map((r) => r.status)).toEqual([
			"timeout",
			"oom",
			"runtime_error",
			"success",
		]);
	});

	test("slow runner startup is not charged to the code", async () => {
		const results = await Promise.all(
			Array.from({ length: 60 }, () =>
				execute(
					request({
						code: "console.log(1);",
						limits: { timeMs: 100, memoryMb: 32 },
					}),
				),
			),
		);
		expect(results.every((r) => r.status === "success")).toBe(true);
	});
});

describe.concurrent("engine contract", () => {
	test("rejects requests the engine cannot honour", async () => {
		const invalid = [
			request({ limits: { timeMs: 100, memoryMb: 1 } }),
			request({ limits: { timeMs: 3e9, memoryMb: 32 } }),
			request({ code: "x".repeat(100_001) }),
			request({ stdin: "x".repeat(1_000_001) }),
		];
		for (const input of invalid) {
			await expect(execute(input)).rejects.toThrow();
		}
	});
});
