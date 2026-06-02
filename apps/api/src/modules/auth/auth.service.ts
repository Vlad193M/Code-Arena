import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { env } from "../../cofig/env";
import { prisma } from "../../db/prisma.client";
import { AppError } from "../../middlewares/error.middleware";
import type { AuthResponseDto, RegisterDto } from "./auth.schemas";

const secret = new TextEncoder().encode(env.JWT_SECRET);

const SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = "1h";
const JWT_ALGORITHM = "HS256";

export async function registerUser(
  registerDto: RegisterDto,
): Promise<AuthResponseDto> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: registerDto.email }, { username: registerDto.username }],
    },
  });

  if (existingUser) {
    throw new AppError(
      "conflict",
      "User with this email or username already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(registerDto.password, SALT_ROUNDS);

  const newUser = await prisma.user.create({
    data: {
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
    },
  });

  const token = await new SignJWT({
    userId: newUser.id,
    email: newUser.email,
    username: newUser.username,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(secret);

  return {
    accessToken: token,
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  };
}
