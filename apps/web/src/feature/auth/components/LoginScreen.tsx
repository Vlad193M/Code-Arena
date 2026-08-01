import { useState } from "react";

import { Link } from "@tanstack/react-router";
import TerminalAlert from "./TerminalAlert";
import TerminalButton from "./TerminalButton";
import TerminalField from "./TerminalField";
import TerminalFrame from "./TerminalFrame";

export type LoginValues = {
  email: string;
  password: string;
};

type LoginScreenProps = {
  onSubmit?: (values: LoginValues) => void;
  onGithubLogin?: () => void;
  pending?: boolean;
  error?: string | null;
};

export default function LoginScreen({
  onSubmit,
  onGithubLogin,
  pending = false,
  error = null,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <TerminalFrame
      title="SIGN IN"
      description="Authenticate to join the queue and battle head-to-head."
      footerTag="SECURE CHANNEL"
      prompt="auth --login"
      bottomBar={
        <>
          <Link
            to="/register"
            className="crt-glow text-sm tracking-[0.05em] text-(--crt-amber) no-underline hover:text-(--crt-amber-bright)"
          >
            {"> NEW USER? REGISTER"}
            <span className="crt-blink">_</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-(--crt-dim)">
            <span className="h-[7px] w-[7px] bg-(--crt-green) shadow-[0_0_9px_rgba(51,255,102,0.8)]" />
            1,284 PLAYERS ONLINE
          </div>
        </>
      }
    >
      <form
        className="flex flex-col gap-6.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.({ email, password });
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
          />

          <div className="flex flex-col gap-[7px]">
            <TerminalField
              label="PASSWORD:"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              mask
              value={password}
              onChange={setPassword}
              disabled={pending}
            />
            <div className="flex justify-end">
              <Link
                to="/login"
                hash="#forgot"
                className="text-xs tracking-[0.04em] text-(--crt-dim) no-underline hover:text-(--crt-amber)"
              >
                {"> FORGOT PASSWORD?"}
              </Link>
            </div>
          </div>
        </div>

        {error ? <TerminalAlert tone="error">{error}</TerminalAlert> : null}

        <div className="flex flex-col gap-4">
          <TerminalButton
            label="ENTER ARENA"
            pending={pending}
            pendingLabel="AUTHENTICATING"
          />

          <div className="flex items-center gap-3 text-xs tracking-[0.1em] text-(--crt-dim)">
            <span className="h-px flex-1 bg-[rgba(122,92,56,0.6)]" />
            <span>OR</span>
            <span className="h-px flex-1 bg-[rgba(122,92,56,0.6)]" />
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={onGithubLogin}
            className="flex min-h-[50px] w-full cursor-pointer items-center gap-2.5 border border-dashed border-(--crt-dim) bg-transparent px-3.5 text-left font-[inherit] text-sm tracking-[0.04em] text-(--crt-amber) transition-colors duration-150 hover:border-(--crt-amber) hover:bg-[rgba(255,176,0,0.06)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="text-(--crt-dim)">{"C:\\CODEARENA>"}</span>
            <span>run github_auth.exe</span>
          </button>
        </div>
      </form>
    </TerminalFrame>
  );
}
