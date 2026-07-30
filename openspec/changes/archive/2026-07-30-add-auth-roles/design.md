## Context

The project is a TanStack Start + Convex starter with better-auth already wired via `@convex-dev/better-auth` (email/password only, no roles). The BGV portal needs two roles: `admin` (creates and manages candidates) and `user` (candidate, views own application status). Login must be username-based. There is no public registration — the admin creates all accounts, and the first admin is seeded.

Current state:
- `packages/backend/convex/auth.ts` — `betterAuth` with `emailAndPassword` + `convex()` plugin only.
- `apps/web/src/lib/auth-client.ts` — only `convexClient()`.
- `apps/web/src/components/` — separate `sign-in-form.tsx` and `sign-up-form.tsx`.
- `apps/web/src/routes/_auth/` — a protected layout with a stub `dashboard.tsx`.

## Goals / Non-Goals

**Goals:**
- Username + password login via better-auth `username` plugin.
- `admin` / `user` roles via better-auth `admin` plugin, including `admin.createUser()` for later use by the admin dashboard (change `add-admin-dashboard`).
- Single login page with Admin / Candidate tabs (presentational only).
- Role-based post-login redirect and route guards (`/admin/*` vs `/portal`).
- Seed script for the initial admin account.
- Remove public sign-up.

**Non-Goals:**
- Candidate-facing data model (`candidates` table) — belongs to `add-admin-dashboard`.
- Admin dashboard UI and candidate portal UI — later changes.
- Password reset / email verification flows (emails are stored as profile data, not used for auth flows).
- Any negative/terminal application stages.

## Decisions

### D1: better-auth `username` + `admin` plugins over a custom roles table
- **Decision**: Use `username` plugin (server: `username()`, client: `usernameClient()`) and `admin` plugin (server: `admin()`, client: `adminClient()`) from better-auth.
- **Why**: The admin plugin provides `role` on the user model and an admin API (`admin.createUser`, `admin.listUsers`, `admin.setRole`) out of the box, with first-class support in the `@convex-dev/better-auth` adapter. A custom roles table would duplicate what the plugin already gives us and complicate session handling.
- **Alternatives considered**: Custom `users` table with a `role` column managed by app code — rejected (reinvents session/permission plumbing).

### D2: Login tabs are presentational; role comes from the account
- **Decision**: One login form (username + password). Admin/Candidate tabs only change framing/copy. After login, the client reads `session.user.role` and redirects: `admin` → `/admin/dashboard`, `user` → `/portal`.
- **Why**: better-auth has a single sign-in endpoint. Making tabs select different endpoints would add complexity with zero security benefit; authorization is enforced server-side regardless.
- **Alternatives considered**: Separate admin login route/endpoint — rejected (false sense of separation, more code).

### D3: Route guards in TanStack Router `beforeLoad`, not middleware
- **Decision**: A root-level `beforeLoad` already fetches the auth token; extend the pattern — protected layouts (`/admin`, `/portal`) check the session's role in their `beforeLoad` and `redirect()` on mismatch.
- **Why**: Matches the existing codebase pattern (`__root.tsx` already does token fetch in `beforeLoad` via a server function), keeps guard logic colocated with routes.
- **Alternatives considered**: A global client-side guard component — rejected (flash of content, weaker SSR story).

### D4: Admin sets candidate passwords at creation time
- **Decision**: When the admin creates a candidate (in change `add-admin-dashboard`), they enter an initial password in the form and share it out-of-band. This change only ensures `admin.createUser` supports setting a password.
- **Why**: No email delivery infrastructure; simplest flow that satisfies "admin creates the users".
- **Alternatives considered**: Generated temp password shown once; email invite links — rejected (more moving parts, email not available).

### D5: Seed admin via a one-off Convex function
- **Decision**: A seed script (internal mutation or a script calling the auth component's admin API) creates `bgv-admin` / `bgv-admin@kiewitcorporations.com` with role `admin`, password set to the same value as the email (`bgv-admin@kiewitcorporations.com`). Run once via `npx convex run`.
- **Why**: No public sign-up means the first admin cannot self-register; a seed is the standard bootstrap path.

## Risks / Trade-offs

- [Username plugin requires `username` to be unique and normalized; better-auth handles normalization but display casing may differ] → Document that login usernames are case-insensitive per plugin defaults.
- [Removing sign-up breaks any existing accounts/flows from the starter] → Acceptable: greenfield, no production users.
- [Seed password equals the email address — a known, guessable credential] → Acceptable for now per product decision; recommend changing the admin password after first login, and revisit before any production deployment.
- [Role checks in `beforeLoad` depend on session being available SSR-side] → Existing `getToken` server-function pattern already proves this works; reuse it.

## Migration Plan

1. Add plugins to server (`convex/auth.ts`) and client (`lib/auth-client.ts`).
2. `npx convex dev` regenerates the auth component schema with `username` and `role` fields.
3. Replace sign-in/sign-up UI with the tabbed login page; remove sign-up route.
4. Add `/admin` and `/portal` guarded layouts (stub pages are fine; real pages land in later changes).
5. Run the seed script once per environment.

Rollback: revert plugin additions and route changes; no data migration needed (no users exist yet).

## Open Questions

- Whether candidates can later change their own password (better-auth supports it; not in scope for this change's UI).
