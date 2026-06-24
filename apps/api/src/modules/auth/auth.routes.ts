import { Router } from "express";
import { authenticateMiddleware } from "../../middlewares/auth.middleware";
import {
  githubAuth,
  githubCallback,
  login,
  logout,
  me,
  refresh,
  register,
} from "./auth.controller";

export const authRouter: Router = Router();

authRouter.get("/github", githubAuth);
authRouter.post("/github", githubCallback);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticateMiddleware, me);
