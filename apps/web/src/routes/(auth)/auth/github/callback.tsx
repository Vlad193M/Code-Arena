import { apiClient } from "#/api/client";
import TerminalAlert from "#/feature/auth/components/TerminalAlert";
import TerminalFrame from "#/feature/auth/components/TerminalFrame";
import { type AuthError, toAuthError } from "#/feature/auth/errors";
import { takeGithubReturnTo } from "#/feature/auth/githubReturnTo";
import { setSession } from "#/feature/auth/store";
import { githubCallbackSchema } from "@codearena/shared";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";

const searchSchema = z
  .union([
    githubCallbackSchema,
    z.object({
      error: z.string().min(1),
    }),
  ])
  .catch({ error: "invalid_request" });

export const Route = createFileRoute("/(auth)/auth/github/callback")({
  ssr: false,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ ...search }),
  loader: async ({ deps }) => {
    const returnTo = takeGithubReturnTo();

    const failure = (error: AuthError) =>
      returnTo === "/register"
        ? redirect({ to: "/register", search: { error }, replace: true })
        : redirect({ to: "/login", search: { error }, replace: true });

    if ("error" in deps) {
      throw failure(toAuthError(deps.error));
    }

    const res = await apiClient.POST("/api/auth/github", {
      body: {
        code: deps.code,
        state: deps.state,
      },
    });

    if (!res.data) {
      throw failure("github_failed");
    }

    setSession(res.data);
    throw redirect({ to: "/", replace: true });
  },
  pendingComponent: GithubExchangeScreen,
  /** The loader always redirects, so reaching this means the redirect was lost. */
  component: GithubStalledScreen,
});

function GithubExchangeScreen() {
  return (
    <TerminalFrame
      title="HANDSHAKE"
      description="Verifying your GitHub identity. Hold the line."
      footerTag="SECURE CHANNEL"
      prompt="auth --github --exchange"
    >
      <div className="flex items-center gap-2.5 text-sm tracking-[0.04em] text-(--crt-amber)">
        <span className="text-(--crt-dim)">{"C:\\CODEARENA>"}</span>
        <span>
          exchanging authorization code
          <span className="crt-blink">_</span>
        </span>
      </div>
    </TerminalFrame>
  );
}

function GithubStalledScreen() {
  return (
    <TerminalFrame
      title="HANDSHAKE STALLED"
      description="The exchange finished but the redirect never happened."
      footerTag="UNEXPECTED STATE"
      prompt="auth --github --stalled"
    >
      <div className="flex flex-col gap-4">
        <TerminalAlert tone="error">
          Reached the callback component, which should be unreachable.
        </TerminalAlert>
        <Link
          to="/login"
          className="crt-glow text-sm tracking-[0.05em] text-(--crt-amber) no-underline hover:text-(--crt-amber-bright)"
        >
          {"> BACK TO LOGIN"}
          <span className="crt-blink">_</span>
        </Link>
      </div>
    </TerminalFrame>
  );
}
