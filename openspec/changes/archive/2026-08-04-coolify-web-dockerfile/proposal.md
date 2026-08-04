## Why

The BGV portal needs a production-ready way to run the TanStack Start web app on Coolify. The Better-T-Stack project was generated with Docker as the web deploy target, but the actual `apps/web/Dockerfile` and compose wiring were missing. Without a verified container image, Coolify cannot host the SSR app.

## What Changes

- Add a multi-stage `apps/web/Dockerfile` that builds the monorepo with Bun and runs Nitro's Node server output.
- Force Nitro `node_server` preset during Docker builds so the Node runner does not receive a Bun-only server bundle.
- Ship a slim runtime image: `.output` plus the `react` CJS external required by Nitro SSR.
- Add root `docker-compose.yml` for local parity with Coolify's Dockerfile workflow.
- Add `apps/web` `start` script (`node .output/server/index.mjs`) per TanStack Start Node/Docker docs.
- Document Coolify settings (base dir, Dockerfile path, port, healthcheck, build args) in the README.
- Treat public Convex URLs (`VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`) as required image build args.

## Capabilities

### New Capabilities

- `web-container-deploy`: Production container packaging and Coolify/Compose deployment for the TanStack Start web app (build args, Nitro node-server runtime, healthcheck, port binding).

### Modified Capabilities

<!-- None — deployment packaging does not change product auth/portal/admin requirements -->

## Impact

- New files: `apps/web/Dockerfile`, `docker-compose.yml`, `apps/web/.env.example`.
- Touched: `apps/web/package.json` (add `start`), `README.md` (Coolify + compose docs).
- Existing `.dockerignore` already excludes secrets and build artifacts; keep using repo-root build context.
- Convex remains on Convex Cloud — Coolify only runs the SSR web container.
- Operators must set Coolify build args for Convex public URLs; changing them requires image rebuild.
