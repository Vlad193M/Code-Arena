import { z } from "zod";
import { testCaseExampleSchema } from "./problem.schemas";

/** Mirrors Prisma's `Verdict`. A submission's verdict is its first failed
 * case's, or `ACCEPTED` when every case passed. */
export const verdictSchema = z
	.enum([
		"ACCEPTED",
		"WRONG_ANSWER",
		"RUNTIME_ERROR",
		"TIME_LIMIT_EXCEEDED",
		"MEMORY_LIMIT_EXCEEDED",
	])
	.meta({ id: "Verdict" });
export type Verdict = z.infer<typeof verdictSchema>;

export const caseResultSchema = z.discriminatedUnion("hidden", [
	z.object({
		hidden: z.literal(false),
		verdict: verdictSchema,
		durationMs: z.number().nonnegative(),
		...testCaseExampleSchema.shape,
		actualOutput: z.json().meta({
			description: "`null` when the code returned nothing usable",
			example: [0, 1],
		}),
		error: z.string().nullable(),
	}),
	/** Only the verdict: the player's code controls everything else that comes
	 * from running it — output, error text, even its duration — so any of it
	 * could carry the case's input out. */
	z.object({ hidden: z.literal(true), verdict: verdictSchema }),
]);
export type CaseResult = z.infer<typeof caseResultSchema>;

export const submissionResultSchema = z
	.object({
		id: z.cuid(),
		verdict: verdictSchema,
		passed: z.number().int().nonnegative().meta({ example: 5 }),
		total: z.number().int().nonnegative().meta({ example: 6 }),
		cases: z.array(caseResultSchema),
	})
	.meta({
		id: "SubmissionResult",
		description: "How a submission did on every test case of the problem",
	});
export type SubmissionResult = z.infer<typeof submissionResultSchema>;
