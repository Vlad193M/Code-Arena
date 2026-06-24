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

export type AuthResult = AuthResponseDto & { refreshToken: string };

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const githubCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
export type GithubCallbackDto = z.infer<typeof githubCallbackSchema>;

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
