import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "#/feature/auth/guards";
import { useAuth } from "#/feature/auth/store";
import MatchRoomScreen from "#/feature/match-room/components/MatchRoomScreen";

export const Route = createFileRoute("/match/$id")({
	ssr: false,
	beforeLoad: requireUser,
	component: MatchRoomPage,
});

/** Identity comes from the route, so the match-room feature never imports auth.
 * Keyed by match: moving to another match starts every piece of state afresh. */
function MatchRoomPage() {
	const { id } = Route.useParams();
	const { user } = useAuth();

	return (
		<MatchRoomScreen key={id} matchId={id} currentUserId={user?.id ?? ""} />
	);
}
