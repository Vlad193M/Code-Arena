import RegisterScreen from "#/feature/auth/components/RegisterScreen";
import { AUTH_ERROR_MESSAGES, authErrorSchema } from "#/feature/auth/errors";
import { requireAnonymous } from "#/feature/auth/guards";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const searchSchema = z
  .object({ error: authErrorSchema.optional() })
  .catch({ error: undefined });

export const Route = createFileRoute("/(auth)/register")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: requireAnonymous,
  component: RegisterRoute,
});

function RegisterRoute() {
  const { error } = Route.useSearch();

  return <RegisterScreen githubError={error && AUTH_ERROR_MESSAGES[error]} />;
}
