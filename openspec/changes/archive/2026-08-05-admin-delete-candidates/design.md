## Context

See proposal.md for motivation. Today the admin directory supports list/filter/edit only. Backend candidate APIs live in `packages/backend/convex/candidates.ts` behind `requireAdmin`. Creating a candidate already cascades through Better Auth (`auth.api.createUser`) → `candidates` → initial `statusEvents`. There is no delete API and no FK cascade in Convex. Related app data today is only `statusEvents` (indexed by `candidateId`); documents/invitations tables do not exist yet.

Better Auth’s admin plugin is already enabled. `createUser` works without session headers (session optional when no request/headers). `removeUser` always uses `adminMiddleware` and therefore needs the calling admin’s session headers — available via `authComponent.getHeaders(ctx)` from `@convex-dev/better-auth`.

The directory already uses TanStack Table (`getCoreRowModel` only). Shared UI already exports `Checkbox`, `AlertDialog`, and a destructive `Button` variant; the app has no existing row-selection or confirm-delete pattern.

## Goals / Non-Goals

**Goals:**

- One admin mutation that hard-deletes N candidates with full cascade (status history + auth user/sessions/accounts)
- Directory UX for single delete (trash) and bulk delete (page-scoped selection + toolbar)
- Explicit confirmation before irreversible deletes
- Stats/directory refresh without new client polling (existing Convex reactivity)

**Non-Goals:**

- Soft delete / archive / restore
- Delete action inside the edit modal
- Cross-page or “all matching filters” selection
- Schema migrations or new tables
- Changing pagination from page/pageSize to cursor (known list implementation detail; out of scope)

## Decisions

### D1 — Hard delete cascade order mirrors create (inverted)

For each candidate id: load row → delete all `statusEvents` via `by_candidateId` → delete `candidates` row → call `auth.api.removeUser({ body: { userId }, headers })`.

**Rationale:** Convex has no FK cascades; Better Auth `removeUser` only cleans auth tables. Explicit teardown prevents orphans. Order deletes app data before auth so a failed auth remove can still be retried without resurrecting a profile (or at least leaves a clearer orphan: auth user without candidate). Prefer deleting app rows first so the directory stops showing the candidate immediately even if auth cleanup needs a follow-up.

**Alternatives considered:** Soft delete (`deletedAt`) — deferred for audit/reversibility later. App-data-only hard delete — leaves login orphans. Adapter-level `deleteUser` without `removeUser` — bypasses admin permission checks / self-delete guard.

### D2 — Auth teardown via `removeUser` + `getHeaders`

```
const headers = await authComponent.getHeaders(ctx);
await auth.api.removeUser({ body: { userId }, headers });
```

**Rationale:** Official admin API; deletes sessions, accounts, and user; blocks self-delete. `requireAdmin` remains the app-level gate; headers satisfy Better Auth’s middleware.

**Fallback if headers fail in practice:** After `requireAdmin`, use Better Auth internal/adapter delete path — same cascade, less preferred. Spike this in the first backend task if `getHeaders`/`removeUser` errors.

### D3 — Single mutation `deleteCandidates({ candidateIds })`

Accept an array (1..N). Cap at 50 (matches list pageSize upper bound; UI only ever sends ≤ page size ≈ 10). Fail-fast on first error; return deleted count or throw `ConvexError`.

**Rationale:** One code path for trash and bulk. Page-sized batches make fail-fast acceptable.

**Alternatives:** Separate `deleteCandidate` + `deleteCandidates` — unnecessary duplication. Best-effort partial success report — more UI complexity for little gain at N≤10.

### D4 — Defensive guards

- Skip/reject missing candidate ids with a clear error (fail-fast)
- Refuse if linked auth user `role === "admin"` (candidates are created as `user`; defense in depth)
- Better Auth already refuses deleting the caller’s own user id

### D5 — Directory selection is page-scoped TanStack `rowSelection`

- Checkbox column + header “select page”
- `getRowId: (row) => row._id`
- Clear selection when `page` or filters change and after successful delete
- Bulk bar shows when selected count > 0
- Per-row trash opens the same AlertDialog path with a one-id array

**Rationale:** Matches product choice; avoids “invisible” off-page selections with offset pagination.

### D6 — AlertDialog confirmation

- Single: “Delete {fullName}? Permanently removes profile, stage history, and login.”
- Bulk: “Delete {N} candidates? …”
- Destructive confirm button; cancel dismisses

**Rationale:** UI kit already has AlertDialog; type-to-confirm and undo are heavier and poor fits for hard auth delete.

## Risks / Trade-offs

- **[Risk] `removeUser` fails after app rows deleted** → Mitigation: surface clear error; document orphan auth cleanup path; consider reversing order (auth first) only if testing shows app-first leaves worse orphans — prefer app-first for UX, and keep mutation transactional within Convex for app tables (auth API is external to Convex transaction).
- **[Risk] Convex mutation is not transactional with Better Auth** → Mitigation: same as createCandidate today; accept eventual consistency; fail-fast and toast errors.
- **[Risk] Future tables (documents, invitations) orphaned** → Mitigation: non-goal now; when those tables land, extend the cascade in one place (`deleteCandidates`).
- **[Trade-off] Hard delete is irreversible** → Acceptable for v1 cleaning; soft delete can be a later change.
- **[Trade-off] Page-only select-all** → Safer/simpler; “delete all matching filters” needs a dedicated API later.

## Migration Plan

- No schema migration; deploy backend mutation then frontend together (frontend no-ops until mutation exists).
- Rollback: remove UI actions / mutation; no data backfill required.
- No seed/data transform.

## Open Questions

- None blocking. If `getHeaders` + `removeUser` fails during implementation, use the adapter fallback noted in D2 without changing specs.
