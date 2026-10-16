import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiClient } from "#/api/client";
import { requireUser } from "#/feature/auth/guards";
import { clearSession, useAuth } from "#/feature/auth/store";

export const Route = createFileRoute("/")({
	ssr: false,
	beforeLoad: requireUser,
	component: App,
});

function App() {
	const { user } = useAuth();
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
