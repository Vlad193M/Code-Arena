import {
  type GithubReturnTo,
  rememberGithubReturnTo,
} from "../githubReturnTo";

type GithubAuthButtonProps = {
  command: string;
  returnTo: GithubReturnTo;
  disabled?: boolean;
};

export default function GithubAuthButton({
  command,
  returnTo,
  disabled = false,
}: GithubAuthButtonProps) {
  function startGithubAuth() {
    rememberGithubReturnTo(returnTo);
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={startGithubAuth}
      className="flex min-h-[50px] w-full cursor-pointer items-center gap-2.5 border border-dashed border-(--crt-dim) bg-transparent px-3.5 text-left font-[inherit] text-sm tracking-[0.04em] text-(--crt-amber) transition-colors duration-150 hover:border-(--crt-amber) hover:bg-[rgba(255,176,0,0.06)] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="text-(--crt-dim)">{"C:\\CODEARENA>"}</span>
      <span>{command}</span>
    </button>
  );
}
