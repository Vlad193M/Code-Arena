import { z } from "zod";

export const matchIdParamsSchema = z.object({
  id: z.cuid().meta({ example: "clx0a1b2c3d4e5f6g7h8i9j0" }),
});
export type MatchIdParams = z.infer<typeof matchIdParamsSchema>;
