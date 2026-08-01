export type TerminalCheck = {
	ok: boolean;
	text: string;
};

type TerminalChecksProps = {
	id?: string;
	checks: Array<TerminalCheck>;
};

export default function TerminalChecks({ id, checks }: TerminalChecksProps) {
	if (checks.length === 0) {
		return null;
	}

	return (
		<div id={id} className="flex flex-col">
			{checks.map((check) => (
				<div
					key={check.text}
					className={
						check.ok
							? "crt-glow-green text-[12.5px] leading-[1.7] tracking-[0.02em] text-(--crt-green)"
							: "crt-glow-red text-[12.5px] leading-[1.7] tracking-[0.02em] text-(--crt-red)"
					}
				>
					{check.ok ? "✓" : "✗"} {check.text}
				</div>
			))}
		</div>
	);
}
