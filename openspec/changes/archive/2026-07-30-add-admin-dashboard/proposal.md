## Why

Admins need a single place to manage candidates: create accounts with full profile information, see pipeline health at a glance, and move candidates through the 11-stage application journey. This is the core operational surface of the BGV portal.

## What Changes

- Add a `candidates` Convex table storing personal info (full name, email, mobile, current location), professional info (total experience, current designation, current department, current salary), and application info (designation applied for, offered department, expected location, salary offered), linked to the auth user, plus a `currentStage` field.
- Add a `statusEvents` table recording every stage change (candidate, stage, timestamp, optional note) to power the journey timeline.
- Add Convex functions: create candidate (auth account + profile in one flow), paginated list, get by id, update profile info, update stage (writes a `statusEvents` entry), and pipeline stats.
- Build the admin overview page: sidebar with nav links, top header, stats cards (total candidates, interviews active, offers pending, BGV in progress), an "Enterprise directory" section with a paginated candidate table, and an "Add Candidate" button opening a modal.
- The Add Candidate modal uses TanStack Form with zod schemas (`z.infer` types) covering all three info groups plus username + initial password.
- Admins can manually update a candidate's stage from the table/detail view; Convex reactivity propagates changes to any logged-in candidate in real time.

## Capabilities

### New Capabilities

- `candidate-management`: Candidate data model, admin-only CRUD functions, 11-stage pipeline with status history, pipeline stats.
- `admin-dashboard`: Admin overview page — stats cards, paginated candidate directory table, add-candidate modal, stage update controls.

### Modified Capabilities

<!-- None — add-auth-roles introduced role-based-auth; this change consumes it without modifying its requirements -->

## Impact

- `packages/backend/convex/schema.ts` — new `candidates` and `statusEvents` tables (currently empty schema).
- `packages/backend/convex/` — new `candidates.ts` functions module.
- `apps/web/src/routes/_auth/admin/` (or equivalent) — admin dashboard route, stats cards, directory table, add-candidate modal components.
- Shared zod schemas for candidate forms (client) mirrored by Convex `v` validators (server).
- Depends on `add-auth-roles` (roles, `admin.createUser`, `/admin` guarded layout). Supersedes its stub dashboard page.
- Uses existing `packages/ui` components: sidebar, table, dialog, card, badge, pagination, form; `@tanstack/react-form` and `zod` already installed.
