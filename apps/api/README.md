# CodeArena API

Backend for **CodeArena** — a real-time competitive programming platform. Two developers join a room, solve the same problem head-to-head, their code runs isolated on the server, and the winner is decided by tests passed and time.

This is the Express server that handles auth, rooms, problems, code execution, and the realtime match flow.

## Stack

Express 5 · TypeScript · Prisma 7 + PostgreSQL · Zod · `jose` + bcrypt

## Structure

The backend is modular — each feature lives in its own folder under `src/modules/<feature>/`, split into routes (URLs), controller (HTTP), service (logic + DB), and schemas (Zod validation).

```
src/
├── app.ts          # Express app: middleware + routers
├── server.ts       # Starts the server
├── config/         # Validated environment variables
├── db/             # Prisma client
├── middlewares/    # Error handling
└── modules/        # Features (auth, health, ...)
```

## Requirements

- Node.js + [pnpm](https://pnpm.io) (the only supported package manager)
- Docker (for PostgreSQL)

## Running locally

From `apps/api`:

```bash
# 1. Set up environment variables
cp .env.example .env

# 2. Start PostgreSQL (run from the repo root)
docker compose up -d

# 3. Set up the database
pnpm db:generate   # generate the Prisma client
pnpm db:migrate    # apply migrations

# 4. Start the dev server
pnpm dev
```

The server runs on the `PORT` from your `.env`. Check that it's alive at `GET /api/health`.

## Useful scripts

| Script             | What it does                  |
| ------------------ | ----------------------------- |
| `pnpm dev`         | Dev server with auto-reload   |
| `pnpm build`       | Compile TypeScript to `dist/` |
| `pnpm start`       | Run the compiled server       |
| `pnpm db:migrate`  | Create/apply a migration      |
| `pnpm db:studio`   | Open Prisma Studio (DB GUI)   |
