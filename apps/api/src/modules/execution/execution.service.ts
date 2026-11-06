import { fork } from "node:child_process";
import { AppError } from "../../lib/errors";
import { parseOrThrow } from "../../lib/validation";
import {
	type ExecutionRequest,
	type ExecutionResult,
	executionRequestSchema,
	type RunnerMessage,
	runnerMessageSchema,
} from "./execution.schemas";

const RUNNER_STARTUP_TIMEOUT_MS = 5_000;
const RUNNER_KILL_GRACE_MS = 1_000;
const RUNNER_HEAP_LIMIT_MB = 64;

const runnerExtension = import.meta.url.endsWith(".ts") ? ".ts" : ".js";

const RUNNERS = {
	javascript: new URL(`./javascript.runner${runnerExtension}`, import.meta.url),
} satisfies Record<ExecutionRequest["language"], URL>;

const elapsedSince = (start: number) => Math.round(performance.now() - start);

/**
 * Runs untrusted code in a fresh child process and sandbox.
 *
 * Resolves with whatever the code did, including timeouts, running out of
 * memory, and runtime errors. Rejects only when the engine itself fails,
 * which includes a runner that does not start in time.
 */
export async function execute(
	input: ExecutionRequest,
): Promise<ExecutionResult> {
	const request = parseOrThrow(
		executionRequestSchema,
		input,
		"Execution request",
	);

	return new Promise((resolve, reject) => {
		const runner = fork(RUNNERS[request.language], {
			env: {},
			execArgv: [
				`--max-old-space-size=${RUNNER_HEAP_LIMIT_MB}`,
				"--no-node-snapshot",
			],
			stdio: ["ignore", "ignore", "inherit", "ipc"],
		});

		let startedAt: number | null = null;
		let killTimer: NodeJS.Timeout | undefined;

		let settled = false;
		const settle = (finish: () => void) => {
			if (settled) return;
			settled = true;
			clearTimeout(startupTimer);
			clearTimeout(killTimer);
			runner.kill("SIGKILL");
			finish();
		};

		const startupTimer = setTimeout(() => {
			settle(() =>
				reject(
					new AppError("internal", "Execution runner did not start in time"),
				),
			);
		}, RUNNER_STARTUP_TIMEOUT_MS);

		const onStarted = () => {
			const start = performance.now();
			startedAt = start;
			clearTimeout(startupTimer);
			killTimer = setTimeout(() => {
				settle(() =>
					resolve({
						status: "timeout",
						stdout: "",
						durationMs: elapsedSince(start),
					}),
				);
			}, request.limits.timeMs + RUNNER_KILL_GRACE_MS);
		};

		runner.on("message", (raw: unknown) => {
			let message: RunnerMessage;
			try {
				message = parseOrThrow(runnerMessageSchema, raw, "Runner message");
			} catch (error) {
				settle(() => reject(error));
				return;
			}
			if (message.type === "started") {
				onStarted();
				return;
			}
			const { result } = message;
			settle(() => resolve(result));
		});
		runner.on("error", (error) => settle(() => reject(error)));
		runner.on("close", (code, signal) =>
			settle(() => {
				if (startedAt !== null) {
					resolve({
						status: "runtime_error",
						error: "Execution aborted",
						stdout: "",
						durationMs: elapsedSince(startedAt),
					});
					return;
				}
				console.error(
					`❌ Execution runner exited before starting (code ${code}, signal ${signal})`,
				);
				reject(new AppError("internal", "Execution runner failed to start"));
			}),
		);

		runner.send(request);
	});
}
