import { createDocument } from "zod-openapi";
import { authPaths } from "../modules/auth/auth.openapi";
import { healthPaths } from "../modules/health/health.openapi";
import { matchPaths } from "../modules/match/match.openapi";
import { errorResponseComponents } from "./openapi-helpers";

export const openApiDocument: ReturnType<typeof createDocument> = createDocument({
  openapi: "3.1.0",
  info: {
    title: "CodeArena API",
    version: "1.0.0",
    description: "Real-time competitive programming platform API.",
  },
  servers: [{ url: "/", description: "Same origin" }],
  tags: [
    { name: "auth", description: "Authentication and session management" },
    { name: "match", description: "Match lobby and lifecycle" },
    { name: "health", description: "Service health" },
  ],
  components: {
    responses: errorResponseComponents,
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    ...healthPaths,
    ...authPaths,
    ...matchPaths,
  },
});
