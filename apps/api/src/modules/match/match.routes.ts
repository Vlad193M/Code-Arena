import { Router } from "express";
import { authenticateMiddleware } from "../../middlewares/auth.middleware";
import {
  cancelMatch,
  createMatch,
  joinMatch,
  listMatches,
} from "./match.controller";

export const matchRouter: Router = Router();

matchRouter.use(authenticateMiddleware);

matchRouter.get("/", listMatches);
matchRouter.post("/", createMatch);
matchRouter.post("/:id/join", joinMatch);
matchRouter.post("/:id/cancel", cancelMatch);
