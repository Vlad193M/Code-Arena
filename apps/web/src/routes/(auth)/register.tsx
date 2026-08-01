import RegisterScreen from "#/feature/auth/components/RegisterScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/register")({
  component: RegisterScreen,
});
