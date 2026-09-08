import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "#/feature/auth/guards";
import { useAuth } from "#/feature/auth/store";
import LobbyScreen from "#/feature/lobby/components/LobbyScreen";

export const Route = createFileRoute("/lobby")({
	ssr: false,
	beforeLoad: requireUser,
	component: Lobby,
});

/** Identity comes from the route, so the lobby feature never imports auth. */
function Lobby() {
	const { user } = useAuth();

	return <LobbyScreen currentUserId={user?.id ?? ""} />;
}
