import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { authenticateToken } from "../lib/jwt";

export async function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new AppError("unauthorized", "No token provided");
  }

  req.user = { id: await authenticateToken(token) };
  next();
}

/** Narrows the optional `req.user` for handlers that run behind
 * {@link authenticateMiddleware}, which Express types cannot express. */
export function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError("unauthorized", "User not authenticated");
  }

  return req.user.id;
}
