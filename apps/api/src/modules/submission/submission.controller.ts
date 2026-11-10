import { submissionResultSchema } from "@codearena/shared";
import type { Request, Response } from "express";
import { parseOrThrow } from "../../lib/validation";
import { requireUserId } from "../../middlewares/auth.middleware";
import { matchIdParamsSchema } from "../match/match.schemas";
import { submitCodeSchema } from "./submission.schemas";
import * as SubmissionService from "./submission.service";

export async function submitCode(req: Request, res: Response) {
	const { id } = matchIdParamsSchema.parse(req.params);
	const { code } = submitCodeSchema.parse(req.body);
	const result = await SubmissionService.submit(id, requireUserId(req), code);

	res
		.status(201)
		.json(parseOrThrow(submissionResultSchema, result, "submitCode response"));
}
