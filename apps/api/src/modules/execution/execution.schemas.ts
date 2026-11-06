import { z } from "zod";

export const MAX_STDOUT_LENGTH = 64 * 1024;
export const MAX_ERROR_LENGTH = 4 * 1024;
export const OUTPUT_LIMIT_ERROR = "Output limit exceeded";

export const executionRequestSchema = z.object({
	language: z.literal("javascript"),
	code: z.string().max(100_000),
	stdin: z.string().max(1_000_000),
	limits: z.object({
		timeMs: z.number().int().positive().max(10_000),
		memoryMb: z.number().int().min(8).max(512),
	}),
});

const outcome = {
	stdout: z.string().max(MAX_STDOUT_LENGTH),
	durationMs: z.number().nonnegative(),
};

export const executionResultSchema = z.discriminatedUnion("status", [
	z.object({ status: z.literal("success"), ...outcome }),
	z.object({
		status: z.literal("runtime_error"),
		error: z.string().max(MAX_ERROR_LENGTH),
		...outcome,
	}),
	z.object({ status: z.literal("timeout"), ...outcome }),
	z.object({ status: z.literal("oom"), ...outcome }),
]);

/** Messages from the runner process: `started` just before user code runs. */
export const runnerMessageSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("started") }),
	z.object({ type: z.literal("result"), result: executionResultSchema }),
]);

export type ExecutionRequest = z.infer<typeof executionRequestSchema>;
export type ExecutionResult = z.infer<typeof executionResultSchema>;
export type RunnerMessage = z.infer<typeof runnerMessageSchema>;
