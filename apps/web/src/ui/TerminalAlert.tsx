import type { ReactNode } from "react";

type TerminalAlertProps = {
	tone: "error" | "success";
	children: ReactNode;
};

const TONE_CLASS = {
	error:
		"crt-glow-red border-[rgba(255,68,68,0.55)] bg-[rgba(255,68,68,0.07)] text-(--crt-red)",
	success:
		"crt-glow-green border-[rgba(51,255,102,0.5)] bg-[rgba(51,255,102,0.06)] text-(--crt-green)",
} as const;

export default function TerminalAlert({ tone, children }: TerminalAlertProps) {
	return (
		<div
			role={tone === "error" ? "alert" : "status"}
			className={`border px-3.5 py-3 text-[13px] leading-[1.6] ${TONE_CLASS[tone]}`}
		>
			{children}
		</div>
	);
}
