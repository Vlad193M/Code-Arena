import {
	type CaseResult,
	problemSignatureSchema,
	type SubmissionResult,
	testCaseDataSchema,
} from "@codearena/shared";
import { prisma } from "../../db/prisma.client";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/errors";
import { parseOrThrow } from "../../lib/validation";
import { execute } from "../execution/execution.service";
import { assertIsParticipant } from "../match/match.service";
import { wrapJavaScript } from "./javascript.wrapper";
import { judgeCase, overallVerdict } from "./submission.judge";

/** Reads every test case, hidden ones included: all of them count toward the
 * verdict. */
const judgingMatchSelect = {
	hostId: true,
	guestId: true,
	status: true,
	problem: {
		select: {
			slug: true,
			signature: true,
			timeLimitMs: true,
			memoryLimitMb: true,
			testCases: {
				orderBy: { order: "asc" },
				select: { input: true, expectedOutput: true, isHidden: true },
			},
		},
	},
} satisfies Prisma.MatchSelect;

async function readInProgressMatch(matchId: string, userId: string) {
	const match = await prisma.match.findUnique({
		where: { id: matchId },
		select: judgingMatchSelect,
	});
	assertIsParticipant(match, userId);
	if (match.status !== "IN_PROGRESS") {
		throw new AppError("conflict", "Match is not in progress");
	}
	return match;
}

type JudgingProblem = Awaited<
	ReturnType<typeof readInProgressMatch>
>["problem"];

function parseProblem(problem: JudgingProblem) {
	const signature = parseOrThrow(
		problemSignatureSchema,
		problem.signature,
		`Problem ${problem.slug}: stored signature is invalid`,
	);
	const caseSchema = testCaseDataSchema(signature);
	const testCases = problem.testCases.map((testCase, index) => ({
		isHidden: testCase.isHidden,
		...parseOrThrow(
			caseSchema,
			testCase,
			`Problem ${problem.slug}: stored test case #${index + 1} does not match its signature`,
		),
	}));

	return {
		signature,
		limits: { timeMs: problem.timeLimitMs, memoryMb: problem.memoryLimitMb },
		testCases,
	};
}

/**
 * Runs the code against every test case, even after one fails, so the result
 * can say how many passed. Cases run one at a time: each starts its own
 * process.
 */
export async function submit(
	matchId: string,
	userId: string,
	code: string,
): Promise<SubmissionResult> {
	const match = await readInProgressMatch(matchId, userId);
	const { signature, limits, testCases } = parseProblem(match.problem);

	const wrapped = wrapJavaScript(code, signature.functionName);
	const cases: CaseResult[] = [];

	for (const testCase of testCases) {
		const execution = await execute({
			language: "javascript",
			code: wrapped,
			stdin: JSON.stringify(testCase.input),
			limits,
		});
		const { verdict, actualOutput } = judgeCase(
			execution,
			testCase.expectedOutput,
			signature.returnType,
		);
		cases.push(
			testCase.isHidden
				? { hidden: true, verdict }
				: {
						hidden: false,
						verdict,
						durationMs: execution.durationMs,
						input: testCase.input,
						expectedOutput: testCase.expectedOutput,
						actualOutput,
						error:
							execution.status === "runtime_error" ? execution.error : null,
					},
		);
	}

	const verdict = overallVerdict(cases.map((testCase) => testCase.verdict));
	const passed = cases.filter(
		(testCase) => testCase.verdict === "ACCEPTED",
	).length;

	const submission = await prisma.submission.create({
		data: { matchId, userId, code, verdict, passed, total: cases.length },
		select: { id: true },
	});

	return { id: submission.id, verdict, passed, total: cases.length, cases };
}
