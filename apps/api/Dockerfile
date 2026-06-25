# syntax=docker/dockerfile:1

# ---- base: pnpm available in every stage ----
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# ---- build: install ALL deps, generate Prisma client, compile TS ----
FROM base AS build
# Copy manifests first so this layer is cached unless deps change.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
# Now bring in the source and build (runs `prisma generate` + tsc -> dist/).
COPY apps/api/ apps/api/
# `prisma generate` only emits client code (no DB connection), but prisma.config.ts
# eagerly resolves DATABASE_URL. Provide a throwaway value for the build only — the
# runtime stage is separate and gets the real URL from .env on the box.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm --filter api build:prod
# Flatten a prod-only, symlink-free node_modules for just the `api` package.
# --legacy: pnpm v10 otherwise refuses to deploy a non-injected workspace.
RUN pnpm --filter api deploy --prod --legacy /prod/api

# ---- runtime: minimal image with only what runs in production ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/api/node_modules ./node_modules
COPY --from=build /prod/api/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/generated ./generated
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/prisma.config.ts ./prisma.config.ts

# App binds process.env.PORT || 5000 (see src/index.ts)
EXPOSE 5000

# B2 "self-migrating image": apply DB migrations, then start the server.
# `migrate deploy` is idempotent, so re-running on restart is safe.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
