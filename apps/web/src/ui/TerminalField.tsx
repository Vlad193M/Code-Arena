import { useEffect, useId, useRef, useState } from "react";
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
  submitted?: boolean;
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
  submitted = false,
}: TerminalFieldProps) {
  const inputId = useId();
  const checksId = `${inputId}-checks`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [blurred, setBlurred] = useState(false);
  /** `null` until the browser reports a caret position — nothing is drawn before that. */
  const [caret, setCaret] = useState<number | null>(null);

  /** Validate late, revalidate early — silent until left or submitted, live after. */
  const touched = blurred || submitted;
  const visibleChecks = touched ? checks : [];

  const shown = mask ? "•".repeat(value.length) : value;
  const showPlaceholder = value.length === 0 && !focused;
  const invalid = visibleChecks.some((check) => !check.ok);

  const caretIndex = caret === null ? null : Math.min(caret, shown.length);

  /** `selectionStart` is unsupported on `email`/`number` inputs, so the real type stays text-like. */
  const inputType = type === "password" ? "password" : "text";

  /**
   * The browser positions the caret after `focus` fires, so reading it there yields 0.
   * Wait a frame for the initial value, then follow `selectionchange` for every later move.
   */
  useEffect(() => {
    const input = inputRef.current;
    if (!focused || !input) {
      setCaret(null);
      return;
    }

    const sync = () => setCaret(input.selectionStart ?? input.value.length);
    const frame = requestAnimationFrame(sync);
    document.addEventListener("selectionchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", sync);
    };
  }, [focused]);

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
          className={`crt-glow pointer-events-none flex min-h-[22px] min-w-0 flex-1 items-center overflow-hidden text-[15px] whitespace-pre text-(--crt-amber) ${
            mask ? "tracking-[0.14em]" : "tracking-[0.02em]"
          }`}
        >
          {caretIndex === null ? (
            <span>{shown}</span>
          ) : (
            <>
              <span>{shown.slice(0, caretIndex)}</span>
              <span className="relative inline-block w-0">
                <span className="crt-blink absolute top-1/2 left-px h-[18px] w-[9px] -translate-y-1/2 bg-(--crt-amber) shadow-[0_0_10px_rgba(255,176,0,0.6)]" />
              </span>
              <span>{shown.slice(caretIndex)}</span>
            </>
          )}
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
          ref={inputRef}
          type={inputType}
          inputMode={type === "email" ? "email" : undefined}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={visibleChecks.length > 0 ? checksId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setBlurred(true);
          }}
          className={`absolute inset-0 h-full w-full border-0 bg-transparent px-3.5 font-[inherit] text-[15px] text-transparent caret-transparent outline-none disabled:cursor-not-allowed ${
            mask ? "tracking-[0.14em]" : "tracking-[0.02em]"
          }`}
        />
      </div>

      <TerminalChecks id={checksId} checks={visibleChecks} />
    </div>
  );
}
