# Tier 1 — Containerization & Local Orchestration

> **Goal:** Make the entire SupportHub stack build and run reproducibly with one command, via
> multi‑stage Docker images and a full Docker Compose topology. **Primary skill:** DevOps.
> **Effort:** S–M. **Depends on:** nothing. **Cost:** free / local.

## Why this tier (real gap)

The repo has **no Dockerfiles and no deployment manifests** — only `docker-compose.yml` that starts
Redis for local dev. There is no reproducible way to build or run the API/web. This is the foundation
every later tier builds on (CI builds images, K8s runs images, load tests target a containerized stack).

## Résumé value

- "Authored multi‑stage Docker images for a pnpm/Turborepo monorepo and a five‑service Compose stack,
  giving a one‑command reproducible environment for the full app (Postgres, Redis, web‑API, worker, web)."

## Scope

**In:** API Dockerfile (one image, two run modes: web‑API and worker), Web Dockerfile (Next.js
standalone), `.dockerignore`, full `docker-compose.full.yml`, `.env.docker.example`, healthchecks,
image size optimization.
**Out:** the actual process split logic (that's Tier 2 — here the worker just runs `node dist/worker.js`
which Tier 2 creates; until then the compose `worker` service can be commented out or reuse index).

## Prerequisites

- Docker Desktop / Docker Engine + Compose v2.
- Note Prisma 7 here uses the `prisma-client` generator + `@prisma/adapter-pg` (driver adapter) → the
  client is engine‑light, which keeps images small and avoids native query‑engine binaries.

## Plan / tasks

1. **`[ ]` Enable Next.js standalone output** — `apps/web/next.config.mjs`: add `output: "standalone"`
   so the web image ships only the traced runtime (small image).
2. **`[ ]` Add `.dockerignore`** at repo root: `node_modules`, `**/node_modules`, `.next`, `dist`,
   `.turbo`, `.git`, `**/.env*`, `coverage`, `design_ss`.
3. **`[ ]` API Dockerfile** — `apps/api/Dockerfile`, multi‑stage:
   - `base`: `node:20-alpine` + `corepack enable` (pnpm).
   - `deps`: copy root `package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json` + every workspace
     `package.json`; `pnpm install --frozen-lockfile`.
   - `build`: copy `apps/api`; `pnpm --filter api prisma:generate && pnpm --filter api build`.
   - `runner`: copy `node_modules`, `apps/api/{dist,generated,prisma,package.json}`; non‑root user;
     `EXPOSE 5000`; default `CMD ["node","dist/index.js"]`.
4. **`[ ]` Web Dockerfile** — `apps/web/Dockerfile`, multi‑stage producing `.next/standalone`:
   - Build stage accepts `NEXT_PUBLIC_*` **build args** (they're inlined at build time):
     `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`.
   - Runner copies `.next/standalone`, `.next/static`, `public`; `CMD ["node","apps/web/server.js"]`.
5. **`[ ]` `docker-compose.full.yml`** — services:
   - `postgres:16-alpine` (volume + `pg_isready` healthcheck).
   - `redis:7-alpine` (AOF + `redis-cli ping` healthcheck).
   - `api` (build `apps/api`), `depends_on` Postgres+Redis healthy, `RUN_BACKGROUND_WORKERS=false`,
     port `5000:5000`.
   - `worker` (same image, `command: node dist/worker.js`) — no ports; `deploy.replicas` ready to scale.
   - `web` (build `apps/web`) port `3001:3001`, behind a Compose `profiles: [web]` so it's optional.
6. **`[ ]` `.env.docker.example`** — all env vars from the architecture review's deployment doc, with
   in‑container hostnames (`DATABASE_URL=postgresql://...@postgres:5432/...`,
   `REDIS_URL=redis://redis:6379`).
7. **`[ ]` Run migrations on boot** — either an `api` entrypoint that runs `prisma migrate deploy`
   before `node dist/index.js`, or a one‑shot `migrate` service. Document the choice.
8. **`[ ]` Image hygiene** — non‑root `USER`, `NODE_ENV=production`, `.dockerignore` verified, layer
   ordering for cache hits; record final image sizes.

## Key technical decisions

- **One API image, two commands.** The `api` and `worker` services share the same image; only the
  `command`/entrypoint differs (`dist/index.js` vs `dist/worker.js`). This is idiomatic and keeps
  builds/CI simple.
- **`pnpm install --frozen-lockfile`** in Docker — so add new deps to `package.json` *and* update the
  lockfile locally first (relevant once Tier 2 adds the Socket.IO Redis packages).
- **Build‑time vs runtime env:** `NEXT_PUBLIC_*` must be present at `next build` (ARGs); the API reads
  everything at runtime (env_file).

## Definition of Done (demoable)

- `docker compose -f docker-compose.full.yml up --build` brings up Postgres, Redis, api, worker, web.
- `curl localhost:5000/api/health` → `{ "status": "ok" }`.
- `docker compose ... up -d --scale worker=3` runs 3 worker containers (sets up the Tier 2 demo).
- `docker images` shows reasonably small API and web images (record the numbers for your README).

## Risks & gotchas

- **Next.js standalone + monorepo + `transpilePackages`** can need the static/public copy steps exactly
  right — iterate until the page loads.
- **Alpine + Prisma**: with the driver adapter you should avoid the OpenSSL/native‑engine pitfalls, but
  if Prisma complains, switch the runner base to `node:20-slim` or add `libc6-compat`.
- Keep secrets out of the image — use `env_file`/Compose env, never `COPY .env`.

## Cost

100% free and local.
</content>
