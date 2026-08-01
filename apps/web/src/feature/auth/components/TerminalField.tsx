import { useId, useState } from "react";
import TerminalChecks, { type TerminalCheck } from "./TerminalChecks";

type TerminalFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	type?: "text" | "email" | "password";
	autoComplete?: string;
	placeholder?: string;
	mask?: boolean;
	disabled?: boolean;
	checks?: Array<TerminalCheck>;
};

export default function TerminalField({
	label,
	value,
	onChange,
	type = "text",
	autoComplete,
	placeholder,
	mask = false,
	disabled = false,
	checks = [],
}: TerminalFieldProps) {
	const inputId = useId();
	const checksId = `${inputId}-checks`;
	const [focused, setFocused] = useState(false);

	const shown = mask ? "•".repeat(value.length) : value;
	const showPlaceholder = value.length === 0 && !focused;
	const invalid = checks.some((check) => !check.ok);

	return (
		<div className="flex flex-col gap-[7px]">
			<label
				htmlFor={inputId}
				className="crt-glow text-[13px] tracking-[0.09em] text-(--crt-amber)"
			>
				{`> ${label}`}
			</label>

			<div className="relative flex min-h-[50px] items-center border border-(--crt-dim) bg-black/35 px-3.5">
				<div
					className={`crt-glow pointer-events-none flex items-center overflow-hidden text-[15px] whitespace-pre text-(--crt-amber) ${
						mask ? "tracking-[0.14em]" : "tracking-[0.02em]"
					}`}
				>
					<span>{shown}</span>
					{focused ? (
						<span className="crt-blink ml-px inline-block h-[18px] w-[9px] bg-(--crt-amber) shadow-[0_0_10px_rgba(255,176,0,0.6)]" />
					) : null}
				</div>

				{showPlaceholder ? (
					<span className="pointer-events-none absolute left-3.5 text-[15px] text-(--crt-dim)">
						{placeholder}
					</span>
				) : null}

				{focused ? (
					<div className="pointer-events-none absolute -inset-px border border-(--crt-amber) shadow-[0_0_16px_rgba(255,176,0,0.28),inset_0_0_20px_rgba(255,176,0,0.05)]" />
				) : null}

				<input
					id={inputId}
					type={type}
					value={value}
					autoComplete={autoComplete}
					disabled={disabled}
					aria-invalid={invalid}
					aria-describedby={checks.length > 0 ? checksId : undefined}
					onChange={(event) => onChange(event.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					className="absolute inset-0 h-full w-full border-0 bg-transparent px-3.5 font-[inherit] text-[15px] text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
				/>
			</div>

			<TerminalChecks id={checksId} checks={checks} />
		</div>
	);
}
