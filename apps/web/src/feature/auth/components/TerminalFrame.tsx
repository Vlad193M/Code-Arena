import type { ReactNode } from "react";

type TerminalFrameProps = {
	title: string;
	description: string;
	footerTag: string;
	prompt: string;
	children: ReactNode;
	bottomBar?: ReactNode;
};

const RULE = "─".repeat(200);

export default function TerminalFrame({
	title,
	description,
	footerTag,
	prompt,
	children,
	bottomBar,
}: TerminalFrameProps) {
	return (
		<div className="crt relative flex min-h-screen items-center justify-center overflow-hidden bg-(--crt-bg) p-[clamp(16px,4vw,56px)] font-mono">
			<div className="crt-scanlines" />
			<div className="crt-vignette" />

			<div className="relative z-1 flex w-[min(660px,100%)] flex-col gap-3.5">
				<div className="flex flex-col gap-[3px] text-xs leading-[1.7] tracking-[0.04em] text-(--crt-dim)">
					<div>CODEARENA BIOS v1.04 — 640K OK — MATCHMAKER READY</div>
					<div>
						LINK wss://arena.codearena.dev{" "}
						<span className="crt-glow-green text-(--crt-green)">[ONLINE]</span>
					</div>
				</div>

				<div className="flex flex-col text-(--crt-amber)">
					<div className="crt-glow flex items-baseline overflow-hidden text-[clamp(11px,1.6vw,13px)] tracking-[0.06em] whitespace-nowrap">
						<span>┌─[ </span>
						<span className="font-semibold">CODE ARENA v1.0 — AUTH MODULE</span>
						<span> ]</span>
						<span className="flex-1 overflow-hidden opacity-75">{RULE}</span>
						<span>┐</span>
					</div>

					<div className="flex items-stretch">
						<div className="crt-edge w-px" />
						<div className="flex-1 bg-[linear-gradient(180deg,rgba(255,176,0,0.035),rgba(255,176,0,0.012))] px-[clamp(18px,4vw,40px)] py-[clamp(22px,4vw,38px)]">
							<div className="flex flex-col gap-6.5">
								<div className="flex flex-col gap-1.5">
									<h1 className="crt-glow m-0 text-[clamp(20px,3vw,26px)] font-semibold tracking-[0.02em]">
										{title}
									</h1>
									<p className="m-0 text-[13px] leading-[1.6] text-(--crt-dim)">
										{description}
									</p>
								</div>

								{children}

								{bottomBar ? (
									<div className="flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(122,92,56,0.4)] pt-1">
										{bottomBar}
									</div>
								) : null}
							</div>
						</div>
						<div className="crt-edge w-px" />
					</div>

					<div className="crt-glow flex items-baseline overflow-hidden text-[clamp(11px,1.6vw,13px)] tracking-[0.06em] whitespace-nowrap">
						<span>└</span>
						<span className="flex-1 overflow-hidden opacity-75">{RULE}</span>
						<span>[ {footerTag} ]─┘</span>
					</div>
				</div>

				<div className="text-xs leading-[1.7] tracking-[0.04em] text-(--crt-dim)">
					{"C:\\CODEARENA> "}
					<span className="text-(--crt-amber)">{prompt}</span>
					<span className="crt-blink inline-block h-3.5 w-2 -mb-0.5 bg-(--crt-amber)" />
				</div>
			</div>
		</div>
	);
}
