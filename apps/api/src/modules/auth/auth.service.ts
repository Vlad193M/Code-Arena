import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { env } from "../../config/env";
import { prisma } from "../../db/prisma.client";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../middlewares/error.middleware";
import type {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  TokenClaims,
} from "./auth.schemas";

const secret = new TextEncoder().encode(env.JWT_SECRET);

const SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = "1h";
const JWT_ALGORITHM = "HS256";

const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

function signToken(subject: string, claims: TokenClaims): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(secret);
}

export async function registerUser(
  registerDto: RegisterDto,
): Promise<AuthResponseDto> {
  const hashedPassword = await bcrypt.hash(registerDto.password, SALT_ROUNDS);

  let newUser;
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

  const token = await signToken(newUser.id, {
    email: newUser.email,
    username: newUser.username,
  });

  return {
    accessToken: token,
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  };
}

export async function loginUser(loginDto: LoginDto): Promise<AuthResponseDto> {
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

  const token = await signToken(user.id, {
    email: user.email,
    username: user.username,
  });

  return {
    accessToken: token,
    user: { id: user.id, username: user.username, email: user.email },
  };
}
