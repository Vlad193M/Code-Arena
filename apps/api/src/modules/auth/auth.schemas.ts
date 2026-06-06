import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(72),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});
export type AuthResponseDto = z.infer<typeof authResponseSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export type TokenClaims = {
  email: string;
  username: string;
};

export const meResponseSchema = userSchema;

export type MeResponseDto = z.infer<typeof meResponseSchema>;
