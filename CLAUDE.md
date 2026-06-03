# CLAUDE.md

## Project

CodeArena — a real-time competitive programming platform. Two developers join a room, solve the same problem head-to-head; their code runs isolated on the server and the winner is decided by tests passed and time.

**This is a learning project.** Prefer teaching over doing: explain reasoning, propose approaches, and let the developer write the core logic. Don't rewrite large sections without explaining first.

## Stack

React + Vite · Express 5 · TypeScript · Prisma 7 + PostgreSQL · Redis · Socket.io · BullMQ · Docker. Auth via `jose` + bcrypt. Package manager: **pnpm** (never npm/yarn).

## Commands

```bash
# root
pnpm dev                 # api + web together
docker compose up -d     # start Postgres

# apps/api
pnpm db:migrate          # prisma migrate dev --name <name>
pnpm db:generate         # regenerate client after schema change
pnpm db:studio
```

## Constraints (IMPORTANT)

- **No repository layer** — services use Prisma directly. Do not add a wrapper.
- **Services must not import `req`/`res`** — HTTP stays in controllers.
- **All Linear content in English.** Our chat is Ukrainian; tickets/docs are English.
- Do not put business logic in routes or controllers.

## Layout

pnpm monorepo: `apps/api` (Express backend), `apps/web` (React frontend), `packages/*` (shared, when needed).

Backend is modular — each feature is a folder under `src/modules/<feature>/` with four files: `.routes.ts` (URLs, thin), `.controller.ts` (HTTP layer), `.service.ts` (logic + DB), `.schemas.ts` (Zod). Shared pieces: `config/env.ts` (Zod-validated env), `db/prisma.client.ts` (singleton), `lib/` (cross-feature utils), `middlewares/error.middleware.ts` (`AppError` + global handler). `app.ts` configures Express; `server.ts` only listens.

File naming: `<feature>.<role>.ts`.

## Project-specific gotchas

- **Prisma 7** needs an adapter (`@prisma/adapter-pg`); the connection URL lives in `prisma.config.ts`, not `schema.prisma`.
- Env is read from the validated `env` object in `config/env.ts`, never `process.env` directly.

## Workflow

Tickets in Linear (project `codearena`, key `COD`). One ticket = one branch = one PR. Branch names come from Linear. Conventional Commits (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`). YAGNI — build only what the current ticket needs.

Full process: see the "Development Workflow" doc in the Linear project's Resources.