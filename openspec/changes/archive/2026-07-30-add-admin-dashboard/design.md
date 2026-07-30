## Context

With role-based auth in place (`add-auth-roles`), this change delivers the admin's working surface. The Convex schema is currently empty, so the candidate data model is greenfield. The web app has TanStack Start + `@convex-dev/react-query` + `@tanstack/react-form` + full shadcn component set already installed.

The application journey has 11 fixed stages, no negative path (explicit product decision):

```
Application Submitted → HR Screening → Technical Round 1 → Technical Round 2
→ Salary Discussion → Appointment Letter → Background Verification Started
→ BGV Completed → Offer Letter Released → Onboarding → Joined
```

## Goals / Non-Goals

**Goals:**
- Candidate data model: one `candidates` table (three info groups + `currentStage`) linked to the auth user; one `statusEvents` table for stage history.
- Atomic candidate creation: auth account (via `admin.createUser`) + candidate profile + initial `statusEvents` entry.
- Admin-only Convex functions with server-side role enforcement.
- Admin overview page: sidebar + header shell, 4 stats cards, paginated "Enterprise directory" table, Add Candidate modal (TanStack Form + zod), stage update control.
- Real-time propagation: candidate stage updates reflect immediately for any subscribed client.

**Non-Goals:**
- Candidate-facing portal UI (change `add-candidate-portal`), though this change's functions provide its data.
- Editing auth credentials (passwords, usernames) after creation.
- Deleting candidates (no delete UI; can be added later).
- Negative/terminal stages (rejected, on hold) — explicitly excluded.

## Decisions

### D1: Single `candidates` table with flat fields, not one table per info group
- **Decision**: One `candidates` table with all personal/professional/application fields (flat columns, grouped only in the UI and zod schema), plus `userId` (auth user reference) and `currentStage`.
- **Why**: The three groups are conceptual, not relational — every candidate has exactly one of each. Separate tables would triple the join/transaction complexity for zero benefit.
- **Alternatives considered**: Three tables keyed by userId — rejected (needless joins, harder atomicity).

### D2: Separate `statusEvents` table over an embedded array
- **Decision**: Stage history lives in `statusEvents` (`candidateId`, `stage`, `note?`, system `createdAt`), indexed by `candidateId`.
- **Why**: Convex documents have a 1 MiB limit and embedded arrays grow unbounded; a separate table queries efficiently by index and keeps the candidate document small and hot-path friendly.
- **Alternatives considered**: Embedded `history: []` on candidates — rejected (document growth, worse pagination of history).

### D3: Stage as a string union shared between zod and Convex validators
- **Decision**: Define the 11 stages as a const tuple; zod schema uses `z.enum(STAGES)`, Convex schema mirrors with `v.union(v.literal(...))`. `z.infer` produces the client types.
- **Why**: Single source of truth for stage names; Convex requires `v` validators, zod drives forms — both derive from one tuple. `convex-helpers` zod converters are an option but hand-mirroring 11 literals is trivial and avoids a new dependency.
- **Alternatives considered**: `convex-helpers` `zodToConvex` — viable, deferred (adds dependency to save ~15 lines).

### D4: Atomic creation via a single mutation calling the auth component
- **Decision**: A `createCandidate` mutation that (1) creates the auth user through the better-auth admin API, (2) inserts the `candidates` doc, (3) inserts the first `statusEvents` entry (`Application Submitted`).
- **Why**: One user action = one consistent outcome; no orphan auth accounts without profiles.

### D5: Stage transitions are validated as forward-only by index, but admin may skip stages
- **Decision**: `updateStage` validates that the new stage exists in the enum and is not earlier than the current stage (by index); skipping forward is allowed (e.g., a candidate can jump past a round). No backward moves.
- **Why**: Real pipelines skip steps; forbidding backward moves prevents accidental history corruption. `statusEvents` preserves the actual path taken.
- **Alternatives considered**: Strict adjacent-only transitions — rejected (too rigid for manual admin operation).

### D6: Server-side role enforcement in every function
- **Decision**: Every admin function fetches the auth user and throws unless `role === "admin"`. Candidate self-read functions (for the portal) verify `userId` matches the caller.
- **Why**: Convex functions are public endpoints; client-side guards are UX, not security.

### D7: Stats computed by a dedicated query, not client-side aggregation
- **Decision**: A `getPipelineStats` query returns `{ total, interviewsActive, offersPending, bgvInProgress }`, computed by scanning candidates (collect is fine at this scale).
- **Why**: Keeps stat definitions consistent; trivial cost at expected scale (hundreds of candidates). If scale grows, swap for the Convex aggregate component without changing the UI.
- Stat mapping: `interviewsActive` = stages HR Screening..Salary Discussion; `offersPending` = Appointment Letter, Offer Letter Released; `bgvInProgress` = Background Verification Started..BGV Completed.

### D8: Pagination via Convex `paginate` with cursor, driven by `@convex-dev/react-query`
- **Decision**: Directory table uses a paginated query (`paginationOpts`), newest-first by creation time.
- **Why**: Built-in Convex pagination; reactive (page updates live when candidates are added).

## Risks / Trade-offs

- [Flat salary fields (current salary, salary offered) are sensitive PII] → Server-side role checks on every read; candidate self-read only sees own record. No salary data in list views unless needed — table shows name, applied-for designation, stage, location.
- [Forward-only stage rule may frustrate genuine corrections] → Mitigate with an optional note on each `statusEvents` entry; a "correct stage" admin function can be added later if needed.
- [`collect()` in stats query reads all candidates] → Fine at expected scale; documented upgrade path to aggregates component.
- [Duplicate usernames on candidate creation] → Surface the better-auth error in the modal with a clear message.

## Migration Plan

1. Deploy schema (`candidates`, `statusEvents`) — pure addition, no existing data.
2. Deploy functions.
3. Ship admin UI; replaces the stub `/admin/dashboard` from `add-auth-roles`.

Rollback: remove routes/functions; drop new tables (empty in practice).

## Open Questions

- Exact table columns for the directory (proposal: name, applied-for designation, current stage badge, expected location, created date).
- Whether the Add Candidate modal is one long form or a 3-step wizard (lean: single scrollable modal with grouped sections).
