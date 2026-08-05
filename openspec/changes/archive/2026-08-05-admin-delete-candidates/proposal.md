## Why

Admins can create and edit candidates in the Enterprise directory but cannot remove mistaken, duplicate, or abandoned applications. The original admin-dashboard design deferred deletion; the directory now needs single-row and bulk hard delete so admins can clean the pipeline without leaving orphan auth accounts or stage history.

## What Changes

- Add an admin-only backend mutation to hard-delete one or more candidates by id (cascade: `statusEvents` → `candidates` → Better Auth user/sessions/accounts)
- Add row selection (current page only) to the candidate directory table
- Add a per-row trash action and a bulk “Delete selected” toolbar
- Confirm destructive deletes with an AlertDialog (name for single, count for bulk)
- Clear selection after delete / page / filter changes; refresh directory and stats via existing Convex reactivity
- Keep delete out of the edit modal for v1

## Capabilities

### New Capabilities

<!-- none — extends existing admin/candidate capabilities -->

### Modified Capabilities

- `candidate-management`: Add admin hard-delete API with cascade teardown of status history and linked auth user; extend admin-only management to include delete
- `admin-dashboard`: Add directory row selection, single delete, bulk delete, and confirmation UX

## Impact

- **Backend**: `packages/backend/convex/candidates.ts` — new `deleteCandidates` mutation; uses `requireAdmin`, `authComponent.getHeaders`, and Better Auth `auth.api.removeUser`
- **Frontend**: `apps/web/src/components/admin/candidate-directory.tsx` — TanStack row selection, checkbox column, trash action, bulk bar, AlertDialog
- **UI kit**: reuse `Checkbox`, `AlertDialog`, destructive `Button` (already present; no new package deps)
- **Auth**: Better Auth admin plugin `removeUser` (already enabled); no schema migration
- **Out of scope**: soft delete/archive, edit-modal delete, cross-page “select all matching filters”, documents/invitations tables (do not exist yet)
