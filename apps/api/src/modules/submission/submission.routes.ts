import { Router } from "express";
import { authenticateMiddleware } from "../../middlewares/auth.middleware";
import { submitCode } from "./submission.controller";

/** Mounted under `/api/matches/:id/submissions`; `mergeParams` exposes `:id`. */
export const submissionRouter: Router = Router({ mergeParams: true });

submissionRouter.use(authenticateMiddleware);

submissionRouter.post("/", submitCode);
