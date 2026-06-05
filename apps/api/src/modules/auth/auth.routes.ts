import { Router } from "express";
import { login, me, register } from "./auth.controller";
import { authenticateMiddleware } from "../../middlewares/auth.middleware";

export const authRouter: Router = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticateMiddleware, me);
