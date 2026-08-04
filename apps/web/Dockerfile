# syntax=docker/dockerfile:1
#
# Coolify / production image for TanStack Start (Vite + Nitro node-server).
# Build context MUST be the monorepo root.
#
# Coolify:
#   Base Directory : /
#   Dockerfile     : apps/web/Dockerfile
#   Port           : 3000
#   Healthcheck    : /api/health
#   Build Args     : VITE_CONVEX_URL, VITE_CONVEX_SITE_URL

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM oven/bun:1.3 AS builder
WORKDIR /app

# Cache dependency install on lockfile / package manifests
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/backend/package.json ./packages/backend/
COPY packages/config/package.json ./packages/config/
COPY packages/env/package.json ./packages/env/
COPY packages/ui/package.json ./packages/ui/

RUN bun install --frozen-lockfile

# Sources required to build `web` (workspace packages are source-linked)
COPY tsconfig.json ./
COPY apps/web ./apps/web
COPY packages ./packages

# Public Vite env is inlined at build time — set these as Coolify build args
ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL
RUN test -n "$VITE_CONVEX_URL" || (echo "ERROR: VITE_CONVEX_URL build-arg is required" >&2 && exit 1)
RUN test -n "$VITE_CONVEX_SITE_URL" || (echo "ERROR: VITE_CONVEX_SITE_URL build-arg is required" >&2 && exit 1)

ENV VITE_CONVEX_URL=$VITE_CONVEX_URL \
    VITE_CONVEX_SITE_URL=$VITE_CONVEX_SITE_URL \
    SKIP_ENV_VALIDATION=1 \
    NITRO_PRESET=node_server

WORKDIR /app/apps/web
RUN bun run build

# ---------------------------------------------------------------------------
# Runtime — Nitro node-server output + react external
# ---------------------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Nitro emits a mostly-standalone .output, but leaves `react` as a CJS external
COPY --from=builder /app/apps/web/.output ./.output
RUN npm install --omit=dev react@19.2.8 \
  && npm cache clean --force

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
