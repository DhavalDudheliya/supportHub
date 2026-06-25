# Tier 3 — CI/CD Automation

> **Goal:** A GitHub Actions pipeline that validates, builds, and ships the monorepo on every push/PR.
> **Primary skill:** DevOps / CI‑CD. **Effort:** M. **Depends on:** T1. **Cost:** free (GitHub Actions
> free tier).

## Why this tier (real gap)

There is **no CI/CD** in the repo — no `.github/workflows`, no automated lint/typecheck/test/build, no
image publishing. Husky + lint‑staged run locally only. Quality and deployment are entirely manual.

## Résumé value

- "Built a GitHub Actions CI/CD pipeline for a pnpm/Turborepo monorepo with Turbo remote‑cache‑style
  affected builds, Prisma migration checks, multi‑stage Docker image build & push to GHCR, and a
  health‑gated deploy step."

## Scope

**In:** CI workflow (install → lint → typecheck → build, using Turbo + pnpm cache), DB migration
validation against an ephemeral Postgres service, Docker build & push to GitHub Container Registry
(GHCR), branch protections, a deploy job (manual/`workflow_dispatch` or to a free host).
**Out:** full e2e test suite (none exists yet — note as a follow‑up), production cloud account.

## Status (as of 2026-06-25)

**Live:** automated backend deploys are working end-to-end — push to `main` builds the API
image on GitHub runners, pushes to GHCR (`sha` + `latest` tags, GHA build cache), then SSH-deploys
to EC2 (`docker compose pull && up -d`) with a **self-migrating container** (`prisma migrate deploy`
on boot) and a **health-gated deploy with automatic rollback** to the previous image if
`/api/health` doesn't come up. Secrets live in GitHub Actions (SSH key, GHCR PAT) and in `~/deploy/.env`
on the box. Redis and Postgres are managed/hosted (not in compose).

**Still open:** the CI quality gate (#1), the ephemeral-Postgres migration check (#2), and repo
hygiene (#5). Notably there is **no pre-deploy lint/typecheck/test gate yet** — which is how two
runtime bugs reached prod before being caught (the `dist/src/index.js` entry path and an
extensionless Prisma client ESM import). Closing #1 is the next priority. Hardening follow-ups
tracked in T5: replace SSH-open-to-`0.0.0.0/0` with SSM, shrink the ~1GB image / use same-region ECR.

## Plan / tasks

1. **`[ ]` CI workflow** — `.github/workflows/ci.yml`, on `push`/`pull_request`:
   - `pnpm/action-setup` + `actions/setup-node@20` with `cache: pnpm`.
   - `pnpm install --frozen-lockfile`.
   - `pnpm lint`, `pnpm -w turbo run check-types` (or `typecheck`), `pnpm build`.
   - Cache `.turbo` between runs for incremental builds.
2. **`[ ]` Migration check job** — spin up `services: postgres:16-alpine`, run
   `pnpm --filter api exec prisma migrate deploy` against it to prove migrations apply from clean, and
   `prisma migrate diff`/`migrate status` to catch drift (schema vs migrations).
3. **`[x]` Image build & push** — `.github/workflows/release.yml`, on `main`/`workflow_dispatch`:
   (done for `apps/api`; `apps/web` is on Vercel so not imaged. Multi-arch not enabled.)
   - `docker/setup-buildx-action`, `docker/login-action` (GHCR, `GITHUB_TOKEN`),
     `docker/build-push-action` for `apps/api` and `apps/web`.
   - Tag images with `sha`, `latest`, and semver; enable build cache (`cache-from/to: type=gha`).
   - (Optional) multi‑arch `linux/amd64,linux/arm64`.
4. **`[x]` Deploy job** — SSH-deploys to EC2, self-migrates (`prisma migrate deploy` in the container
   `CMD`), and **health-gates on `GET /api/health` with automatic rollback** to the previous image.
   (Not yet behind an `environment: production` manual-approval gate — follow-up.)
5. **`[ ]` Repo hygiene** — branch protection requiring CI green; status badges in the root README;
   Dependabot/`pnpm audit` step.
6. **`[x]` Secrets** — runtime secrets (`DATABASE_URL`, `REDIS_URL`, JWT/encryption keys, OAuth creds)
   live in `~/deploy/.env` on the box (never baked into the image); CI secrets (SSH key, GHCR PAT)
   in GitHub Actions.

## Pipeline shape

```mermaid
graph LR
    PR["push / PR"] --> CI["CI: install → lint → typecheck → build"]
    CI --> MIG["migrate deploy on ephemeral Postgres"]
    MIG --> GREEN{green?}
    GREEN -->|PR| MERGE["allow merge (branch protection)"]
    GREEN -->|main/tag| IMG["build & push images → GHCR"]
    IMG --> DEP["deploy (manual approval) → migrate → health-gate"]
```

## Definition of Done (demoable)

- A PR shows the CI checks running and required‑to‑merge.
- A merge to `main` publishes `ghcr.io/<you>/supporthub-api:<sha>` and `-web:<sha>`.
- The README shows passing CI badges.
- The deploy job demonstrates `prisma migrate deploy` + health check gating.

## Risks & gotchas

- pnpm workspace caching: cache the pnpm store **and** `.turbo` for real speedups.
- `--frozen-lockfile` fails if the lockfile is stale — keep it committed and current (esp. after T2 adds
  the Socket.IO Redis deps).
- Don't run migrations automatically against prod without approval — keep deploy behind an environment
  gate.
- Note honestly: there are **no automated tests yet**; add at least a smoke test (boot API, hit
  `/api/health`) so CI asserts runtime, and flag a test suite as future work.

## Cost

Free on GitHub Actions' free minutes for public/personal repos; GHCR free for public images.
</content>
