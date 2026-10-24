import {
	problemSignatureSchema,
	testCaseDataSchema,
} from "@codearena/shared";
import { prisma } from "../src/db/prisma.client.js";
import { parseOrThrow } from "../src/lib/validation.js";
import { type SeedProblem, seedProblems } from "./seed-problems.js";

/** Idempotent: re-running updates problems in place by `slug` and test cases by
 * position, and drops cases that were removed from the seed data. */
async function seedProblem({ signature, testCases, ...fields }: SeedProblem) {
	const parsedSignature = parseOrThrow(
		problemSignatureSchema,
		signature,
		`${fields.slug}: invalid signature`,
	);
	const caseSchema = testCaseDataSchema(parsedSignature);
	const cases = testCases.map((testCase, index) => ({
		...parseOrThrow(
			caseSchema,
			testCase,
			`${fields.slug}: test case #${index + 1} does not match the signature`,
		),
		isHidden: testCase.isHidden,
		order: index + 1,
	}));

	await prisma.$transaction(async (tx) => {
		const data = { ...fields, signature: parsedSignature };
		const problem = await tx.problem.upsert({
			where: { slug: fields.slug },
			create: data,
			update: data,
		});

		await tx.testCase.deleteMany({
			where: { problemId: problem.id, order: { gt: cases.length } },
		});
		for (const testCase of cases) {
			await tx.testCase.upsert({
				where: {
					problemId_order: { problemId: problem.id, order: testCase.order },
				},
				create: { ...testCase, problemId: problem.id },
				update: testCase,
			});
		}
	});
}

try {
	for (const problem of seedProblems) {
		await seedProblem(problem);
	}
	console.log(`Seeded ${seedProblems.length} problems`);
} finally {
	await prisma.$disconnect();
}
