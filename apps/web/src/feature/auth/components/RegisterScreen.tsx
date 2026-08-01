import { Link } from "@tanstack/react-router";
import { useState } from "react";
import TerminalAlert from "./TerminalAlert";
import TerminalButton from "./TerminalButton";
import type { TerminalCheck } from "./TerminalChecks";
import TerminalField from "./TerminalField";
import TerminalFrame from "./TerminalFrame";

export type RegisterValues = {
  email: string;
  username: string;
  password: string;
};

type RegisterScreenProps = {
  onSubmit?: (values: RegisterValues) => void;
  pending?: boolean;
  error?: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const USERNAME_PATTERN = /^[a-z0-9_]{3,16}$/i;

function check(ok: boolean, okText: string, badText: string): TerminalCheck {
  return { ok, text: ok ? okText : badText };
}

/** TODO(COD-17): derive these from the shared Zod/OpenAPI rules instead of local regexes. */
function emailChecks(value: string): Array<TerminalCheck> {
  if (!value) return [];
  return [
    check(EMAIL_PATTERN.test(value), "email format OK", "invalid email format"),
  ];
}

function usernameChecks(value: string): Array<TerminalCheck> {
  if (!value) return [];
  return [
    check(
      USERNAME_PATTERN.test(value),
      "handle available",
      "3-16 chars: a-z 0-9 _ only",
    ),
  ];
}

function passwordChecks(value: string): Array<TerminalCheck> {
  if (!value) return [];
  return [
    check(
      value.length >= 8,
      "8+ characters",
      "too short — 8 characters minimum",
    ),
    check(
      /[0-9]/.test(value) && /[^a-z0-9]/i.test(value),
      "contains number + symbol",
      "add a number and a symbol",
    ),
  ];
}

export default function RegisterScreen({
  onSubmit,
  pending = false,
  error = null,
}: RegisterScreenProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);

  const fieldChecks = [
    emailChecks(email),
    usernameChecks(username),
    passwordChecks(password),
  ];
  const valid =
    EMAIL_PATTERN.test(email) &&
    USERNAME_PATTERN.test(username) &&
    fieldChecks[2].length > 0 &&
    fieldChecks[2].every((line) => line.ok);

  return (
    <TerminalFrame
      title="CREATE ACCOUNT"
      description="Register a handle. It is shown to your opponent during a match."
      footerTag="STEP 1 OF 2"
      prompt="register --new"
      bottomBar={
        <>
          <Link
            to="/login"
            className="crt-glow text-sm tracking-[0.05em] text-(--crt-amber) no-underline hover:text-(--crt-amber-bright)"
          >
            {"> HAVE ACCOUNT? LOGIN"}
            <span className="crt-blink">_</span>
          </Link>
          <div className="text-xs text-(--crt-dim)">ESC TO ABORT</div>
        </>
      }
    >
      <form
        className="flex flex-col gap-6.5"
        onSubmit={(event) => {
          event.preventDefault();
          setTried(true);
          if (valid) {
            onSubmit?.({ email, username, password });
          }
        }}
      >
        <div className="flex flex-col gap-5">
          <TerminalField
            label="EMAIL:"
            type="email"
            autoComplete="email"
            placeholder="player@domain.dev"
            value={email}
            onChange={setEmail}
            disabled={pending}
            checks={fieldChecks[0]}
          />
          <TerminalField
            label="USERNAME:"
            autoComplete="username"
            placeholder="null_pointer"
            value={username}
            onChange={setUsername}
            disabled={pending}
            checks={fieldChecks[1]}
          />
          <TerminalField
            label="PASSWORD:"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            mask
            value={password}
            onChange={setPassword}
            disabled={pending}
            checks={fieldChecks[2]}
          />
        </div>

        <TerminalButton
          label="CREATE ACCOUNT"
          pending={pending}
          pendingLabel="CREATING"
        />

        {error ? (
          <TerminalAlert tone="error">{error}</TerminalAlert>
        ) : tried && !valid ? (
          <TerminalAlert tone="error">
            REGISTRATION HALTED: fix the errors listed above
          </TerminalAlert>
        ) : null}
      </form>
    </TerminalFrame>
  );
}
