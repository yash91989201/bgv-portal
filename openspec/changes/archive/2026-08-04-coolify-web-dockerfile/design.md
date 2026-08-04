## Context

See proposal.md for motivation. The web app is TanStack Start + Vite with the `nitro/vite` plugin in a Bun monorepo. Convex stays on Convex Cloud. Coolify needs a Dockerfile with monorepo-root context so workspace packages (`@bgv-portal/ui`, `@bgv-portal/env`, `@bgv-portal/backend`) are available at build time.

Validated constraints from investigation:
- Plain `bun dist/server/server.js` serves SSR but not static assets (404s).
- Nitro production output lives in `apps/web/.output` and is started with `node .output/server/index.mjs` (TanStack Start Node/Docker docs).
- Building inside `oven/bun` defaults Nitro to the `bun` preset, which crashes under Node (`Bun is not defined`).
- Slim `.output` is not fully standalone: SSR still `require("react")` at runtime.

## Goals / Non-Goals

**Goals:**
- Coolify-ready multi-stage image with Bun build + Node runtime.
- Correct Nitro `node_server` output and working static asset serving.
- Required build-arg contract for public Convex URLs.
- Local Compose parity and README Coolify settings.

**Non-Goals:**
- Running Convex, databases, or workers inside Coolify.
- Custom Bun `server.ts` runtime (rejected in favor of official Nitro node path).
- Fully inlining `react` into `.output` via Nitro config changes (optional later).
- CI/CD pipeline beyond Dockerfile/Compose artifacts.

## Decisions

### D1: Bun builder + Node runner
- **Decision**: Build with `oven/bun:1.3`, run with `node:24-slim`.
- **Why**: Matches `packageManager: bun@1.3.14` / `bun.lock` for installs, while following TanStack Start's documented Node entrypoint for production.
- **Alternatives considered**: All-Bun image (`nitro({ preset: 'bun' })`) — deferred; Node path is the verified Coolify target. All-Node build — awkward with Bun lockfile/workspaces.

### D2: Force `NITRO_PRESET=node_server` in the image build
- **Decision**: Set `NITRO_PRESET=node_server` in the builder stage env before `vite build`.
- **Why**: Bun-based builds otherwise emit the `bun` preset; Node runner then fails immediately.
- **Alternatives considered**: Hard-code `nitro({ preset: 'node_server' })` in `vite.config.ts` — possible later for local/prod consistency; env override keeps local Bun preview flexibility for now.

### D3: Slim runtime = `.output` + `react` only
- **Decision**: Copy `apps/web/.output` into the runner and `npm install --omit=dev react@19.2.8`.
- **Why**: Smallest verified packaging that serves health, SSR, and static assets. Only external package observed was `react`.
- **Alternatives considered**: Fat `node_modules` copy — heavier. Fully standalone Nitro bundle — requires config work, deferred.

### D4: Repo-root build context, Dockerfile at `apps/web/Dockerfile`
- **Decision**: Coolify/Compose use context `.` and dockerfile `apps/web/Dockerfile`.
- **Why**: Workspace packages are source-linked; root context is required for a correct monorepo build.

### D5: Public env as build args, not runtime secrets
- **Decision**: `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` are required Docker build args; fail the build if empty.
- **Why**: Vite client env is inlined at build time. Runtime-only injection would not update the client bundle.

## Risks / Trade-offs

- [Nitro leaves more packages external later] → Runtime fails with MODULE_NOT_FOUND → extend runner install list or switch to fat/standalone packaging.
- [Public Convex URL change requires rebuild] → Document clearly in README/Coolify build args; no restart-only fix.
- [`.dockerignore` excludes `**/Dockerfile`] → Build still works because `-f apps/web/Dockerfile` reads from client context; do not rely on COPY of Dockerfiles into the image.
- [Auth `SITE_URL` on Convex side is separate from web image] → Operators must still configure Convex env (`SITE_URL`) for better-auth; out of scope for this container but required for login in production.

## Migration Plan

1. Land Dockerfile, compose, `.env.example`, `start` script, README Coolify section.
2. In Coolify: create Dockerfile app, set build args, port 3000, health `/api/health`, deploy.
3. Verify `/api/health`, `/`, and static assets; then exercise login against production Convex.

Rollback: remove Coolify app / stop compose; no database migrations. Application code paths unchanged aside from packaging scripts/docs.

## Open Questions

- Whether to pin `nitro({ preset: 'node_server' })` in `vite.config.ts` so local `vite build` always matches Coolify.
- Whether Coolify should also receive a one-click compose service definition later, or stay Dockerfile-only.
