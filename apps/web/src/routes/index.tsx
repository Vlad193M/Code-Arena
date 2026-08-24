import { apiClient } from "#/api/client";
import { requireUser } from "#/feature/auth/guards";
import { clearSession, useAuth } from "#/feature/auth/store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: requireUser,
  component: App,
});

function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) return;
    setPending(true);

    try {
      await apiClient.POST("/api/auth/logout");
    } catch (cause) {
      console.error("[auth] logout request failed", cause);
    } finally {
      clearSession();
      // Replace, not push: Back must not aim at the private page.
      await navigate({ to: "/login", replace: true });
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <p>{user?.username}</p>
      <button type="button" onClick={handleLogout} disabled={pending}>
        logout
      </button>
    </main>
  );
}
