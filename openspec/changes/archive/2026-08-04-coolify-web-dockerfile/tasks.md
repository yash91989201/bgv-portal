## 1. Packaging files

- [x] 1.1 Add `apps/web/Dockerfile` multi-stage build: Bun install/build from monorepo root, Node slim runner copying `.output`
- [x] 1.2 Force `NITRO_PRESET=node_server` in the builder stage so the Node runner does not receive a Bun preset bundle
- [x] 1.3 Install `react@19.2.8` in the runner stage and start with `node .output/server/index.mjs` on `HOST=0.0.0.0` / `PORT=3000`
- [x] 1.4 Fail the image build when `VITE_CONVEX_URL` or `VITE_CONVEX_SITE_URL` build args are empty
- [x] 1.5 Add container `HEALTHCHECK` probing `GET /api/health`

## 2. Local Compose + app scripts

- [x] 2.1 Add root `docker-compose.yml` for the `web` service (context `.`, dockerfile `apps/web/Dockerfile`, build args, healthcheck, port mapping)
- [x] 2.2 Add `apps/web` `start` script: `node .output/server/index.mjs`
- [x] 2.3 Add `apps/web/.env.example` documenting the Convex public URL build args

## 3. Docs

- [x] 3.1 Update README Deployment section with Coolify settings (base dir `/`, Dockerfile `apps/web/Dockerfile`, port `3000`, health `/api/health`, build args) and Compose usage

## 4. Verification

- [x] 4.1 Build the image locally with Convex build args and confirm `nitro.json` preset is `node-server`
- [x] 4.2 Run the container and verify `/api/health`, `/`, a `/assets/*` CSS file, and `/robots.txt` all return HTTP 200
- [x] 4.3 Confirm a build without required Convex build args fails
