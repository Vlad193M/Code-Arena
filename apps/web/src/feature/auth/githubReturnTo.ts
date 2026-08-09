const STORAGE_KEY = "github_return_to";

export type GithubReturnTo = "/login" | "/register";

const DEFAULT_RETURN_TO: GithubReturnTo = "/login";

/**
 * The OAuth round trip leaves the app entirely, so the starting page is kept in
 * sessionStorage — it survives the redirects and stays scoped to this tab.
 */
export function rememberGithubReturnTo(path: GithubReturnTo) {
  sessionStorage.setItem(STORAGE_KEY, path);
}

/** Reads and clears the stored page, falling back to the login screen. */
export function takeGithubReturnTo(): GithubReturnTo {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);

  return stored === "/register" ? stored : DEFAULT_RETURN_TO;
}
