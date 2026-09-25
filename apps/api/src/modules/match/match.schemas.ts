import { z } from "zod";

export const matchIdParamsSchema = z.object({
	id: z.cuid().meta({ example: "clx0a1b2c3d4e5f6g7h8i9j0" }),
});
export type MatchIdParams = z.infer<typeof matchIdParamsSchema>;

/** Socket payloads are a trust boundary too: the typed event map only binds
 * the client we ship, and nothing stops another one emitting anything. */
export const matchIdEventSchema = matchIdParamsSchema.shape.id;
export const readyEventSchema = z.boolean();
