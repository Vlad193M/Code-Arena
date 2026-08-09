import {
  authResponseSchema,
  githubCallbackSchema,
  loginSchema,
  meResponseSchema,
  messageResponseSchema,
  registerSchema,
} from "@codearena/shared";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { errors, jsonBody, jsonResponse } from "../../lib/openapi-helpers";

export const authPaths: ZodOpenApiPathsObject = {
  "/api/auth/github": {
    get: {
      operationId: "githubAuthRedirect",
      summary: "Start GitHub OAuth flow",
      tags: ["auth"],
      responses: {
        302: { description: "Redirect to GitHub authorization page" },
      },
    },
    post: {
      operationId: "githubCallback",
      summary: "Complete GitHub OAuth flow",
      tags: ["auth"],
      requestBody: jsonBody(githubCallbackSchema),
      responses: {
        200: jsonResponse("Authenticated", authResponseSchema),
        ...errors("validation", "unauthorized", "conflict", "internal"),
      },
    },
  },
  "/api/auth/register": {
    post: {
      operationId: "register",
      summary: "Register a new account",
      tags: ["auth"],
      requestBody: jsonBody(registerSchema),
      responses: {
        201: jsonResponse("Account created", authResponseSchema),
        ...errors("validation", "conflict"),
      },
    },
  },
  "/api/auth/login": {
    post: {
      operationId: "login",
      summary: "Log in with email and password",
      tags: ["auth"],
      requestBody: jsonBody(loginSchema),
      responses: {
        200: jsonResponse("Authenticated", authResponseSchema),
        ...errors("validation", "unauthorized"),
      },
    },
  },
  "/api/auth/refresh": {
    post: {
      operationId: "refresh",
      summary: "Rotate the refresh token cookie and issue a new access token",
      tags: ["auth"],
      responses: {
        200: jsonResponse("Refreshed", authResponseSchema),
        ...errors("unauthorized", "not_found"),
      },
    },
  },
  "/api/auth/logout": {
    post: {
      operationId: "logout",
      summary: "Clear the refresh token and revoke the session",
      tags: ["auth"],
      responses: {
        200: jsonResponse("Logged out", messageResponseSchema),
      },
    },
  },
  "/api/auth/me": {
    get: {
      operationId: "getMe",
      summary: "Get the current authenticated user",
      tags: ["auth"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Current user", meResponseSchema),
        ...errors("unauthorized", "not_found"),
      },
    },
  },
};
