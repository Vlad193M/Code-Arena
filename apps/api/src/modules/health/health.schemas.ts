import { z } from "zod";

export const healthSchema = z
  .object({ ok: z.literal(true), db: z.literal("connected") })
  .meta({ id: "Health", description: "Service health status" });
export type HealthDto = z.infer<typeof healthSchema>;
