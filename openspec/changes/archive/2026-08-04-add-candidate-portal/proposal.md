## Why

Candidates need a simple, self-service view of where they stand: their current stage, how far they've come, and their profile on file. This is the entire candidate-facing experience of the BGV portal — one page, always current thanks to Convex reactivity.

## What Changes

- Add candidate-scoped Convex read functions: the logged-in candidate's own profile and their full status history (no admin role required, but strictly own-record access).
- Build the candidate portal page: header with sign-out, a greeting card showing the candidate's name and current application stage, and tabbed content below.
- "Application Journey" tab: a vertical timeline of all 11 stages, marking completed stages (with timestamps from `statusEvents`), the current stage, and upcoming stages; admin notes shown where present.
- "My Profile" tab: read-only display of the candidate's personal, professional, and application info.
- Stage updates made by admins appear on the candidate's page in real time without reload.

## Capabilities

### New Capabilities

- `candidate-portal`: Candidate self-service page — greeting with current stage, journey timeline from status history, read-only profile view, sign-out.

### Modified Capabilities

<!-- None — consumes candidate-management functions and role-based-auth without changing their requirements -->

## Impact

- `packages/backend/convex/candidates.ts` — add `getMyCandidateProfile` and reuse/extend `getStatusHistory` with own-record authorization.
- `apps/web/src/routes/_auth/portal` (or equivalent) — portal route and components: greeting card, journey timeline, profile tabs.
- Depends on `add-auth-roles` (login, `/portal` guard) and `add-admin-dashboard` (`candidates`/`statusEvents` tables and queries). Supersedes the stub `/portal` page from `add-auth-roles`.
- Uses existing `packages/ui` components: card, tabs, badge, avatar; no new dependencies.
