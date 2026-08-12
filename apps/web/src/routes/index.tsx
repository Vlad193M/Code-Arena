import { apiClient } from "#/api/client";
import { requireUser } from "#/feature/auth/guards";
import { clearSession, getAuthState, useAuth } from "#/feature/auth/store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

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

  useEffect(() => {
    console.log(getAuthState().accessToken);
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: (cb) => {
        cb({ accessToken: getAuthState().accessToken });
      },
    });

    socket.on("connect", () => console.log("[ws] connected", socket.id));
    socket.on("connect_error", (err) =>
      console.log("[ws] error", err.message, err),
    );
  }, []);

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <p>{user?.username}</p>
      <button type="button" onClick={handleLogout} disabled={pending}>
        logout
      </button>
    </main>
  );
}
