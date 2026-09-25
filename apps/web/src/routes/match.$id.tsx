import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "#/feature/auth/guards";
import { useAuth } from "#/feature/auth/store";
import MatchRoomScreen from "#/feature/match-room/components/MatchRoomScreen";

export const Route = createFileRoute("/match/$id")({
	ssr: false,
	beforeLoad: requireUser,
	component: MatchRoomPage,
});

/** Identity comes from the route, so the match-room feature never imports auth. */
function MatchRoomPage() {
	const { id } = Route.useParams();
	const { user } = useAuth();

	return <MatchRoomScreen matchId={id} currentUserId={user?.id ?? ""} />;
}
