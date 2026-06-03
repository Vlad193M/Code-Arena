import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schemas";
import { loginUser, registerUser } from "./auth.service";

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
