## Why

The BGV portal has two distinct audiences — admins who manage candidates, and candidates who track their application status — but the current starter only has generic email/password auth with no roles and no username login. We need role-based access (admin vs. candidate) and username-based login before any dashboard or portal work can begin.

## What Changes

- Add the better-auth `username` plugin so users log in with username + password instead of email + password.
- Add the better-auth `admin` plugin for role management (`admin` / `user` roles) and admin-only user creation (`admin.createUser`).
- Replace the existing sign-in/sign-up forms with a single login page with presentational Admin / Candidate tabs (same endpoint; role determines post-login redirect).
- **BREAKING**: Remove the public sign-up route — only admins can create accounts.
- Add role-based route guards: `role === "admin"` redirects to `/admin/dashboard`, `role === "user"` redirects to `/portal`; cross-access is blocked.
- Add a seed script that creates the initial admin account (username `bgv-admin`, email `bgv-admin@kiewitcorporations.com`, password `bgv-admin@kiewitcorporations.com` — same as the email, per product decision).

## Capabilities

### New Capabilities

- `role-based-auth`: Username-based login, admin/user roles, role-based redirects and route guards, admin-only account creation, admin seeding.

### Modified Capabilities

<!-- No existing specs in openspec/specs/ — greenfield project -->

## Impact

- `packages/backend/convex/auth.ts` — add `username` and `admin` plugins to better-auth config.
- `apps/web/src/lib/auth-client.ts` — add `usernameClient` and `adminClient` plugins.
- `apps/web/src/routes/` — remove sign-up route/form, rework sign-in into tabbed login page, add role-based redirect logic.
- `apps/web/src/components/sign-in-form.tsx`, `sign-up-form.tsx` — replaced by new login component(s).
- New seed script in `packages/backend` for the initial admin.
- No new npm dependencies expected (plugins ship with `better-auth`).
