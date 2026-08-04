# bgv-portal

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Nx** - Smart monorepo task orchestration and caching

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@bgv-portal/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Deployment

### Coolify (recommended)

Deploy `apps/web` as a Dockerfile application:

| Setting | Value |
| --- | --- |
| Base Directory | `/` (repo root) |
| Dockerfile | `apps/web/Dockerfile` |
| Port | `3000` |
| Healthcheck Path | `/api/health` |
| Build Args | `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` |

Those `VITE_*` values are public Convex URLs and are **baked into the client bundle at image build time**. Changing them requires a rebuild, not just a restart.

Convex itself stays on Convex Cloud — only the TanStack Start SSR app runs in Coolify.

Runtime entrypoint (matches [TanStack Start Node/Docker docs](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)):

```bash
node .output/server/index.mjs
```

### Docker Compose (local)

- Target: web
- Config: `docker-compose.yml` (Dockerfile: `apps/web/Dockerfile`)
- Build images: `bun run docker:build`
- Start: `bun run docker:up`
- Logs: `bun run docker:logs`
- Stop: `bun run docker:down`

Pass build args via env (or `apps/web/.env`):

```bash
export VITE_CONVEX_URL=https://your-deployment.convex.cloud
export VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
bun run docker:up
```

## Git Hooks and Formatting

- Run checks: `bun run check`

## Project Structure

```
bgv-portal/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Biome formatting and linting
- `bun run docker:build`: Build the Docker Compose images
- `bun run docker:up`: Build and start the Docker Compose stack
- `bun run docker:logs`: Tail logs from the Docker Compose stack
- `bun run docker:down`: Stop the Docker Compose stack
