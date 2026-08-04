## Context

The final change in the BGV portal trio. `add-auth-roles` delivers login and the guarded `/portal` layout; `add-admin-dashboard` delivers the `candidates` and `statusEvents` tables plus admin functions. This change builds the single candidate-facing page on top of that foundation.

Key product decisions already locked: candidate profiles are read-only (admin maintains all data); the journey has 11 fixed stages with full history in `statusEvents`; Convex reactivity provides live updates with no polling.

## Goals / Non-Goals

**Goals:**
- Candidate-scoped read functions with strict own-record authorization.
- Portal page: header with sign-out; greeting card with name + current stage; tabs for Application Journey and My Profile.
- Journey timeline rendered from `statusEvents` over the fixed 11-stage list (completed with timestamps, current highlighted, upcoming dimmed).
- Read-only profile display grouped as personal / professional / application info.
- Live updates when the admin changes the candidate's stage.

**Non-Goals:**
- Any candidate-side editing (profile is read-only).
- Password change UI, notifications, or email alerts.
- Mobile-specific native work (responsive web only).

## Decisions

### D1: Own-record authorization by resolving the caller's candidate doc
- **Decision**: Portal queries fetch the auth user, then look up `candidates` by `userId`. `getStatusHistory` (shared with the admin dashboard) accepts a `candidateId` only for admins; candidates call a `getMyStatusHistory` that resolves their own id internally.
- **Why**: Prevents IDOR — a candidate must never read another candidate's record by guessing ids. Two entry points (admin-param vs. self-resolved) keeps authorization explicit and simple.
- **Alternatives considered**: One function with a conditional branch on role — rejected (easier to misuse, muddier audit trail).

### D2: Timeline derives from the stage tuple + history, not from history alone
- **Decision**: The UI maps over the fixed 11-stage tuple and joins each stage to its `statusEvents` entry (if any). Stages without an event are "upcoming"; the stage matching `currentStage` is "current"; stages with events are "completed" and show their timestamp.
- **Why**: Candidates who skipped stages (forward jumps allowed) still see the full journey shape; history alone would only show visited stages and confuse the picture.

### D3: Plain reactive queries, no pagination needed
- **Decision**: Portal queries are simple `useQuery` subscriptions (single candidate doc + small event list).
- **Why**: One record, ~11 events max — no pagination, no react-query infinite machinery. Realtime comes free from Convex.

## Risks / Trade-offs

- [Candidate sees salary fields (current salary, salary offered) — deliberate since it's their own data] → Confirmed acceptable by product direction ("my profile shows the user info"); ensure admin list views don't leak other candidates' salaries (handled in `add-admin-dashboard` D-risk).
- [A candidate with no candidate record (e.g., admin account landing here by mistake)] → Route guard already redirects admins; still render a graceful empty state if no record is found.

## Migration Plan

1. Add candidate-scoped queries to `candidates.ts`.
2. Build the portal route and components; replace the stub page from `add-auth-roles`.

Rollback: remove portal route and queries; no schema changes in this change.

## Open Questions

- Greeting card copy and what stage metadata to show (e.g., "Stage 7 of 11" vs. just stage name).
- Whether admin notes on status events are shown verbatim to candidates or curated first (current assumption: shown).
