# Authenticated WebSocket connection (COD-21)

Socket.io runs on the same HTTP server as the REST API and shares its identity
rules. The difference is *when* identity is proven: HTTP carries a token on every
request, a socket proves itself **once**, during the handshake, and then stays
open for hours. Everything below follows from that asymmetry.

- Frontend: `http://localhost:3000` — one shared socket per tab (`apps/web/src/api/socket.ts`)
- Backend: `http://localhost:8000` — `createWebSocketServer` in `src/lib/socket.ts`
- Access token: sent as `handshake.auth.accessToken`, **not** an `Authorization` header

## Handshake

```mermaid
sequenceDiagram
    autonumber
    participant S as Auth store (browser)
    participant C as Socket client
    participant M as io.use (backend)
    participant J as authenticateToken

    Note over S,C: startSocketBridge() subscribes to the auth store
    S->>C: status = authenticated
    C->>C: connect() — autoConnect is off until now

    Note over C: auth callback re-reads the store<br/>on every attempt, so a retry<br/>carries the current token
    C->>M: handshake { accessToken }

    alt no token in handshake
        M-->>C: Error No token provided<br/>data.kind = unauthorized
    else token present
        M->>J: verify (same secret and policy as HTTP)
        alt invalid or expired
            J-->>M: AppError unauthorized
            M-->>C: Error Invalid token<br/>data.kind = unauthorized
        else valid
            J-->>M: sub (user id)
            M->>M: socket.data.userId = sub
            M-->>C: next() — connection accepted
            Note over M: connection handler runs<br/>every handler can read socket.data.userId
        end
    end

    S->>C: status = anonymous (logout)
    C->>M: disconnect()
```

## Token expiry and recovery

A 15-minute access token expires long before the socket closes. When the client
then tries to reconnect, the handshake is denied — and socket.io treats a
middleware denial as final: it **disables its own reconnection and backoff**, so
nothing retries unless the application does.

That makes the retry loop the application's responsibility, and an unbounded one
would hammer `/api/auth/refresh` at network speed. `socket.active` separates the
two failure classes, and one recovery attempt per connection episode bounds the rest.

```mermaid
flowchart TD
    E["connect_error"] --> A{"socket.active?"}
    A -->|"true — transport failure"| B["Do nothing:<br/>socket.io retries with backoff"]
    A -->|"false — denied by io.use"| K{"data.kind = unauthorized<br/>and no attempt made yet?"}
    K -->|"no"| L["Log and stop"]
    K -->|"yes"| R["ensureRefreshed()"]
    R -->|"refresh failed"| X["clearSession() →<br/>bridge disconnects, user logs in again"]
    R -->|"new access token"| Q{"still authenticated<br/>after the await?"}
    Q -->|"no — logout raced us"| Y["Stop: the bridge already decided"]
    Q -->|"yes"| C["connect() — one attempt"]
    C --> D{"handshake result"}
    D -->|"denied again"| E
    D -->|"accepted"| OK["connect → attempt budget resets"]
```

## Notes

- `authenticateToken` (`src/lib/jwt.ts`) is shared by the HTTP middleware and the
  socket handshake, so both transports accept exactly the same tokens.
- `toHandshakeError` flattens failures before they cross the wire: socket.io only
  forwards `message` and `data`, and unknown errors collapse to `kind: "internal"`
  rather than leaking internals.
- `kind` is currently `"unauthorized"` for both "this token expired" (a refresh
  fixes it) and "you may not connect" (a refresh never will). Once the handshake
  checks more than the token — a ban, a room membership — these must become
  distinct kinds, otherwise the client retries a denial it can never satisfy.
- Server-side listeners registered inside the `connection` handler are bound to
  that socket and are removed with it, so no explicit teardown is needed.
- The client keeps one socket per tab. Feature hooks subscribe to it and remove
  their own listeners on unmount; they never construct a second instance.
