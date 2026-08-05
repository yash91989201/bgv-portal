## 1. Backend delete API

- [x] 1.1 Add `deleteCandidates` mutation in `packages/backend/convex/candidates.ts` with `candidateIds: v.array(v.id("candidates"))`, `requireAdmin`, and a hard cap (≤50 ids)
- [x] 1.2 For each id: load candidate; fail-fast if missing; reject if linked auth user role is `admin`
- [x] 1.3 Cascade delete: all `statusEvents` via `by_candidateId`, then the `candidates` row
- [x] 1.4 Tear down auth with `authComponent.getHeaders(ctx)` + `auth.api.removeUser({ body: { userId }, headers })`; map Better Auth errors to `ConvexError`
- [x] 1.5 Verify locally: admin can delete a seed/test candidate; non-admin is rejected; directory/stats queries no longer include the deleted id; auth user cannot sign in

## 2. Directory selection UX

- [x] 2.1 Enable TanStack `rowSelection` on `candidate-directory.tsx` with `getRowId: (row) => row._id` and controlled selection state
- [x] 2.2 Add checkbox column + header select-all for the current page using shared `Checkbox`
- [x] 2.3 Clear selection when `page` / name / position / stage filters change
- [x] 2.4 Show a bulk action bar with selected count when selection is non-empty

## 3. Delete actions + confirmation

- [x] 3.1 Add per-row trash control beside edit in the Actions column
- [x] 3.2 Wire single and bulk delete through one AlertDialog (name for single; count for bulk) with irreversible-warning copy
- [x] 3.3 Call `deleteCandidates` on confirm; toast success/error; clear selection on success; keep selection usable for retry on failure
- [x] 3.4 Confirm edit modal remains delete-free for v1

## 4. Smoke verification

- [x] 4.1 Manually verify single delete confirm/cancel paths on the admin dashboard
- [x] 4.2 Manually verify page-scoped select-all, bulk delete, selection clear on page/filter change, and stats refresh after delete
