export const refreshTokenExpiry = "14d";
export const refreshTokenExpirySeconds = 14 * 24 * 60 * 60; // 14 days in seconds

export const GITHUB_AUTHORIZE_URL =
  "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL =
  "https://github.com/login/oauth/access_token";
export const GITHUB_USER_API_URL = "https://api.github.com/user";
export const GITHUB_USER_EMAILS_API_URL =
  "https://api.github.com/user/emails";
export const GITHUB_OAUTH_SCOPE = "read:user user:email";
export const oauthStateCookieMaxAge = 5 * 60 * 1000; // 5 minutes in milliseconds
