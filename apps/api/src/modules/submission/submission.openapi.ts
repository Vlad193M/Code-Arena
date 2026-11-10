import { submissionResultSchema } from "@codearena/shared";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { errors, jsonBody, jsonResponse } from "../../lib/openapi-helpers";
import { matchIdParamsSchema } from "../match/match.schemas";
import { submitCodeSchema } from "./submission.schemas";

export const submissionPaths: ZodOpenApiPathsObject = {
	"/api/matches/{id}/submissions": {
		post: {
			operationId: "submitCode",
			summary: "Judge code against every test case of the match's problem",
			tags: ["submission"],
			security: [{ bearerAuth: [] }],
			requestParams: { path: matchIdParamsSchema },
			requestBody: jsonBody(submitCodeSchema),
			responses: {
				201: jsonResponse("Submission judged", submissionResultSchema),
				...errors(
					"validation",
					"unauthorized",
					"forbidden",
					"not_found",
					"conflict",
				),
			},
		},
	},
};
