## 1. Backend auth plugins

- [ ] 1.1 Add `username` and `admin` plugins to the better-auth config in `packages/backend/convex/auth.ts`
- [ ] 1.2 Add `usernameClient` and `adminClient` plugins to `apps/web/src/lib/auth-client.ts`
- [ ] 1.3 Run `npx convex dev` to regenerate `_generated` types with the new plugin fields and verify the deployment accepts the schema

## 2. Login page rework

- [ ] 2.1 Create a tabbed login component (Admin / Candidate tabs over one shared username+password form) using `packages/ui` tabs, input, and button components
- [ ] 2.2 Wire the form to `authClient.signIn.username` and redirect by `session.user.role` (`admin` → `/admin/dashboard`, `user` → `/portal`)
- [ ] 2.3 Replace the existing sign-in route with the new login page
- [ ] 2.4 Remove the sign-up route and delete `apps/web/src/components/sign-up-form.tsx`
- [ ] 2.5 Remove the email/password sign-in form (`sign-in-form.tsx`) once the new login page works

## 3. Role-based route guards

- [ ] 3.1 Add an `/admin` protected layout route with `beforeLoad` that redirects non-admins (to `/portal` if logged in as user, to login if unauthenticated)
- [ ] 3.2 Add a `/portal` protected layout route with `beforeLoad` that redirects non-users (to `/admin/dashboard` if admin, to login if unauthenticated)
- [ ] 3.3 Add stub pages for `/admin/dashboard` and `/portal` so redirects have somewhere to land
- [ ] 3.4 Update the root index route to redirect based on session/role instead of rendering the starter landing page

## 4. Admin seed

- [ ] 4.1 Write a seed script/internal mutation that creates username `bgv-admin`, email `bgv-admin@kiewitcorporations.com`, password `bgv-admin@kiewitcorporations.com`, role `admin`
- [ ] 4.2 Make the seed idempotent (skip if admin already exists)
- [ ] 4.3 Run the seed in the dev environment and verify login as `bgv-admin` reaches `/admin/dashboard`

## 5. Verification

- [ ] 5.1 Verify unauthenticated visitors are redirected to login from `/admin/*` and `/portal`
- [ ] 5.2 Verify a role-`user` account cannot reach `/admin/*` and an admin cannot stay on `/portal`
- [ ] 5.3 Verify `bun run check-types` (or `npm run check-types`) passes across the workspace
