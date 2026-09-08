type TerminalButtonProps = {
	label: string;
	type?: "button" | "submit";
	disabled?: boolean;
	pending?: boolean;
	pendingLabel?: string;
	onClick?: () => void;
};

export default function TerminalButton({
	label,
	type = "submit",
	disabled = false,
	pending = false,
	pendingLabel = "WORKING",
	onClick,
}: TerminalButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled || pending}
			onClick={onClick}
			className="crt-glow min-h-[54px] w-full cursor-pointer border border-(--crt-amber) bg-[rgba(255,176,0,0.08)] font-[inherit] text-[15px] font-semibold tracking-[0.16em] text-(--crt-amber) transition-colors duration-150 hover:bg-(--crt-amber) hover:text-(--crt-bg) hover:[text-shadow:none] active:bg-[#d99400] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-[rgba(255,176,0,0.08)] disabled:hover:text-(--crt-amber)"
		>
			{pending ? (
				<>
					[ {pendingLabel}
					<span className="crt-ellipsis" /> ]
				</>
			) : (
				`[ ${label} ]`
			)}
		</button>
	);
}
