import { z } from "zod";

/**
 * Field limits behind {@link registerSchema}, exported so a UI can phrase its
 * hints ("8+ characters") without restating the rule. `password.max` is bcrypt's
 * 72-byte ceiling.
 */
export const AUTH_LIMITS = {
  username: { min: 3, max: 20 },
  password: { min: 8, max: 72 },
} as const;

export const registerSchema = z
  .object({
    email: z.email().meta({ example: "ada@example.com" }),
    username: z
      .string()
      .min(AUTH_LIMITS.username.min)
      .max(AUTH_LIMITS.username.max)
      .meta({ example: "ada" }),
    password: z
      .string()
      .min(AUTH_LIMITS.password.min)
      .max(AUTH_LIMITS.password.max)
      .meta({ example: "supersecret" }),
  })
  .meta({ id: "RegisterRequest", description: "New account registration payload" });
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.email().meta({ example: "ada@example.com" }),
    password: z.string().min(1).meta({ example: "supersecret" }),
  })
  .meta({ id: "LoginRequest", description: "Email/password login payload" });
export type LoginDto = z.infer<typeof loginSchema>;

export const githubCallbackSchema = z
  .object({
    code: z.string().min(1).meta({ example: "a1b2c3d4e5f6g7h8" }),
    state: z.string().min(1).meta({ example: "f47ac10b-58cc-4372-a567-0e02b2c3d479" }),
  })
  .meta({ id: "GithubCallbackRequest", description: "GitHub OAuth callback payload" });
export type GithubCallbackDto = z.infer<typeof githubCallbackSchema>;

export const userSchema = z
  .object({
    id: z.string().meta({ example: "clx0a1b2c3d4e5f6g7h8i9j0" }),
    username: z.string().meta({ example: "ada" }),
    email: z.string().meta({ example: "ada@example.com" }),
  })
  .meta({ id: "User", description: "Authenticated user" });
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z
  .object({
    accessToken: z
      .string()
      .meta({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.sig" }),
    user: userSchema,
  })
  .meta({ id: "AuthResponse", description: "Access token with the authenticated user" });
export type AuthResponseDto = z.infer<typeof authResponseSchema>;

export const meResponseSchema = userSchema;
export type MeResponseDto = z.infer<typeof meResponseSchema>;

export const messageResponseSchema = z
  .object({ message: z.string().meta({ example: "Logged out successfully" }) })
  .meta({ id: "MessageResponse", description: "Simple message acknowledgement" });
