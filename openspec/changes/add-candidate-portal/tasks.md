## 1. Candidate-scoped queries

- [ ] 1.1 Add `getMyCandidateProfile` query to `packages/backend/convex/candidates.ts` (resolves auth user → candidate by `userId`, throws if none)
- [ ] 1.2 Add `getMyStatusHistory` query (resolves own candidate id internally; keep the admin-parameterized `getStatusHistory` admin-only)
- [ ] 1.3 Verify non-admin callers cannot pass arbitrary candidate ids to read others' data

## 2. Portal page

- [ ] 2.1 Build the portal header with page identity and a working sign-out button (authClient sign-out → redirect to login)
- [ ] 2.2 Build the greeting card: candidate name, current stage name, stage position (e.g., "Stage 7 of 11"), live from `getMyCandidateProfile`
- [ ] 2.3 Build the tabs container (Application Journey / My Profile) using `packages/ui` tabs

## 3. Application Journey tab

- [ ] 3.1 Build the vertical timeline component: map the 11-stage tuple, join with `getMyStatusHistory` events (completed = has event + timestamp, current = matches `currentStage`, upcoming = rest)
- [ ] 3.2 Show admin notes on completed stages where present
- [ ] 3.3 Style stage states distinctly (completed / current / upcoming) with badges/icons from `packages/ui`

## 4. My Profile tab

- [ ] 4.1 Build the read-only profile display grouped into Personal, Professional, and Application sections with all fields from the candidate record
- [ ] 4.2 Add a graceful empty state if no candidate record exists for the logged-in user

## 5. Verification

- [ ] 5.1 Verify an admin stage change appears live on an open candidate portal (greeting card + timeline)
- [ ] 5.2 Verify skipped-stage journeys render correctly on the timeline
- [ ] 5.3 Verify sign-out returns to the login page and `/portal` is unreachable unauthenticated
- [ ] 5.4 Verify `check-types` passes across the workspace
