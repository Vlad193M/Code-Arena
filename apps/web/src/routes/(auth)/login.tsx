import LoginScreen from "#/feature/auth/components/LoginScreen";
import { AUTH_ERROR_MESSAGES, authErrorSchema } from "#/feature/auth/errors";
import { requireAnonymous } from "#/feature/auth/guards";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const searchSchema = z
  .object({ error: authErrorSchema.optional() })
  .catch({ error: undefined });

export const Route = createFileRoute("/(auth)/login")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: requireAnonymous,
  component: LoginRoute,
});

function LoginRoute() {
  const { error } = Route.useSearch();

  return <LoginScreen githubError={error && AUTH_ERROR_MESSAGES[error]} />;
}
