import ivm from "isolated-vm";
import {
	type ExecutionRequest,
	type ExecutionResult,
	executionRequestSchema,
	MAX_ERROR_LENGTH,
	MAX_STDOUT_LENGTH,
	OUTPUT_LIMIT_ERROR,
	type RunnerMessage,
} from "./execution.schemas.ts";
import { BOOTSTRAP } from "./javascript.sandbox.ts";

const TIMEOUT_MESSAGE = "Script execution timed out.";
const ARRAY_BUFFER_OOM_ERROR = "RangeError: Array buffer allocation failed";

const send = (message: RunnerMessage) =>
	new Promise<void>((resolve, reject) => {
		if (!process.send) {
			reject(new Error("The runner needs an IPC channel to its parent"));
			return;
		}
		process.send(message, (error: Error | null) =>
			error ? reject(error) : resolve(),
		);
	});

const unhandledRejection = (error: unknown) =>
	error instanceof Error
		? `Unhandled rejection: ${error.name}: ${error.message}`.slice(
				0,
				MAX_ERROR_LENGTH,
			)
		: "Unhandled rejection";

async function runJavaScript({
	code,
	stdin,
	limits,
}: ExecutionRequest): Promise<ExecutionResult> {
	const isolate = new ivm.Isolate({ memoryLimit: limits.memoryMb });
	let stdout = "";
	let outputExceeded = false;

	try {
		const context = isolate.createContextSync();
		context.global.setSync("__stdin", stdin);
		context.global.setSync(
			"__write",
			new ivm.Callback((line: unknown) => {
				if (!outputExceeded && typeof line === "string") {
					stdout += `${line}\n`;
					outputExceeded = stdout.length > MAX_STDOUT_LENGTH;
				}
				return !outputExceeded;
			}),
		);
		const run: ivm.Reference = context.evalSync(BOOTSTRAP, {
			reference: true,
		});

		await send({ type: "started" });

		const startedAt = performance.now();
		let returned: unknown = null;
		let interruption: unknown = null;
		try {
			returned = run.applySync(undefined, [code], { timeout: limits.timeMs });
		} catch (error) {
			interruption = error;
		}
		const outcome = {
			stdout: stdout.slice(0, MAX_STDOUT_LENGTH),
			durationMs: Math.round(performance.now() - startedAt),
		};

		if (isolate.isDisposed || returned === ARRAY_BUFFER_OOM_ERROR) {
			return { status: "oom", ...outcome };
		}
		if (outputExceeded) {
			return { status: "runtime_error", error: OUTPUT_LIMIT_ERROR, ...outcome };
		}
		if (
			interruption instanceof Error &&
			interruption.message === TIMEOUT_MESSAGE
		) {
			return { status: "timeout", ...outcome };
		}
		if (interruption !== null) {
			const error = unhandledRejection(interruption);
			return { status: "runtime_error", error, ...outcome };
		}
		if (typeof returned === "string") {
			return { status: "runtime_error", error: returned, ...outcome };
		}
		return { status: "success", ...outcome };
	} finally {
		if (!isolate.isDisposed) isolate.dispose();
	}
}

process.once("message", async (message: unknown) => {
	const request = executionRequestSchema.parse(message);
	await send({ type: "result", result: await runJavaScript(request) });
});
