# web-container-deploy Specification

## Purpose

Defines how the TanStack Start web app is packaged and run as a production container for Coolify (and local Docker Compose), including build-time public env, runtime entrypoint, and health probing.

## Requirements

### Requirement: Multi-stage web container image
The system SHALL provide a Dockerfile for `apps/web` that builds from the monorepo root and produces a production image capable of serving SSR HTML and static assets.

#### Scenario: Image builds with required public Convex URLs
- **WHEN** an operator builds the image with non-empty `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` build args
- **THEN** the build completes successfully and those values are available to the client/SSR bundle baked into the image

#### Scenario: Build fails without required public Convex URLs
- **WHEN** an operator builds the image without `VITE_CONVEX_URL` or without `VITE_CONVEX_SITE_URL`
- **THEN** the build fails before producing a runnable image

### Requirement: Node server runtime for Coolify
The production container SHALL start a Node.js HTTP server that listens on `0.0.0.0` and honors `PORT` (default `3000`), serving both dynamic routes and static assets from the Nitro build output.

#### Scenario: Container binds for reverse proxy
- **WHEN** the container starts with `HOST=0.0.0.0` and `PORT=3000`
- **THEN** the HTTP server accepts connections on all interfaces at port 3000

#### Scenario: SSR page and static assets succeed
- **WHEN** a client requests `/` and a referenced `/assets/*` CSS or JS file from a healthy container
- **THEN** both responses return HTTP 200 with appropriate content types

### Requirement: Healthcheck endpoint for orchestration
The deployed web app SHALL expose `GET /api/health` returning HTTP 200 and a JSON body indicating healthy status, suitable for Coolify/Compose healthchecks.

#### Scenario: Health probe succeeds on running container
- **WHEN** an orchestrator requests `GET /api/health` on the listening port
- **THEN** the response is HTTP 200 with JSON containing a healthy status indicator

### Requirement: Coolify-compatible packaging contract
The deployment packaging SHALL support Coolify Dockerfile deploys with repository-root build context and Dockerfile path `apps/web/Dockerfile`, without requiring Convex to run inside Coolify.

#### Scenario: Coolify uses documented paths
- **WHEN** Coolify is configured with base directory `/`, Dockerfile `apps/web/Dockerfile`, port `3000`, and healthcheck `/api/health`
- **THEN** the resulting deployment can serve the web application against an external Convex Cloud backend

#### Scenario: Compose local parity
- **WHEN** an operator runs the root `docker-compose.yml` web service with the same Convex build args
- **THEN** the service builds from `apps/web/Dockerfile` and exposes the container port for local verification
