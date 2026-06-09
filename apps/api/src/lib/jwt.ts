import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env";
import type { TokenClaims } from "../modules/auth/auth.schemas";

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
