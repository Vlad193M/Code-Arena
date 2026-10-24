import { z } from "zod";

/** Mirrors Prisma's `Difficulty` — kept as a literal union here so `shared`
 * never depends on the generated Prisma client. */
export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export type Difficulty = z.infer<typeof difficultySchema>;

/** Every type must map to a native type in each supported language, so the set
 * stays deliberately small. */
export const valueTypeSchema = z.enum([
	"int",
	"float",
	"string",
	"bool",
	"int[]",
	"string[]",
	"int[][]",
]);
export type ValueType = z.infer<typeof valueTypeSchema>;

const intSchema = z.number().int();

const valueSchemas = {
	int: intSchema,
	float: z.number(),
	string: z.string(),
	bool: z.boolean(),
	"int[]": z.array(intSchema),
	"string[]": z.array(z.string()),
	"int[][]": z.array(z.array(intSchema)),
} satisfies Record<ValueType, z.ZodType>;

/** Names end up interpolated into executed wrapper code and generated starter
 * code, so anything beyond a plain identifier is rejected. */
const identifierSchema = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/);

export const problemSignatureSchema = z
	.object({
		functionName: identifierSchema.meta({ example: "twoSum" }),
		params: z
			.array(z.object({ name: identifierSchema, type: valueTypeSchema }))
			.min(1)
			.refine(
				(params) => new Set(params.map((p) => p.name)).size === params.length,
				"Parameter names must be unique",
			),
		returnType: valueTypeSchema,
	})
	.meta({
		id: "ProblemSignature",
		description: "The function a player implements for a problem",
	});
export type ProblemSignature = z.infer<typeof problemSignatureSchema>;

/** Visible test cases only, as examples: hidden cases and anything that
 * identifies a test case stay server-side. */
export const matchProblemSchema = z
	.object({
		title: z.string().meta({ example: "Two Sum" }),
		difficulty: difficultySchema,
		statement: z.string(),
		timeLimitMs: z.number().int().meta({ example: 1000 }),
		memoryLimitMb: z.number().int().meta({ example: 128 }),
		signature: problemSignatureSchema,
		examples: z.array(
			z.object({
				input: z.array(z.json()).meta({ example: [[2, 7, 11, 15], 9] }),
				expectedOutput: z.json().meta({ example: [0, 1] }),
			}),
		),
	})
	.meta({
		id: "MatchProblem",
		description: "The problem a match is played on",
	});
export type MatchProblem = z.infer<typeof matchProblemSchema>;

export function testCaseDataSchema(signature: ProblemSignature) {
	const [first, ...rest] = signature.params.map((p) => valueSchemas[p.type]);
	if (!first) {
		throw new Error("A signature must declare at least one parameter");
	}

	return z.object({
		input: z.tuple([first, ...rest]),
		expectedOutput: valueSchemas[signature.returnType],
	});
}
