import type { AuthResponseDto } from "@codearena/shared";
import { z } from "zod";

export type AuthResult = AuthResponseDto & { refreshToken: string };

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
