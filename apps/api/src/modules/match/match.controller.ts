import { lobbyMatchListSchema, lobbyMatchSchema } from "@codearena/shared";
import type { Request, Response } from "express";
import { parseOrThrow } from "../../lib/validation";
import { requireUserId } from "../../middlewares/auth.middleware";
import { matchIdParamsSchema } from "./match.schemas";
import * as MatchService from "./match.service";
import { broadcastMatchClosed, emitMatchCreated } from "./match.socket";

export async function listMatches(_req: Request, res: Response) {
	const matches = await MatchService.listOpenMatches();

	res.json(parseOrThrow(lobbyMatchListSchema, matches, "listMatches response"));
}

export async function createMatch(req: Request, res: Response) {
	const match = await MatchService.createMatch(requireUserId(req));
	emitMatchCreated(match);

	res
		.status(201)
		.json(parseOrThrow(lobbyMatchSchema, match, "createMatch response"));
}

export async function joinMatch(req: Request, res: Response) {
	const { id } = matchIdParamsSchema.parse(req.params);
	broadcastMatchClosed(await MatchService.joinMatch(id, requireUserId(req)));

	res.sendStatus(204);
}

export async function cancelMatch(req: Request, res: Response) {
	const { id } = matchIdParamsSchema.parse(req.params);
	broadcastMatchClosed(await MatchService.cancelMatch(id, requireUserId(req)));

	res.sendStatus(204);
}
