import { AUTH_LIMITS, registerSchema } from "@codearena/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiClient } from "#/api/client";
import TerminalAlert from "#/ui/TerminalAlert";
import TerminalButton from "#/ui/TerminalButton";
import type { TerminalCheck } from "#/ui/TerminalChecks";
import TerminalField from "#/ui/TerminalField";
import TerminalFrame from "#/ui/TerminalFrame";
import { check, missing } from "../checks";
import { toApiErrorMessage, toThrownErrorMessage } from "../errors";
import { setSession } from "../store";
import GithubAuthButton from "./GithubAuthButton";

const field = registerSchema.shape;

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

function usernameChecks(value: string, tried: boolean): Array<TerminalCheck> {
  if (!value) return tried ? missing("handle") : [];

  const { min, max } = AUTH_LIMITS.username;
  return [
    check(
      field.username.safeParse(value).success,
      "handle length OK",
      `${min}-${max} characters`,
    ),
  ];
}

function passwordChecks(value: string, tried: boolean): Array<TerminalCheck> {
  if (!value) return tried ? missing("password") : [];

  const { min, max } = AUTH_LIMITS.password;
  return [
    check(
      field.password.safeParse(value).success,
      `${min}+ characters`,
      value.length < min
        ? `too short — ${min} characters minimum`
        : `too long — ${max} characters maximum`,
    ),
  ];
}

type RegisterScreenProps = {
  githubError?: string;
};

export default function RegisterScreen({ githubError }: RegisterScreenProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const valid = registerSchema.safeParse({ email, username, password }).success;
  const errorMessage = error || githubError;

  async function handleRegister(event: React.SubmitEvent) {
    event.preventDefault();
    if (pending) return;

    if (githubError) {
      navigate({ to: "/register", search: {}, replace: true });
    }
    setTried(true);

    if (!valid) {
      return;
    }

    setError("");
    setPending(true);

    try {
      const { error, data } = await apiClient.POST("/api/auth/register", {
        body: {
          email,
          password,
          username,
        },
      });

      if (error) {
        setError(toApiErrorMessage(error));
        return;
      }

      setSession(data);
    } catch (cause) {
      setError(toThrownErrorMessage(cause));
      return;
    } finally {
      setPending(false);
    }

    navigate({ to: "/" });
  }
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
      <form className="flex flex-col gap-6.5" onSubmit={handleRegister}>
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
          <TerminalField
            label="USERNAME:"
            autoComplete="username"
            placeholder="null_pointer"
            value={username}
            onChange={setUsername}
            disabled={pending}
            checks={usernameChecks(username, tried)}
            submitted={tried}
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
            checks={passwordChecks(password, tried)}
            submitted={tried}
          />
        </div>

        <div className="flex flex-col gap-4">
          <TerminalButton
            label="CREATE ACCOUNT"
            pending={pending}
            pendingLabel="CREATING"
          />

          <div className="flex items-center gap-3 text-xs tracking-[0.1em] text-(--crt-dim)">
            <span className="h-px flex-1 bg-[rgba(122,92,56,0.6)]" />
            <span>OR</span>
            <span className="h-px flex-1 bg-[rgba(122,92,56,0.6)]" />
          </div>

          <GithubAuthButton
            command="run github_signup.exe"
            returnTo="/register"
            disabled={pending}
          />
        </div>

        {errorMessage ? (
          <TerminalAlert tone="error">{errorMessage}</TerminalAlert>
        ) : tried && !valid ? (
          <TerminalAlert tone="error">
            REGISTRATION HALTED: fix the errors listed above
          </TerminalAlert>
        ) : null}
      </form>
    </TerminalFrame>
  );
}
