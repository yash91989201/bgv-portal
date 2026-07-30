## 1. Data model

- [ ] 1.1 Define the 11-stage const tuple in a shared location and add `candidates` and `statusEvents` tables (with indexes: candidates by `userId`, statusEvents by `candidateId`) to `packages/backend/convex/schema.ts`
- [ ] 1.2 Run `npx convex dev` to apply the schema and regenerate types

## 2. Convex functions

- [ ] 2.1 Create `packages/backend/convex/candidates.ts` with an admin-role guard helper (fetch auth user, throw unless `role === "admin"`)
- [ ] 2.2 Implement `createCandidate` mutation: create auth user via better-auth admin API, insert candidate profile, insert initial `statusEvents` entry (Application Submitted)
- [ ] 2.3 Implement `listCandidates` paginated query (cursor-based, newest first)
- [ ] 2.4 Implement `getCandidate` query (admin-only)
- [ ] 2.5 Implement `updateCandidateInfo` mutation (admin-only, profile fields only — not credentials)
- [ ] 2.6 Implement `updateStage` mutation: validate forward-only transition, update `currentStage`, insert `statusEvents` entry with optional note
- [ ] 2.7 Implement `getPipelineStats` query with the agreed stage-to-stat mapping
- [ ] 2.8 Implement `getStatusHistory` query for a candidate's ordered stage events (used by the portal change)

## 3. Shared zod schemas

- [ ] 3.1 Define zod schemas for the add-candidate form (credentials + personal + professional + application groups) with `z.infer` exported types
- [ ] 3.2 Ensure stage enum in zod and Convex `v.union` validators derive from the same stage tuple

## 4. Admin dashboard UI

- [ ] 4.1 Build the admin shell: sidebar with nav links + top header with page heading (use `packages/ui` sidebar components)
- [ ] 4.2 Build stats cards wired to `getPipelineStats` (total, interviews active, offers pending, BGV in progress)
- [ ] 4.3 Build the "Enterprise directory" paginated table (name, designation applied for, stage badge, expected location) wired to `listCandidates`
- [ ] 4.4 Build the Add Candidate modal with TanStack Form + zod validation, grouped sections for the three info groups plus username/password, wired to `createCandidate`
- [ ] 4.5 Add a stage-update control (select of later stages + optional note) wired to `updateStage`
- [ ] 4.6 Handle creation errors (e.g., duplicate username) with clear inline/toast feedback

## 5. Verification

- [ ] 5.1 Verify creating a candidate makes it appear in the directory in real time and starts it at Application Submitted
- [ ] 5.2 Verify forward-only stage updates, history recording, and backward-move rejection
- [ ] 5.3 Verify a non-admin session cannot call any admin function (server-side rejection)
- [ ] 5.4 Verify stats cards update live when stages change
- [ ] 5.5 Verify `check-types` passes across the workspace
