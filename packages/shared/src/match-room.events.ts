import { z } from "zod";

/** Mirrors Prisma's `MatchStatus` — kept as a literal union here so `shared`
 * never depends on the generated Prisma client. */
export const matchStatusSchema = z.enum([
	"WAITING",
	"IN_PROGRESS",
	"FINISHED",
	"CANCELLED",
]);
export type MatchStatus = z.infer<typeof matchStatusSchema>;

export const matchRoomPlayerSchema = z
	.object({
		id: z.string().meta({ example: "clx9z8y7x6w5v4u3t2s1r0q" }),
		username: z.string().meta({ example: "ada" }),
		ready: z.boolean(),
	})
	.meta({ id: "MatchRoomPlayer", description: "A match room participant" });
export type MatchRoomPlayer = z.infer<typeof matchRoomPlayerSchema>;

/** Shared by every `match:*` socket payload, so server and client cannot drift. */
export const matchRoomSchema = z
	.object({
		id: z.string().meta({ example: "clx0a1b2c3d4e5f6g7h8i9j0" }),
		status: matchStatusSchema,
		host: matchRoomPlayerSchema,
		guest: matchRoomPlayerSchema.nullable(),
	})
	.meta({
		id: "MatchRoom",
		description: "Presence and ready state of a match",
	});
export type MatchRoom = z.infer<typeof matchRoomSchema>;

/** Sent to the one socket whose event failed, never broadcast. */
export const matchRoomErrorSchema = z
	.object({ message: z.string().meta({ example: "Internal server error" }) })
	.meta({
		id: "MatchRoomError",
		description: "A match room event the server could not complete",
	});
export type MatchRoomError = z.infer<typeof matchRoomErrorSchema>;

/** Broadcast to the `match:<id>` room; `room` always carries the full current
 * state, so a client never has to reconcile a partial update. */
export interface MatchRoomServerToClientEvents {
	"match:room": (room: MatchRoom) => void;
	"match:opponent_left": () => void;
	"match:error": (error: MatchRoomError) => void;
}

export interface MatchRoomClientToServerEvents {
	"match:subscribe": (matchId: string) => void;
	"match:unsubscribe": (matchId: string) => void;
	"match:set_ready": (matchId: string, ready: boolean) => void;
	"match:leave": (matchId: string) => void;
}
