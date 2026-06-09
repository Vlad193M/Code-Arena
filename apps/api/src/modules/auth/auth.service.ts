import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { JWTPayload, JWTVerifyResult } from "jose";
import { prisma } from "../../db/prisma.client";
import { redis } from "../../db/redis.client";
import { Prisma } from "../../generated/prisma/client.js";
import { signToken, verifyToken } from "../../lib/jwt";
import { AppError } from "../../middlewares/error.middleware";
import {
  refreshTokenExpiry,
  refreshTokenExpirySeconds,
} from "./auth.constants";
import type {
  AuthResult,
  LoginDto,
  MeResponseDto,
  RegisterDto,
  User,
} from "./auth.schemas";

const SALT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

function refreshKey(userId: string, jti: string): string {
  return `refreshToken:${userId}:${jti}`;
}

async function issueRefreshToken(user: {
  id: string;
  email: string;
  username: string;
}): Promise<string> {
  const jti = randomUUID();
  const refreshToken = await signToken(
    user.id,
    { email: user.email, username: user.username },
    { expiresIn: refreshTokenExpiry, isRefreshToken: true, jti },
  );
  await redis.set(refreshKey(user.id, jti), "1", {
    EX: refreshTokenExpirySeconds,
  });
  return refreshToken;
}

export async function registerUser(
  registerDto: RegisterDto,
): Promise<AuthResult> {
  const hashedPassword = await bcrypt.hash(registerDto.password, SALT_ROUNDS);

  let newUser: User;
  try {
    newUser = await prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new AppError(
        "conflict",
        "User with this email or username already exists",
      );
    }
    throw e;
  }

  const accessToken = await signToken(newUser.id, {
    email: newUser.email,
    username: newUser.username,
  });

  const refreshToken = await issueRefreshToken(newUser);

  return {
    accessToken,
    refreshToken,
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  };
}

export async function loginUser(loginDto: LoginDto): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: loginDto.email },
  });

  const isPasswordValid = await bcrypt.compare(
    loginDto.password,
    user?.password ?? DUMMY_HASH,
  );

  if (!user || !user.password || !isPasswordValid) {
    throw new AppError("unauthorized", "Invalid email or password");
  }

  const accessToken = await signToken(user.id, {
    email: user.email,
    username: user.username,
  });

  const refreshToken = await issueRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

export async function refreshToken(
  refreshToken: string,
): Promise<AuthResult> {
  let decoded: JWTVerifyResult<JWTPayload>;
  try {
    decoded = await verifyToken(refreshToken, true);
  } catch (error) {
    throw new AppError("unauthorized", "Invalid or expired refresh token");
  }
  const { sub: userId, jti } = decoded.payload;
  if (typeof userId !== "string" || typeof jti !== "string") {
    throw new AppError("unauthorized", "Invalid refresh token payload");
  }

  const isRegistered = await redis.get(refreshKey(userId, jti));
  if (isRegistered === null) {
    throw new AppError(
      "unauthorized",
      "Refresh token not found or already used",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("not_found", "User not found");
  }

  await redis.del(refreshKey(userId, jti));

  const accessToken = await signToken(user.id, {
    email: user.email,
    username: user.username,
  });

  const newRefreshToken = await issueRefreshToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

export async function logout(refreshToken: string) {
  try {
    const decoded = await verifyToken(refreshToken, true);
    const { sub: userId, jti } = decoded.payload;
    if (typeof userId === "string" && typeof jti === "string") {
      await redis.del(refreshKey(userId, jti));
    }
  } catch {
    // Token already invalid/expired — nothing to revoke (the key is gone or
    // will expire by TTL). Logout is best-effort, so the controller still
    // clears the cookie.
  }
  return { message: "Logged out successfully" };
}

export async function getCurrentUser(userId: string): Promise<MeResponseDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (!user) {
    throw new AppError("not_found", "User not found");
  }

  return user;
}
