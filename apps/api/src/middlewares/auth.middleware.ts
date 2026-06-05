import type { NextFunction, Request, Response } from "express";
import type { JWTPayload, JWTVerifyResult } from "jose";
import { verifyToken } from "../lib/jwt";
import { AppError } from "./error.middleware";

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

  let decoded: JWTVerifyResult<JWTPayload>;

  try {
    decoded = await verifyToken(token);
  } catch (error) {
    throw new AppError("unauthorized", "Invalid token");
  }

  const { sub } = decoded.payload;
  if (typeof sub !== "string") {
    throw new AppError("unauthorized", "Invalid token payload");
  }

  req.user = { id: sub };
  next();
}
