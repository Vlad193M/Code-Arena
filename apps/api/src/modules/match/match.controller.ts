import { lobbyMatchListSchema, lobbyMatchSchema } from "@codearena/shared";
import type { Request, Response } from "express";
import { serialize } from "../../lib/serialize";
import { requireUserId } from "../../middlewares/auth.middleware";
import { matchIdParamsSchema } from "./match.schemas";
import * as MatchService from "./match.service";

export async function listMatches(_req: Request, res: Response) {
  const matches = await MatchService.listOpenMatches();

  res.json(serialize(lobbyMatchListSchema, matches));
}

export async function createMatch(req: Request, res: Response) {
  const match = await MatchService.createMatch(requireUserId(req));

  res.status(201).json(serialize(lobbyMatchSchema, match));
}

export async function joinMatch(req: Request, res: Response) {
  const { id } = matchIdParamsSchema.parse(req.params);
  await MatchService.joinMatch(id, requireUserId(req));

  res.sendStatus(204);
}

export async function cancelMatch(req: Request, res: Response) {
  const { id } = matchIdParamsSchema.parse(req.params);
  await MatchService.cancelMatch(id, requireUserId(req));

  res.sendStatus(204);
}
