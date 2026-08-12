import type { JWTPayload, JWTVerifyResult } from "jose";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env";
import type { TokenClaims } from "../modules/auth/auth.schemas";
import { AppError } from "./errors";

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

const TOKEN_EXPIRATION = "15m";
const JWT_ALGORITHM = "HS256";

interface SignOptions {
  expiresIn?: string;
  isRefreshToken?: boolean;
  jti?: string;
}

export function signToken(
  subject: string,
  claims: TokenClaims,
  options?: SignOptions,
): Promise<string> {
  const jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(options?.expiresIn || TOKEN_EXPIRATION);

  if (options?.jti) {
    jwt.setJti(options.jti);
  }

  return jwt.sign(options?.isRefreshToken ? refreshSecret : accessSecret);
}

export function verifyToken(token: string, isRefreshToken?: boolean) {
  return jwtVerify(token, isRefreshToken ? refreshSecret : accessSecret, {
    algorithms: [JWT_ALGORITHM],
  });
}

/** Verifies an access token and returns the authenticated user id, so every
 * transport (HTTP, WebSocket) shares one token policy. */
export async function authenticateToken(token: string): Promise<string> {
  let decoded: JWTVerifyResult<JWTPayload>;

  try {
    decoded = await verifyToken(token);
  } catch {
    throw new AppError("unauthorized", "Invalid token");
  }

  const { sub } = decoded.payload;
  if (typeof sub !== "string") {
    throw new AppError("unauthorized", "Invalid token payload");
  }

  return sub;
}
