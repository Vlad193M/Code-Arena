import LoginScreen from "#/feature/auth/components/LoginScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/login")({
  component: LoginScreen,
});
