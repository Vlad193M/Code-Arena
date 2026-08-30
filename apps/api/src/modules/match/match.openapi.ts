import { lobbyMatchListSchema, lobbyMatchSchema } from "@codearena/shared";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { errors, jsonResponse } from "../../lib/openapi-helpers";
import { matchIdParamsSchema } from "./match.schemas";

const matchIdPath = { requestParams: { path: matchIdParamsSchema } };

export const matchPaths: ZodOpenApiPathsObject = {
  "/api/matches": {
    get: {
      operationId: "listMatches",
      summary: "List matches waiting for an opponent",
      tags: ["match"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Open matches", lobbyMatchListSchema),
        ...errors("unauthorized"),
      },
    },
    post: {
      operationId: "createMatch",
      summary: "Create a match and wait for an opponent",
      tags: ["match"],
      security: [{ bearerAuth: [] }],
      responses: {
        201: jsonResponse("Match created", lobbyMatchSchema),
        ...errors("unauthorized"),
      },
    },
  },
  "/api/matches/{id}/join": {
    post: {
      operationId: "joinMatch",
      summary: "Join an open match",
      tags: ["match"],
      security: [{ bearerAuth: [] }],
      ...matchIdPath,
      responses: {
        204: { description: "Joined" },
        ...errors("validation", "unauthorized", "not_found", "conflict"),
      },
    },
  },
  "/api/matches/{id}/cancel": {
    post: {
      operationId: "cancelMatch",
      summary: "Cancel a match you are hosting",
      tags: ["match"],
      security: [{ bearerAuth: [] }],
      ...matchIdPath,
      responses: {
        204: { description: "Cancelled" },
        ...errors("validation", "unauthorized", "forbidden", "not_found", "conflict"),
      },
    },
  },
};
