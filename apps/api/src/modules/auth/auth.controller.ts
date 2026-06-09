import type { Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/error.middleware";
import { refreshTokenExpirySeconds } from "./auth.constants";
import {
  authResponseSchema,
  loginSchema,
  meResponseSchema,
  registerSchema,
} from "./auth.schemas";
import * as AuthService from "./auth.service";

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: refreshTokenExpirySeconds * 1000, // 14 days in milliseconds
  });
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const { refreshToken, ...response } = await AuthService.registerUser(data);
  setRefreshTokenCookie(res, refreshToken);
  res.status(201).json(authResponseSchema.parse(response));
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const { refreshToken, ...response } = await AuthService.loginUser(data);
  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json(authResponseSchema.parse(response));
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError("unauthorized", "Refresh token not provided");
  }

  const { refreshToken: newRefreshToken, ...response } =
    await AuthService.refreshToken(refreshToken);
  setRefreshTokenCookie(res, newRefreshToken);
  res.json(authResponseSchema.parse(response));
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await AuthService.logout(refreshToken);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
}

export async function me(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    throw new AppError("unauthorized", "User not authenticated");
  }
  const userData = await AuthService.getCurrentUser(user.id);

  res.json(meResponseSchema.parse(userData));
}
