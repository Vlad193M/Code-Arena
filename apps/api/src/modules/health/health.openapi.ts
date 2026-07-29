import type { ZodOpenApiPathsObject } from "zod-openapi";
import { jsonResponse } from "../../lib/openapi-helpers";
import { healthSchema } from "./health.schemas";

export const healthPaths: ZodOpenApiPathsObject = {
  "/api/health": {
    get: {
      operationId: "health",
      summary: "Liveness and database connectivity check",
      tags: ["health"],
      responses: {
        200: jsonResponse("Service is healthy", healthSchema),
      },
    },
  },
};
