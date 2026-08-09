import { apiClient } from "#/api/client";
import { loginSchema } from "@codearena/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toApiErrorMessage, toThrownErrorMessage } from "../errors";
import { check, missing } from "../checks";
import { setSession } from "../store";
import GithubAuthButton from "./GithubAuthButton";
import TerminalAlert from "./TerminalAlert";
import TerminalButton from "./TerminalButton";
import type { TerminalCheck } from "./TerminalChecks";
import TerminalField from "./TerminalField";
import TerminalFrame from "./TerminalFrame";

const field = loginSchema.shape;

function emailChecks(value: string, tried: boolean): Array<TerminalCheck> {
  if (!value) return tried ? missing("email") : [];

  return [
    check(
      field.email.safeParse(value).success,
      "email format OK",
      "invalid email format",
    ),
  ];
}

/** Any non-empty password satisfies the schema, so only absence is worth saying. */
function passwordChecks(value: string, tried: boolean): Array<TerminalCheck> {
  return !value && tried ? missing("password") : [];
}

type LoginScreenProps = {
  githubError?: string;
};

export default function LoginScreen({ githubError }: LoginScreenProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const valid = loginSchema.safeParse({ email, password }).success;

  async function handleEmailLogin(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (githubError) {
      navigate({ to: "/login", search: {}, replace: true });
    }
    setTried(true);

    if (!valid) {
      return;
    }

    setFormError("");
    setPending(true);

    try {
      const { error, data } = await apiClient.POST("/api/auth/login", {
        body: {
          email,
          password,
        },
      });

      if (error) {
        setFormError(toApiErrorMessage(error));
        return;
      }

      setSession(data);
    } catch (cause) {
      setFormError(toThrownErrorMessage(cause));
      return;
    } finally {
      setPending(false);
    }

    navigate({ to: "/" });
  }

  const errorMessage = formError || githubError;

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
      <form className="flex flex-col gap-6.5" onSubmit={handleEmailLogin}>
        <div className="flex flex-col gap-5">
          <TerminalField
            label="EMAIL:"
            type="email"
            autoComplete="email"
            placeholder="player@domain.dev"
            value={email}
            onChange={setEmail}
            disabled={pending}
            checks={emailChecks(email, tried)}
            submitted={tried}
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
              checks={passwordChecks(password, tried)}
              submitted={tried}
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

        {errorMessage ? (
          <TerminalAlert tone="error">{errorMessage}</TerminalAlert>
        ) : tried && !valid ? (
          <TerminalAlert tone="error">
            LOGIN HALTED: fix the errors listed above
          </TerminalAlert>
        ) : null}

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

          <GithubAuthButton
            command="run github_auth.exe"
            returnTo="/login"
            disabled={pending}
          />
        </div>
      </form>
    </TerminalFrame>
  );
}
