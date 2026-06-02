import type { Request, Response } from "express";
import { registerSchema } from "./auth.schemas";
import { registerUser } from "./auth.service";

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  res.status(201).json(result);
}
