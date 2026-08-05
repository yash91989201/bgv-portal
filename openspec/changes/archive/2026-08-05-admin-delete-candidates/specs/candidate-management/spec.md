## ADDED Requirements

### Requirement: Admin hard-delete candidates with cascade
The system SHALL allow an admin to permanently delete one or more candidates by id in a single operation. For each candidate, the system SHALL remove all related `statusEvents`, remove the `candidates` row, and remove the linked Better Auth user including that user’s sessions and accounts. Deletion SHALL be irreversible.

#### Scenario: Single candidate hard-deleted
- **WHEN** an admin deletes one candidate by id
- **THEN** that candidate no longer appears in list or stats queries, no status events remain for that candidate id, and the linked auth user can no longer sign in

#### Scenario: Multiple candidates hard-deleted
- **WHEN** an admin deletes a list of candidate ids
- **THEN** every successfully targeted candidate is fully removed with the same cascade as a single delete

#### Scenario: Missing candidate id rejected
- **WHEN** an admin includes a candidate id that does not exist
- **THEN** the system rejects the operation with an error and does not partially apply later ids in the same request (fail-fast)

#### Scenario: Admin auth users cannot be removed via candidate delete
- **WHEN** a candidate’s linked auth user has role `admin`
- **THEN** the system rejects deleting that candidate with an error

### Requirement: Delete is admin-only
Candidate delete functions SHALL verify the caller has role `admin` and SHALL reject unauthenticated or non-admin callers.

#### Scenario: Non-admin cannot delete candidates
- **WHEN** a caller without the admin role attempts to delete candidates
- **THEN** the system rejects the request with an authorization error

## MODIFIED Requirements

### Requirement: Admin-only candidate management functions
All candidate create, update, list, stage-change, and delete functions SHALL verify the caller has role `admin` and SHALL reject unauthenticated or non-admin callers.

#### Scenario: Non-admin cannot create candidates
- **WHEN** a caller without the admin role attempts to create a candidate
- **THEN** the system rejects the request with an authorization error

#### Scenario: Non-admin cannot list candidates
- **WHEN** a caller without the admin role attempts to list or read other candidates
- **THEN** the system rejects the request with an authorization error

#### Scenario: Non-admin cannot delete candidates
- **WHEN** a caller without the admin role attempts to delete candidates
- **THEN** the system rejects the request with an authorization error
