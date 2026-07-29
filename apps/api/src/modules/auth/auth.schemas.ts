import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.email().meta({ example: "ada@example.com" }),
    username: z.string().min(3).max(20).meta({ example: "ada" }),
    password: z.string().min(8).max(72).meta({ example: "supersecret" }),
  })
  .meta({ id: "RegisterRequest", description: "New account registration payload" });
export type RegisterDto = z.infer<typeof registerSchema>;

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

export type AuthResult = AuthResponseDto & { refreshToken: string };

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

export const messageResponseSchema = z
  .object({ message: z.string().meta({ example: "Logged out successfully" }) })
  .meta({ id: "MessageResponse", description: "Simple message acknowledgement" });

export type GithubProfile = {
  githubId: string;
  email: string;
  login: string;
};

export const githubTokenSchema = z.object({
  access_token: z.string(),
});

export const githubProfileSchema = z.object({
  id: z.number(),
  login: z.string(),
});

export const githubEmailsSchema = z.array(
  z.object({
    email: z.string(),
    primary: z.boolean(),
    verified: z.boolean(),
  }),
);

export type TokenClaims = {
  email: string;
  username: string;
};

export const meResponseSchema = userSchema;

export type MeResponseDto = z.infer<typeof meResponseSchema>;
