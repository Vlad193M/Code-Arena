import { useNavigate } from "@tanstack/react-router";

export const GHOST_BUTTON =
	"min-h-[52px] cursor-pointer border border-(--crt-dim) px-4.5 font-[inherit] text-[13px] tracking-[0.08em] text-(--crt-dim) transition-colors duration-120";

export default function BackToLobbyButton() {
	const navigate = useNavigate();

	return (
		<button
			type="button"
			onClick={() => navigate({ to: "/lobby" })}
			className={`${GHOST_BUTTON} hover:border-(--crt-amber) hover:text-(--crt-amber)`}
		>
			[ BACK TO LOBBY ]
		</button>
	);
}
