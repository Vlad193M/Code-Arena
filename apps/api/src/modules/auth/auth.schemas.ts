import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
  }),
});
export type AuthResponseDto = z.infer<typeof authResponseSchema>;
