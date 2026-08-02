import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { JWTPayload, JWTVerifyResult } from "jose";
import { env } from "../../config/env";
import { prisma } from "../../db/prisma.client";
import { redis } from "../../db/redis.client";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/errors";
import { signToken, verifyToken } from "../../lib/jwt";
import {
  GITHUB_AUTHORIZE_URL,
  GITHUB_OAUTH_SCOPE,
  GITHUB_TOKEN_URL,
  GITHUB_USER_API_URL,
  GITHUB_USER_EMAILS_API_URL,
  refreshTokenExpiry,
  refreshTokenExpirySeconds,
} from "./auth.constants";
import {
  githubEmailsSchema,
  githubProfileSchema,
  githubTokenSchema,
} from "./auth.schemas";
import type {
  AuthResult,
  GithubProfile,
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

async function issueAuthResult(user: {
  id: string;
  email: string;
  username: string;
}): Promise<AuthResult> {
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

async function githubFetch(url: string, init?: Parameters<typeof fetch>[1]) {
  try {
    return await fetch(url, init);
  } catch {
    throw new AppError("internal", "Failed to reach GitHub");
  }
}

export function buildGithubAuthUrl(): { url: string; state: string } {
  const state = randomUUID();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: GITHUB_OAUTH_SCOPE,
    state,
  });
  return { url: `${GITHUB_AUTHORIZE_URL}?${params.toString()}`, state };
}

async function exchangeGithubCode(code: string): Promise<string> {
  const response = await githubFetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    }),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AppError("unauthorized", "Failed to exchange GitHub code");
  }
  const parsed = githubTokenSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("unauthorized", "Failed to exchange GitHub code");
  }
  return parsed.data.access_token;
}

async function fetchVerifiedEmail(
  headers: Record<string, string>,
): Promise<string | null> {
  const response = await githubFetch(GITHUB_USER_EMAILS_API_URL, { headers });
  if (!response.ok) {
    return null;
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return null;
  }
  const parsed = githubEmailsSchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }
  const emails = parsed.data;
  return (
    emails.find((e) => e.primary && e.verified)?.email ??
    emails.find((e) => e.verified)?.email ??
    null
  );
}

async function fetchGithubProfile(
  githubAccessToken: string,
): Promise<GithubProfile> {
  const headers = {
    Authorization: `Bearer ${githubAccessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "CodeArena",
  };

  const [userResponse, email] = await Promise.all([
    githubFetch(GITHUB_USER_API_URL, { headers }),
    fetchVerifiedEmail(headers),
  ]);

  if (!userResponse.ok) {
    throw new AppError("unauthorized", "Failed to fetch GitHub profile");
  }
  let userBody: unknown;
  try {
    userBody = await userResponse.json();
  } catch {
    throw new AppError("unauthorized", "Failed to fetch GitHub profile");
  }
  const profile = githubProfileSchema.safeParse(userBody);
  if (!profile.success) {
    throw new AppError("unauthorized", "Failed to fetch GitHub profile");
  }

  if (!email) {
    throw new AppError(
      "validation",
      "No verified email found on the GitHub account",
    );
  }

  return {
    githubId: String(profile.data.id),
    email,
    login: profile.data.login,
  };
}

async function buildUsername(profile: GithubProfile): Promise<string> {
  const taken = await prisma.user.findUnique({
    where: { username: profile.login },
  });
  return taken ? `${profile.login}-${profile.githubId}` : profile.login;
}

async function findOrCreateGithubUser(profile: GithubProfile): Promise<User> {
  const byEmail = await prisma.user.findUnique({
    where: { email: profile.email },
  });
  if (byEmail) {
    if (byEmail.githubId && byEmail.githubId !== profile.githubId) {
      throw new AppError(
        "conflict",
        "This email is already linked to a different GitHub account",
      );
    }
    if (byEmail.githubId) {
      return byEmail;
    }
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { githubId: profile.githubId },
    });
  }

  return prisma.user.upsert({
    where: { githubId: profile.githubId },
    update: {},
    create: {
      githubId: profile.githubId,
      email: profile.email,
      username: await buildUsername(profile),
    },
  });
}

export async function loginWithGithub(code: string): Promise<AuthResult> {
  const githubAccessToken = await exchangeGithubCode(code);
  const profile = await fetchGithubProfile(githubAccessToken);
  const user = await findOrCreateGithubUser(profile);

  return issueAuthResult(user);
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

  return issueAuthResult(newUser);
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

  return issueAuthResult(user);
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

  return issueAuthResult(user);
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
