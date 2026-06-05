import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env";
import type { TokenClaims } from "../modules/auth/auth.schemas";

const secret = new TextEncoder().encode(env.JWT_SECRET);

const TOKEN_EXPIRATION = "1h";
const JWT_ALGORITHM = "HS256";

export function signToken(
  subject: string,
  claims: TokenClaims,
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(secret);
}

export function verifyToken(token: string) {
  return jwtVerify(token, secret, {
    algorithms: [JWT_ALGORITHM],
  });
}
