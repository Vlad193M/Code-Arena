import type { Request, Response } from "express";
import { AppError } from "../../middlewares/error.middleware";
import { loginSchema, registerSchema } from "./auth.schemas";
import { getCurrentUser, loginUser, registerUser } from "./auth.service";

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await loginUser(data);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    throw new AppError("unauthorized", "User not authenticated");
  }
  const userData = await getCurrentUser(user.id);

  res.json(userData);
}
