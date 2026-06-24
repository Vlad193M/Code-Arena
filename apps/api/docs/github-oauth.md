# GitHub OAuth login (COD-14)

Sign in with GitHub. GitHub redirects back to the frontend, which forwards the
one-time `code` to the backend over a `POST`. Tokens are never placed in a URL:
the backend returns the access token in the response body and the refresh token
in an httpOnly cookie — the same way password login works.

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Endpoints: `GET /api/auth/github` (start), `POST /api/auth/github` (callback exchange)

```mermaid
sequenceDiagram
    autonumber
    actor U as Browser (User)
    participant F as Frontend (3000)
    participant B as Backend (8000)
    participant G as GitHub
    participant DB as Postgres
    participant R as Redis

    U->>B: GET /api/auth/github
    Note over B: buildGithubAuthUrl()<br/>generates state
    B-->>U: 302 → GitHub authorize<br/>Set-Cookie: oauth_state (lax)

    U->>G: authorize (consent screen)
    alt User denies / fails
        G-->>U: redirect ?error=access_denied
        U->>F: /auth/github/callback?error=...
        F-->>U: "Sign-in did not complete"
    else User approves
        G-->>U: 302 → Frontend ?code&state
        U->>F: /auth/github/callback?code&state
        F->>B: POST /api/auth/github { code, state }<br/>credentials: include (oauth_state cookie)

        Note over B: githubCallback()
        B->>B: githubCallbackSchema.parse(body)
        alt state(body) ≠ oauth_state cookie
            B-->>F: 401 Invalid OAuth state
        else state matches
            Note over B: loginWithGithub(code)
            B->>G: POST /login/oauth/access_token<br/>(client_secret) — exchangeGithubCode
            G-->>B: { access_token }
            par fetchGithubProfile (concurrent)
                B->>G: GET /user
                G-->>B: { id, login }
            and
                B->>G: GET /user/emails
                G-->>B: [{ email, primary, verified }]
            end

            Note over B,DB: findOrCreateGithubUser(profile)
            B->>DB: findUnique by email
            alt account with this email exists
                DB-->>B: user
                B->>DB: update githubId (link) / or conflict
            else no account by email
                DB-->>B: null
                B->>DB: upsert by githubId (INSERT ... ON CONFLICT)
                DB-->>B: user (created or existing)
            end

            Note over B,R: issueAuthResult(user)
            B->>R: set refreshToken:{userId}:{jti}
            B-->>F: 200 { accessToken, user }<br/>Set-Cookie: refreshToken (httpOnly)
            F-->>U: stores accessToken → into the app
        end
    end
```

## Notes

- The two redirect hops are plain browser navigation and carry no secrets — only
  `code` and `state` travel in the URL.
- `state` (CSRF): set as the `oauth_state` cookie on `GET /api/auth/github`, echoed
  back through GitHub, and compared against the request body in `githubCallback`.
- `exchangeGithubCode` is the only call that uses the client secret.
- `/user` and `/user/emails` are fetched concurrently (`Promise.all`); the email is
  taken only from `/user/emails` and must be verified.
- `findOrCreateGithubUser` links an existing account by email, otherwise creates via
  an atomic `upsert` on `githubId` so concurrent first logins can't double-create.
